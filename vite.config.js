/// <reference types="vitest" />
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import fs from 'fs';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

// 自定义插件：处理 static 目录下的所有文件
const copyStaticPlugin = () => {
    const copyDirRecursive = (src, dest) => {
        if (!fs.existsSync(src)) return;

        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }

        fs.readdirSync(src, { withFileTypes: true }).forEach(entry => {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);

            if (entry.isDirectory()) {
                copyDirRecursive(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        });
    };

    return {
        name: 'copy-static-files',
        writeBundle() {
            const targetComponent = process.env.TARGET_COMPONENT;
            if (!targetComponent) { return; }

            const outDir = path.resolve('dist', 'kwc', targetComponent);
            const staticDir = path.resolve('app', 'kwc', 'static');

            if (fs.existsSync(staticDir)) {
                copyDirRecursive(staticDir, outDir);
            }
        },
        configureServer(server) {
            const staticDir = path.resolve('app', 'kwc', 'static');
            server.middlewares.use((req, res, next) => {
                // 动态匹配 static 目录下的子目录，如 /lang/xxx -> /app/kwc/static/lang/xxx
                if (fs.existsSync(staticDir)) {
                    const entries = fs.readdirSync(staticDir, { withFileTypes: true });
                    for (const entry of entries) {
                        const prefix = `/${entry.name}/`;
                        if (req.url.startsWith(prefix)) {
                            req.url = `/app/kwc/static${req.url}`;
                            break;
                        }
                    }
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
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                // 匹配 /themes/*.css 路径，支持 light、dark 等所有主题
                const themeMatch = req.url?.match(/^\/themes\/([^/]+\.css)$/);
                if (themeMatch) {
                    const themeName = themeMatch[1];
                    const cssPath = path.resolve(`node_modules/@kdcloudjs/shoelace/dist/themes/${themeName}`);
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
            cssInjectedByJsPlugin(),
            copyStaticPlugin(),
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
