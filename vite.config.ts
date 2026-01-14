/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(
      // If you're using custom elements (like sl-*), you need to configure Vue to recognize them.
      // {
      //   template: {
      //     compilerOptions: {
      //       isCustomElement: (tag) => tag.startsWith('sl-')
      //     }
      //   }
      // }
    )
  ],
  esbuild: {
    drop: ['console', 'debugger'],
  },
  build: {
    minify: 'esbuild',
    lib: {
      entry: resolve(__dirname, 'app/main.ts'),
      name: 'KwcTemplateVue',
      fileName: (format) => `kwc-template-vue.${format}.js`,
      formats: ['es']
    },
    rollupOptions: {
      // If you want to bundle Vue with the component (so it works standalone), leave external empty.
      // If you expect the host application to provide Vue, add 'vue' to external.
      // For a "template project" that might be used in React, bundling Vue is usually safer/easier.
      external: [], 
      output: {
        globals: {
          vue: 'Vue'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'app')
    }
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['app/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']
  }
})
