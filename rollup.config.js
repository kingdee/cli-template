import kwc from '@kdcloudjs/kwc-rollup-plugin';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import terser from '@rollup/plugin-terser';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import path, { join } from 'path';
import alias from '@rollup/plugin-alias';
import copy from 'rollup-plugin-copy';

function inlineShoelaceIcons() {
    return {
        name: 'inline-shoelace-icons',
        transform(code, id) {
            if (!id.endsWith('.html')) { return null; }

            const iconRegex = /<sl-icon([\s\S]*?)name=["']([^"']+)["']([\s\S]*?)>/g;

            const newCode = code.replace(iconRegex, (match, before, iconName, after) => {
                const iconPath = path.resolve(process.cwd(), 'node_modules/@kdcloudjs/shoelace/dist/assets/icons', `${iconName}.svg`);

                if (existsSync(iconPath)) {
                    try {
                        const svgContent = readFileSync(iconPath, 'utf-8');
                        const dataUri = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;

                        console.log(`[inline-shoelace-icons] Inlined icon: ${iconName}`);

                        return `<sl-icon${before}src="${dataUri}"${after}>`;
                    } catch (e) {
                        console.warn(`[inline-shoelace-icons] Failed to read icon: ${iconName}`, e);
                        return match;
                    }
                } else {
                    console.warn(`[inline-shoelace-icons] Icon not found: ${iconName}`);
                    return match;
                }
            });

            return {
                code: newCode,
                map: null
            };
        }
    };
}

const isDebugBuild = process.env.DEBUG_BUILD === 'true';
const isProdBuild = process.env.NODE_ENV === 'production' && !isDebugBuild;

import { rimrafSync } from 'rimraf';

/**
 * 清理 dist（仅 build 阶段）
 */
function cleanDist({ dir = 'dist', enabled = true } = {}) {
    return {
        name: 'clean-dist',
        buildStart() {
            if (!enabled) { return; }
            if (existsSync(dir)) {
                try {
                    rimrafSync(dir);
                    console.log(`[rollup] cleaned ${dir}`);
                } catch (e) {
                    console.warn(`[rollup] warning: failed to clean ${dir}`, e.message);
                }
            }
        }
    };
}

const getComponentEntries = () => {
    const componentsDir = 'app/kwc';

    // 🔑 Support building a single component via env var
    if (process.env.TARGET_COMPONENT) {
        if (process.env.TARGET_COMPONENT === 'main') {
            return { main: join(componentsDir, 'main.js') };
        }
        const folder = process.env.TARGET_COMPONENT;
        const filePath = join(componentsDir, folder, `${folder}.js`);
        if (existsSync(filePath)) {
            return { [`kwc/${folder}`]: filePath };
        }
    }
    return {};
};

// 🔑 新增 watchCss 插件：保证 .css 文件修改时 rollup 会重新编译
function watchCss() {
    return {
        name: 'watch-css',
        load(id) {
            if (id.endsWith('.css')) {
                this.addWatchFile(id);
            }
            return null;
        }
    };
}

function kdBaseComponentResolver() {
    return {
        name: 'kd-base-component-resolver',

        resolveId(source) {
            // 匹配 kd/xxx
            if (source.startsWith('kd/')) {
                const compName = source.slice(3); // 去掉 "kd/"
                return path.resolve(
                    process.cwd(),
                    'node_modules/@kdcloudjs/kingdee-base-components/dist/esm/kd',
                    `${compName}.js`
                );
            }
            return null;
        }
    };
}

export default (args) => {
    // 开发模式使用单一入口以支持开发服务器
    const isDev = args.watch && process.env.NODE_ENV === 'development';

    const kwcBundle = {
        input: isDev ? 'app/kwc/main.js' : getComponentEntries(),
        output: isDev ? [
            {
                dir: 'dist',
                format: 'esm',
                entryFileNames: 'index.js',
                sourcemap: true
            }
        ] : [
            {
                // ESM格式 - 支持Tree Shaking
                dir: 'dist',
                format: 'esm',
                sourcemap: isDebugBuild,
                entryFileNames: '[name]/index.js',
                preserveModules: false
            }
        ],
        plugins: [
            // 🔥 仅生产 build 清 dist
            cleanDist({
                dir: 'dist',
                enabled: !isDev && !process.env.TARGET_COMPONENT
            }),
            kdBaseComponentResolver(),
            alias({
                entries: [
                    { find: 'kingdee', replacement: resolve('node_modules/@kdcloudjs/kwc-shared-utils') }
                ]
            }),
            replace({
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
                'import.meta.env.SHOELACE_BASE_URL': isDev ? JSON.stringify('/kwc/assets/shoelace/') : 'new URL(\'../assets/shoelace/\', import.meta.url).href',
                preventAssignment: true
            }),
            // 确保在 kwc() 之前加上 watchCss
            (isDev || isDebugBuild) && watchCss(),
            // 仅在 Build 模式下启用内联图标插件，且必须在 kwc() 之前
            !isDev && inlineShoelaceIcons(),
            kwc({ rootDir: 'app' }),
            resolve(),
            commonjs({
                include: ['node_modules/@kdcloudjs/kwc-shared-utils/**', 'node_modules/@kdcloudjs/kwc-i18n/**']
            }),
            isDev && serve({
                open: true,
                port: 3000,
                contentBase: ['dist']
            }),
            isDev && livereload('dist'),
            // 复制静态资源
            isDev && copy({
                targets: [
                    { src: 'node_modules/@kdcloudjs/kingdee-base-components/dist/index.css', dest: 'dist' },
                    { src: 'app/kwc/logo.png', dest: 'dist' },
                    // Build 模式下已内联，无需复制 Shoelace 资源
                    { src: 'node_modules/@kdcloudjs/shoelace/dist/assets', dest: 'dist/kwc/assets/shoelace' }
                ].filter(Boolean)
            }),
            isDev && {
                name: 'ensure-index-html',
                generateBundle(options) {
                    const outDir = options.dir || path.dirname(options.file);
                    const htmlFile = path.join(outDir, 'index.html');

                    // 如果 dist/index.html 已存在就跳过
                    if (existsSync(htmlFile)) { return; }

                    // 确保目录存在
                    mkdirSync(outDir, { recursive: true });

                    // 写入内容
                    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title>KWC Dev</title>
    <link rel="stylesheet" href="/index.css"/>
  </head>
  <body>
    <script type="module" src="/index.js"></script>
  </body>
</html>`;
                    writeFileSync(htmlFile, html);
                    console.log('[ensure-index-html] 已生成 dist/index.html');
                }
            },
            isProdBuild && terser({
                compress: {
                    drop_console: true,
                    drop_debugger: true
                },
                mangle: {
                    reserved: ['KingdeeBaseComponents']
                }
            })
        ].filter(Boolean),
        external: isDev ? [] : ['@kdcloudjs/kwc'],
        // 警告处理
        onwarn(warning, warn) {
            // 忽略某些警告
            if (warning.code === 'THIS_IS_UNDEFINED') { return; }
            warn(warning);
        }
    };

    return [kwcBundle];
};