import kwc from '@kdcloudjs/kwc-rollup-plugin';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import terser from '@rollup/plugin-terser';
import { existsSync, mkdirSync, writeFileSync, readdirSync } from 'fs';
import path, { join } from 'path';
import alias from '@rollup/plugin-alias';
import copy from 'rollup-plugin-copy';
import { rimrafSync } from 'rimraf';

const isDebugBuild = process.env.DEBUG_BUILD === 'true';
const isProdBuild = process.env.NODE_ENV === 'production' && !isDebugBuild;
const isWin = process.platform === 'win32';
const useRobocopy = isWin && (process.env.COPY_ICONS_FULL !== 'false');

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
        return {};
    }

    // Build ALL components if no target specified
    const componentFolders = readdirSync(componentsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    const entries = {};
    componentFolders.forEach(folder => {
        const filePath = join(componentsDir, folder, `${folder}.js`);
        if (existsSync(filePath)) {
            entries[`kwc/${folder}`] = filePath;
        }
    });

    // If no components, check for main.js
    if (Object.keys(entries).length === 0 && existsSync(join(componentsDir, 'main.js'))) {
        return { main: join(componentsDir, 'main.js') };
    }

    return entries;
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

/**
 * 替换组件标签名为带 Hash 的版本
 */
function replaceTagNames() {
    const mappingEnv = process.env.KWC_TAG_MAPPING;
    if (!mappingEnv) {
        return null;
    }

    const mapping = JSON.parse(mappingEnv);
    const keys = Object.keys(mapping).sort((a, b) => b.length - a.length);
    const values = Object.values(mapping);

    // Helper: camelCase to kebab-case
    const toKebab = (str) => str.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
    // Helper: kebab-case to camelCase
    const toCamel = (str) => str.replace(/-(\w)/g, (_, c) => c.toUpperCase());

    return {
        name: 'replace-tag-names',
        resolveId(source) {
            if (source.startsWith('kwc/')) {
                const name = source.slice(4);
                const tagName = `kwc-${toKebab(name)}`;
                if (values.includes(tagName)) {
                    const originalTag = keys.find(k => mapping[k] === tagName);
                    if (originalTag) {
                        const originalName = originalTag.replace(/^kwc-/, '');
                        const originalCamel = toCamel(originalName);
                        const candidate = path.resolve(process.cwd(), 'app/kwc', originalCamel, `${originalCamel}.js`);
                        if (existsSync(candidate)) {
                            return candidate;
                        }
                    }
                }
            }
            return null;
        },
        transform(code, id) {
            if (!/\.(js|html|css)$/.test(id)) { return null; }
            if (id.includes('node_modules')) { return null; }

            let newCode = code;
            let changed = false;
            keys.forEach(key => {
                const value = mapping[key];
                const regex = new RegExp(key, 'g');
                if (regex.test(newCode)) {
                    newCode = newCode.replace(regex, value);
                    changed = true;
                }
            });

            if (changed) {
                return { code: newCode, map: null };
            }
            return null;
        }
    };
}

/**
 * 包装 KWC 插件，强制规范化文件路径
 */
function kwcWrapper(options) {
    const plugin = kwc(options);
    const originalTransform = plugin.transform;

    plugin.transform = function (src, id) {
        // 将 Windows 反斜杠转换为正斜杠
        const normalizedId = id.split(path.sep).join('/');
        return originalTransform.call(this, src, normalizedId);
    };

    return plugin;
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
                enabled: !args.watch && !isDev && !process.env.TARGET_COMPONENT
            }),
            alias({
                entries: [
                    { find: 'kingdee', replacement: resolve('node_modules/@kdcloudjs/kwc-shared-utils') }
                ]
            }),
            replace({
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
                preventAssignment: true
            }),
            // 确保在 kwc() 之前加上 watchCss
            (isDev || isDebugBuild) && watchCss(),
            kwcWrapper({ rootDir: 'app' }),
            replaceTagNames(),
            resolve(),
            commonjs({
                include: ['node_modules/@kdcloudjs/kwc-shared-utils/**', 'node_modules/@kdcloudjs/kwc-i18n/**', 'node_modules/lodash/**']
            }),
            isDev && serve({
                host: 'localhost',
                open: true,
                port: 3000,
                contentBase: ['dist', 'app/kwc/static', 'node_modules/@kdcloudjs/shoelace/dist']
            }),
            isDev && livereload('dist'),
            // 复制静态资源
            copy({
                targets: [
                    isDev && { src: 'node_modules/@kdcloudjs/kingdee-base-components/dist/index.css', dest: 'dist' },
                    isDev && { src: 'app/kwc/logo.png', dest: 'dist' },
                    isDev && { src: 'node_modules/@kdcloudjs/shoelace/dist/themes/light.css', dest: 'dist/themes' },
                    !isDev && process.env.TARGET_COMPONENT && {
                        src: 'app/kwc/static/lang',
                        dest: `dist/kwc/${process.env.TARGET_COMPONENT}`
                    }
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
<html class="sl-theme-light">
  <head>
    <meta charset="utf-8"/>
    <title>KWC Dev</title>
    <link rel="stylesheet" href="/index.css"/>
    <link rel="stylesheet" href="/themes/light.css"/>
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
