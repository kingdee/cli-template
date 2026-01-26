/// <reference types="vitest" />
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig(({ command, mode }) => {
  const isBuild = command === 'build';
  const isProdBuild = isBuild && mode === 'production';

  const isWatch = process.argv.includes('--watch') || process.argv.includes('-w');
  const targetComponent = process.env.TARGET_COMPONENT;

  return {
    define: {
      'process.env.NODE_ENV': isProdBuild ? JSON.stringify('production') : JSON.stringify('development')
    },

    esbuild: {
      drop: isProdBuild ? ['console', 'debugger'] : []
    },

    server: {
      port: 3000,
      open: true,
      host: true
    },

    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag.startsWith('sl-')
          }
        }
      }),
      cssInjectedByJsPlugin()
    ].filter(Boolean),

    build: {
      outDir: 'dist',
      emptyOutDir: !isWatch && !process.env.TARGET_COMPONENT,
      assetsInlineLimit: 40960,
      chunkSizeWarningLimit: 1024,
      cssCodeSplit: false,
      minify: 'esbuild',
      rollupOptions: isBuild ? {
        external: ['vue'],
        output: {
          format: 'es',
          esModule: true,
          entryFileNames: targetComponent ? `kwc/${targetComponent}/index.js` : 'kwc/[name]/index.js',
          chunkFileNames: targetComponent ? `kwc/${targetComponent}/[name]-[hash].js` : 'kwc/[name]/[hash].js',
          assetFileNames: targetComponent ? `kwc/${targetComponent}/[name]-[hash][extname]` : 'kwc/[name]/[hash][extname]',
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

    logLevel: 'info',

    test: {
      globals: true,
      environment: 'jsdom',
      include: ['app/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']
    }
  };
});
