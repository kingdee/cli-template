import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import path from 'path';
import fs from 'fs';
// ========================== 插件定义 ==========================

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
                    req.url = req.url.replace('/lang/', '/static/lang/');
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

    // 如果指定了 TARGET_COMPONENT，则进行单组件独立构建
    // scripts/build.js 会确保在构建模式下传入这两个环境变量
    const targetComponent = process.env.TARGET_COMPONENT || '';
    const entryFile = process.env.ENTRY_FILE || '';

    // 开发服务器配置（npm run dev）
    const devServerConfig = {
        rollupOptions: {
            external: () => false,
            input: 'app/kwc/main.jsx'
        }
    };

    // 构建配置（生产构建 & 调试构建）
    const buildConfig = {
        outDir: `dist/kwc/${targetComponent}`,
        emptyOutDir: true,
        assetsInlineLimit: 40960, // 40KB
        minify: isProdBuild ? 'esbuild' : false, // 生产环境压缩，调试环境不压缩
        lib: {
            formats: ['es'],
            entry: entryFile,
            name: targetComponent || '[name]',
            fileName: 'index'
        },
        rollupOptions: {
            external: ['react', 'react-dom', 'react-dom/client'],
            input: entryFile,
            output: {
                format: 'es',
                esModule: true
            }
        }
    };

    return {
        define: {
            'process.env.NODE_ENV': isProdBuild ? JSON.stringify('production') : JSON.stringify('development'),
            'import.meta.env.SHOELACE_BASE_URL': JSON.stringify(`/@fs/${path.resolve(__dirname, 'node_modules/@kdcloudjs/shoelace/dist').replace(/\\/g, '/').replace(/^\//, '')}`)
        },

        esbuild: {
            // 只在生产构建模式下移除console和debugger
            drop: isProdBuild ? ['console', 'debugger'] : []
        },

        root: isBuild ? undefined : 'app/kwc',

        // 公共配置
        server: {
            port: 3000,
            open: true,
            host: true
        },
        plugins: [
            react(),
            cssInjectedByJsPlugin(),
            copyLangPlugin(),
            !isBuild && serveShoelaceThemePlugin()
        ],
        build: {
            chunkSizeWarningLimit: 1024,
            cssCodeSplit: false,
            ...(isBuild ? buildConfig : devServerConfig)
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
        logLevel: 'info'
    };
});
