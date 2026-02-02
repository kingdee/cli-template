/// <reference types="vitest" />
import { defineConfig, ESBuildOptions } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import fs from 'fs';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { execSync } from 'child_process';

// 自定义插件：处理 lang 目录下的 json 文件
const copyLangPlugin = () => {
    return {
        name: 'copy-lang-files',
        writeBundle() {
            const targetComponent = process.env.TARGET_COMPONENT;
            if (!targetComponent) {return;}

            const outDir = path.resolve('dist', 'kwc', targetComponent);
            const langDir = path.resolve('app', 'kwc', 'static', 'lang');

            if (fs.existsSync(langDir)) {
                const destDir = path.join(outDir, 'lang');
                if (!fs.existsSync(destDir)) {
                    fs.mkdirSync(destDir, { recursive: true });
                }

                fs.readdirSync(langDir).forEach(file => {
                    if (file.endsWith('.json')) {
                        fs.copyFileSync(path.join(langDir, file), path.join(destDir, file));
                        console.log(`[copy-lang] Copied ${file} to ${destDir}`);
                    }
                });
            }
        },
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                if (req.url.startsWith('/lang/') && req.url.endsWith('.json')) {
                    req.url = req.url.replace('/lang/', '/app/kwc/static/lang/');
                }
                next();
            });
        }
    };
};

const copyIconPlugin = () => {
  return {
    name: 'copy-icons',
    writeBundle() {
      const targetComponent = process.env.TARGET_COMPONENT;
      if (!targetComponent) { return; }

      const outDir = path.resolve('dist', 'kwc', targetComponent);
      const iconDir = path.join('node_modules', '@kdcloudjs', 'shoelace', 'dist', 'assets', 'icons');

      if (fs.existsSync(iconDir)) {
        console.log(`Copying icons for ${targetComponent}...`);
        if (process.platform === 'win32') {
          try {
            const src = path.join('node_modules', '@kdcloudjs', 'shoelace', 'dist', 'assets', 'icons');
            execSync(`robocopy "${iconDir}" "${outDir}/assets/icons" *.svg /MIR /MT:32 /R:0 /W:0 /NFL /NDL /NP`, { stdio: 'inherit' });
          } catch (e) {
            if (e.status > 7) {
              throw e;
            }
          }
        } else {
          fs.cpSync(iconDir, path.join(outDir, 'assets/icons'), { recursive: true });
        }
      } else {
        console.warn(`Warning: Icons source directory not found at ${iconDir}`);
      }
    }
  };
}


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
      drop: (isProdBuild ? ['console', 'debugger'] : []) as ESBuildOptions['drop']
    },

    server: {
      port: 3000,
      open: true,
      host: true
    },

    plugins: [
      vue(),
      cssInjectedByJsPlugin(),
      copyLangPlugin(),
      copyIconPlugin()
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
          format: 'es' as const,
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
