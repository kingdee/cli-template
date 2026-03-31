import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import path from 'path';
import fs from 'fs';
// ========================== 插件定义 ==========================

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
                // 动态匹配 static 目录下的子目录，如 /lang/xxx -> /static/lang/xxx
                if (fs.existsSync(staticDir)) {
                    const entries = fs.readdirSync(staticDir, { withFileTypes: true });
                    for (const entry of entries) {
                        const prefix = `/${entry.name}/`;
                        if (req.url.startsWith(prefix)) {
                            req.url = `/static${req.url}`;
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
                // 匹配 /themes/*.css 路径，支持 light、dark、nova 等所有主题
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
            copyStaticPlugin(),
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
