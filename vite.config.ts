import { defineConfig, ConfigEnv, ESBuildOptions } from 'vite';
import react from '@vitejs/plugin-react';
import * as fs from 'fs';
import * as path from 'path';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

// ========================== 常量定义 ==========================
const COMPONENTS_DIR = path.resolve(process.cwd(), 'app/kwc');

// ========================== 插件定义 ==========================

export default defineConfig(({ command, mode }: ConfigEnv) => {
    const isBuild = command === 'build';
    const isDebugBuild = isBuild && mode === 'development';
    const isProdBuild = isBuild && mode === 'production';
    const TEMP_ENTRY_DIR = path.resolve(process.cwd(), 'temp-entry');
    const entryPoints: Record<string, string> = {};

    // 只在构建环境生成临时入口文件
    if (isBuild) {
        // 清理并重新创建临时目录
        if (fs.existsSync(TEMP_ENTRY_DIR)) {
            fs.rmSync(TEMP_ENTRY_DIR, { recursive: true, force: true });
        }
        fs.mkdirSync(TEMP_ENTRY_DIR, { recursive: true });

        // 为每个组件生成入口文件
        fs.readdirSync(COMPONENTS_DIR).forEach(componentName => {
            // 检查 index.tsx 和 index.ts 文件
            const componentPathTsx = path.join(COMPONENTS_DIR, componentName, 'index.tsx');
            const componentPathTs = path.join(COMPONENTS_DIR, componentName, 'index.ts');

            // 优先使用 index.tsx，如果不存在则使用 index.ts
            let fileExtension;

            if (fs.existsSync(componentPathTsx)) {
                fileExtension = '.tsx';
            } else if (fs.existsSync(componentPathTs)) {
                fileExtension = '.ts';
            } else {
                return; // 如果两种文件都不存在，则跳过该组件
            }

            const entryContent = `
import React from 'react';
import ReactDOM from 'react-dom/client';
import Component from '../app/kwc/${componentName}/index${fileExtension}';

let root = null;

export function mount(mountPoint, props = {}) {
  root = ReactDOM.createRoot(mountPoint);
  root.render(React.createElement(Component, props));
  return mountPoint;
}

// 更新组件
export function update(props = {}) {
  if (root) {
    root.render(React.createElement(Component, props));
  }
}

// 卸载组件
export function unmount() {
  if (root) {
    root.unmount();
    root = null;
  }
}

// 导出组件和方法，确保与 kwcInstance.js 兼容
export default {
  Component,
  mount,
  update,
  unmount
};

// 同时导出独立的方法
export { Component };
        `.trim();

            // 写入临时入口文件
            const entryFile = path.join(TEMP_ENTRY_DIR, `${componentName}.tsx`);
            fs.writeFileSync(entryFile, entryContent);

            // 将临时入口文件添加到构建入口点
            entryPoints[componentName] = entryFile;
        });
    }

    // 构建完成后清理临时目录的插件
    const cleanupTempDirPlugin = {
        name: 'cleanup-temp-dir',
        closeBundle() {
            // 只在生产构建模式下清理临时目录，debug:build模式下不清理
            if (isBuild && !isDebugBuild && fs.existsSync(TEMP_ENTRY_DIR)) {
                fs.rmSync(TEMP_ENTRY_DIR, { recursive: true, force: true });
            }
        }
    };

    // 开发服务器配置（npm run dev）
    const devServerConfig = {
        rollupOptions: {
            external: () => false,
            input: 'app/kwc/main.tsx'
        }
    };

    // 调试构建配置（npm run debug:build）
    const debugBuildConfig = {
        outDir: 'dist',
        emptyOutDir: true,
        assetsInlineLimit: 40960, // 40KB
        minify: false, // 不压缩代码，便于调试
        lib: {
            formats: ['es'],
            entry: entryPoints,
            name: '[name]',
            fileName: 'kwc/[name]/index'
        },
        rollupOptions: {
            external: ['react', 'react-dom', 'react-dom/client'],
            input: entryPoints,
            output: {
                format: 'es',
                esModule: true
            }
        }
    };

    // 生产构建配置（npm run build）
    const prodBuildConfig = {
        outDir: 'dist',
        emptyOutDir: true,
        assetsInlineLimit: 40960, // 40KB
        minify: 'esbuild', // 生产环境压缩代码
        lib: {
            formats: ['es'],
            entry: entryPoints,
            name: '[name]',
            fileName: 'kwc/[name]/index'
        },
        rollupOptions: {
            external: ['react', 'react-dom', 'react-dom/client'],
            input: entryPoints,
            output: {
                format: 'es',
                esModule: true
            }
        }
    };

    return {
        define: {
            'process.env.NODE_ENV': isProdBuild ? JSON.stringify('production') : JSON.stringify('development')
        },

        esbuild: {
            // 只在生产构建模式下移除console和debugger
            drop: isProdBuild ? ['console', 'debugger'] as ESBuildOptions['drop'] : []
        },

        root: isBuild ? undefined : 'app/kwc',

        // 公共配置
        server: {
            port: 3000
        },
        plugins: [
            react(),
            cssInjectedByJsPlugin(),
            cleanupTempDirPlugin
        ].filter(Boolean), // 过滤掉false值的插件
        build: {
            chunkSizeWarningLimit: 1024,
            cssCodeSplit: false,
            ...(isDebugBuild ? debugBuildConfig
                : (isProdBuild ? prodBuildConfig
                    : devServerConfig))
        },
        css: {
            modules: {
                generateScopedName: '[name]__[local]__[hash:base64:6]'
            },
            preprocessorOptions: {
                scss: {
                    quietDeps: true,
                    api: 'modern'
                }
            },
            codeSplit: false,
            extract: false,
            inject: true
        },
        logLevel: isBuild ? 'info' as const : 'warn' as const
    };
});
