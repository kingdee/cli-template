/// <reference types="vitest" />
import { defineConfig, ESBuildOptions } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import fs from 'fs';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

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

// 自定义插件：处理 shoelace 主题文件的 Dev Server 支持
const serveShoelaceThemePlugin = () => {
  return {
    name: 'serve-shoelace-theme',
    apply: 'serve',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url === '/themes/light.css') {
          const cssPath = path.resolve('node_modules/@kdcloudjs/shoelace/dist/themes/light.css');
          if (fs.existsSync(cssPath)) {
            res.setHeader('Content-Type', 'text/css');
            res.end(fs.readFileSync(cssPath));
            return;
          }
        }
        next();
      });
    }
  };
};

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
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag.startsWith('sl-')
          }
        }
      }),
      cssInjectedByJsPlugin(),
      copyLangPlugin(),
      !isBuild && serveShoelaceThemePlugin()
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
