import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as fs from 'fs';
import * as path from 'path';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

// ========================== 常量定义 ==========================
const COMPONENTS_DIR = path.resolve(process.cwd(), 'app/kwc');

export default defineConfig(({ command, mode }) => {
    const isBuild = command === 'build';
    const isDebugBuild = isBuild && mode === 'development';
    const isProdBuild = isBuild && mode === 'production';
    const TEMP_ENTRY_DIR = path.resolve(process.cwd(), 'temp-entry');
    const entryPoints = {};

    // 只在构建环境生成临时入口文件
    if (isBuild) {
        // 清理并重新创建临时目录
        if (fs.existsSync(TEMP_ENTRY_DIR)) {
            fs.rmSync(TEMP_ENTRY_DIR, { recursive: true, force: true });
        }
        fs.mkdirSync(TEMP_ENTRY_DIR, { recursive: true });

        // 为每个组件生成入口文件
        fs.readdirSync(COMPONENTS_DIR).forEach(componentName => {
            // 检查 index.jsx 和 index.js 文件
            const componentPathJsx = path.join(COMPONENTS_DIR, componentName, 'index.jsx');
            const componentPathJs = path.join(COMPONENTS_DIR, componentName, 'index.js');

            // 优先使用 index.jsx，如果不存在则使用 index.js
            let fileExtension;

            if (fs.existsSync(componentPathJsx)) {
                fileExtension = '.jsx';
            } else if (fs.existsSync(componentPathJs)) {
                fileExtension = '.js';
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
            const entryFile = path.join(TEMP_ENTRY_DIR, `${componentName}.jsx`);
            fs.writeFileSync(entryFile, entryContent);

            // 将临时入口文件添加到构建入口点
            entryPoints[componentName] = entryFile;
        });
    }

    // 构建完成后清理临时目录的插件
    const cleanupTempDirPlugin = {
        name: 'cleanup-temp-dir',
        closeBundle() {
            // 只在非watch模式下清理临时目录
            // 在watch模式下，临时目录需要保持存在以便后续重新构建
            if (isBuild && !isDebugBuild && fs.existsSync(TEMP_ENTRY_DIR)) {
                fs.rmSync(TEMP_ENTRY_DIR, { recursive: true, force: true });
            }
        }
    };

    // 开发服务器配置（npm run dev）
    const devServerConfig = {
        rollupOptions: {
            external: () => false,
            input: 'app/kwc/main.jsx'
        }
    };

    // 调试构建配置（npm run debug:build）
    const debugBuildConfig = {
        outDir: 'dist',
        emptyOutDir: true,
        assetsInlineLimit: 40960, // 40KB
        minify: false, // 不压缩代码，便于调试
        sourcemap: true, // 生成sourcemap，便于调试
        lib: {
            formats: ['es'],
            entry: Object.keys(entryPoints).length ? entryPoints : 'app/kwc/main.jsx',
            name: '[name]',
            fileName: 'kwc/[name]/index'
        },
        rollupOptions: {
            external: ['react', 'react-dom', 'react-dom/client'],
            input: Object.keys(entryPoints).length ? entryPoints : 'app/kwc/main.jsx',
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
            entry: Object.keys(entryPoints).length ? entryPoints : 'app/kwc/main.jsx',
            name: '[name]',
            fileName: 'kwc/[name]/index'
        },
        rollupOptions: {
            external: ['react', 'react-dom', 'react-dom/client'],
            input: Object.keys(entryPoints).length ? entryPoints : 'app/kwc/main.jsx',
            output: {
                format: 'es',
                esModule: true
            }
        }
    };

    return {
        define: {
            'process.env.NODE_ENV': isDebugBuild ? JSON.stringify('development')
                : (isProdBuild ? JSON.stringify('production')
                    : JSON.stringify('development'))
        },

        esbuild: {
            drop: isProdBuild ? ['console', 'debugger'] : []
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
        ].filter(Boolean),
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
        logLevel: isBuild ? 'info' : 'warn'
    };
});
