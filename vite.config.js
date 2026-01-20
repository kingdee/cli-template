import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

// ========================== 插件定义 ==========================

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
            'process.env.NODE_ENV': isProdBuild ? JSON.stringify('production') : JSON.stringify('development')
        },

        esbuild: {
            // 只在生产构建模式下移除console和debugger
            drop: isProdBuild ? ['console', 'debugger'] : []
        },

        root: isBuild ? undefined : 'app/kwc',

        // 公共配置
        server: {
            port: 3000
        },
        plugins: [
            react(),
            cssInjectedByJsPlugin()
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
        logLevel: isBuild ? 'info' : 'warn'
    };
});
