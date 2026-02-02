import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
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

const copyIconPlugin = () => {
    return {
        name: 'copy-icon',
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
            copyIconPlugin()
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
