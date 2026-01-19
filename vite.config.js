// / <reference types="vitest" />
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import fs from 'fs';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

// ========================== Constants ==========================
const COMPONENTS_DIR = path.resolve(process.cwd(), 'app/kwc');
const TEMP_ENTRY_DIR = path.resolve(process.cwd(), 'temp-entry');

export default defineConfig(({ command, mode }) => {
  const isBuild = command === 'build';
  const isDebugBuild = isBuild && mode === 'development';
  const isProdBuild = isBuild && mode === 'production';
  const entryPoints = {};

  if (isBuild) {
    // 1. Clean and recreate temp directory
    if (fs.existsSync(TEMP_ENTRY_DIR)) {
      fs.rmSync(TEMP_ENTRY_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEMP_ENTRY_DIR, { recursive: true });

    // 2. Scan components and generate entry files
    if (fs.existsSync(COMPONENTS_DIR)) {
      const folders = fs.readdirSync(COMPONENTS_DIR);
      folders.forEach(componentName => {
        const componentDir = path.join(COMPONENTS_DIR, componentName);
        if (!fs.statSync(componentDir).isDirectory()) {return;}

        const componentFile = path.join(componentDir, `${componentName}.ce.vue`);
        if (fs.existsSync(componentFile)) {
          const relativePath = path.relative(TEMP_ENTRY_DIR, componentFile).replace(/\\/g, '/');
          const entryContent = `
import { defineCustomElement } from 'vue'
import Component from '${relativePath}'

// Create the custom element constructor
const Element = defineCustomElement(Component)

// Register the custom element
function register(name = '${componentName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}') {
  if (!customElements.get(name)) {
    customElements.define(name, Element)
  }
}

export default { Element, register }
export { Element, register }
`.trim();

          const entryFile = path.join(TEMP_ENTRY_DIR, `${componentName}.js`);
          fs.writeFileSync(entryFile, entryContent);
          entryPoints[componentName] = entryFile;
        }
      });
    }
  }

  // Plugin to cleanup temp dir after build
  const cleanupTempDirPlugin = {
    name: 'cleanup-temp-dir',
    closeBundle() {
      if (!isDebugBuild && fs.existsSync(TEMP_ENTRY_DIR)) {
        // Delay slightly to ensure file handles are released
        setTimeout(() => {
          if (fs.existsSync(TEMP_ENTRY_DIR)) {
            fs.rmSync(TEMP_ENTRY_DIR, { recursive: true, force: true });
          }
        }, 500);
      }
    }
  };

  const isWatch = process.argv.includes('--watch') || process.argv.includes('-w');

  return {
    define: {
      'process.env.NODE_ENV': isProdBuild ? JSON.stringify('production') : JSON.stringify('development')
    },

    esbuild: {
      drop: isProdBuild ? ['console', 'debugger'] : []
    },

    server: {
      port: 3000,
      open: true
    },

    plugins: [
      vue(),
      cssInjectedByJsPlugin(),
      !isWatch && cleanupTempDirPlugin
    ].filter(Boolean),

    build: {
      outDir: 'dist',
      emptyOutDir: !isWatch,
      assetsInlineLimit: 40960,
      chunkSizeWarningLimit: 1024,
      cssCodeSplit: false,
      minify: 'esbuild',
      lib: isBuild ? {
        entry: entryPoints,
        formats: ['es']
      } : undefined,
      rollupOptions: isBuild ? {
        external: ['vue'],
        output: {
          format: 'es',
          esModule: true,
          entryFileNames: 'kwc/[name]/index.js',
          chunkFileNames: 'kwc/[name]/[hash].js',
          assetFileNames: 'kwc/[name]/[hash][extname]',
          globals: {
            vue: 'Vue'
          }
        }
      } : {
        input: 'index.html'
      }
    },

    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'app')
      }
    },

    css: {
      preprocessorOptions: {
        scss: {
          quietDeps: true,
          api: 'modern'
        }
      },
      codeSplit: false
    },

    logLevel: isBuild ? 'info' : 'warn',

    test: {
      globals: true,
      environment: 'jsdom',
      include: ['app/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']
    }
  };
});
