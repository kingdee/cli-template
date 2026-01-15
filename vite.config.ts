import { defineConfig, ConfigEnv, ESBuildOptions } from 'vite'
import react from '@vitejs/plugin-react'
import * as fs from 'fs'
import * as path from 'path'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

// ========================== 常量定义 ==========================
const COMPONENTS_DIR = path.resolve(process.cwd(), 'app/kwc')

// ========================== 插件定义 ==========================

export default defineConfig(({ command }: ConfigEnv) => {
  const isBuild = command === 'build'
  const TEMP_ENTRY_DIR = path.resolve(process.cwd(), 'temp-entry')
  const entryPoints: Record<string, string> = {}

  // 只在构建环境生成临时入口文件
  if (isBuild) {
    // 清理并重新创建临时目录
    if (fs.existsSync(TEMP_ENTRY_DIR)) {
      fs.rmSync(TEMP_ENTRY_DIR, { recursive: true, force: true })
    }
    fs.mkdirSync(TEMP_ENTRY_DIR, { recursive: true })

    // 为每个组件生成入口文件
    fs.readdirSync(COMPONENTS_DIR).forEach(componentName => {
      const componentPath = path.join(COMPONENTS_DIR, componentName, 'index.tsx')
      if (fs.existsSync(componentPath)) {
        const entryContent = `
import React from 'react';
import ReactDOM from 'react-dom/client';
import Component from '../app/kwc/${componentName}/index.tsx';

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
        `.trim()

        // 写入临时入口文件
        const entryFile = path.join(TEMP_ENTRY_DIR, `${componentName}.tsx`)
        fs.writeFileSync(entryFile, entryContent)

        // 将临时入口文件添加到构建入口点
        entryPoints[componentName] = entryFile
      }
    })
  }

  // 构建完成后清理临时目录的插件
  const cleanupTempDirPlugin = {
    name: 'cleanup-temp-dir',
    closeBundle() {
      if (isBuild && fs.existsSync(TEMP_ENTRY_DIR)) {
        fs.rmSync(TEMP_ENTRY_DIR, { recursive: true, force: true });
      }
    }
  };

  // 开发环境配置
  const devBuildConfig = {
    rollupOptions: {
      external: () => false,
      input: 'app/kwc/main.tsx'
    }
  };

  // 构建环境配置
  const prodBuildConfig = {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 40960, // 40KB
    lib: {
      formats: ['es'] as Array<'es'>,
      entry: entryPoints,
      name: '[name]',
      fileName: '[name]/index'
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react-dom/client'],
      input: entryPoints,
      output: {
        format: 'es' as const,
        esModule: true
      }
    },
  };

  return {
    define: {
      'process.env.NODE_ENV': isBuild ? JSON.stringify('production') : JSON.stringify('development'),
    },

    esbuild: {
      drop: ['console', 'debugger'] as ESBuildOptions['drop'],
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
      ...(isBuild ? prodBuildConfig : devBuildConfig)
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
  }
})