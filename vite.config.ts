/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import fs from 'fs'

const COMPONENTS_DIR = path.resolve(__dirname, 'app/kwc')
const TEMP_ENTRY_DIR = path.resolve(__dirname, 'temp-entry')

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isBuild = command === 'build'
  const entryPoints: Record<string, string> = {}

  if (isBuild) {
    // 1. Clean and recreate temp directory
    if (fs.existsSync(TEMP_ENTRY_DIR)) {
      fs.rmSync(TEMP_ENTRY_DIR, { recursive: true, force: true })
    }
    fs.mkdirSync(TEMP_ENTRY_DIR, { recursive: true })

    // 2. Scan components and generate entry files
    if (fs.existsSync(COMPONENTS_DIR)) {
      fs.readdirSync(COMPONENTS_DIR).forEach(componentName => {
        // Skip files, only look for directories
        const componentDir = path.join(COMPONENTS_DIR, componentName)
        if (!fs.statSync(componentDir).isDirectory()) return

        // Check for [ComponentName].ce.vue
        const componentFile = path.join(componentDir, `${componentName}.ce.vue`)
        
        if (fs.existsSync(componentFile)) {
          // Generate entry content
          // Using relative path for import to ensure portability
          const relativePath = path.relative(TEMP_ENTRY_DIR, componentFile).replace(/\\/g, '/')
          
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
`.trim()

          const entryFile = path.join(TEMP_ENTRY_DIR, `${componentName}.js`)
          fs.writeFileSync(entryFile, entryContent)
          entryPoints[componentName] = entryFile
        }
      })
    }
  }

  // Plugin to cleanup temp dir after build
  const cleanupTempDirPlugin = {
    name: 'cleanup-temp-dir',
    closeBundle() {
      if (isBuild && fs.existsSync(TEMP_ENTRY_DIR)) {
        fs.rmSync(TEMP_ENTRY_DIR, { recursive: true, force: true })
      }
    }
  }

  return {
    plugins: [
      vue(),
      cleanupTempDirPlugin
    ],
    esbuild: {
      drop: ['console', 'debugger'],
    },
    build: {
      minify: 'esbuild',
      lib: {
        // When building multiple entries, 'entry' should be an object
        // Use main.ts as fallback if entryPoints is empty (e.g. during dev or if no components found)
        entry: entryPoints,
        formats: ['es']
      },
      rollupOptions: {
        external: [],
        output: {
          // Use [name] placeholder to preserve component names in output
          entryFileNames: '[name]/index.js',
          globals: {
            vue: 'Vue'
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'app')
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
  }
})
