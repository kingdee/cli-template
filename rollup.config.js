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

/**
 * 生产构建注入 setBasePath
 */
function injectBasePath() {
    return {
        name: 'inject-base-path',
        transform(code, id) {
            const normalizedId = id.split(path.sep).join('/');
            // 匹配 app/kwc/name/name.js 格式的入口文件
            if (/\/app\/kwc\/([^/]+)\/\1\.js$/.test(normalizedId)) {
                // 使用 AST 解析判断是否已引入 setBasePath，避免被注释误导
                try {
                    const ast = this.parse(code);
                    const hasSetBasePath = ast.body.some(node =>
                        node.type === 'ImportDeclaration' &&
                        node.source.value.includes('@kdcloudjs/shoelace/dist/utilities/base-path.js') &&
                        node.specifiers.some(s => s.imported && s.imported.name === 'setBasePath')
                    );
                    if (hasSetBasePath) return null;
                } catch (e) {
                    // 解析失败时降级检查（忽略以 // 开头的行）
                    const lines = code.split('\n');
                    const hasImport = lines.some(line =>
                        !line.trim().startsWith('//') &&
                        line.includes('setBasePath') &&
                        line.includes('@kdcloudjs/shoelace/dist/utilities/base-path.js')
                    );
                    if (hasImport) return null;
                }

                const injection = `import { setBasePath } from '@kdcloudjs/shoelace/dist/utilities/base-path.js';
const onlineCdnPath = window.location.origin + window.location.pathname.slice(0, window.location.pathname.lastIndexOf('/') + 1);
setBasePath(\`\${onlineCdnPath}/public/kwc\`);
`;
                return {
                    code: injection + code,
                    map: { mappings: '' } // 提供基础的 source map 消除警告
                };
            }
            return null;
        }
    };
}

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
            if (!source) return null;

            // 兼容绝对路径：先转为相对路径
            let relativePath = source;
            if (path.isAbsolute(source)) {
                relativePath = path.relative(process.cwd(), source);
            }

            // 统一路径分隔符为 /
            const normalizedSource = relativePath.split(path.sep).join('/');
            const prefix = 'app/kwc/';

            if (normalizedSource.startsWith(prefix)) {
                const name = normalizedSource.slice(prefix.length).split('/')[0];
                console.log(name, 'name')
                if (!name) return null;
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
            // 生产模式注入 BasePath
            !isDev && injectBasePath(),
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
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
    <title>KWC Dev</title>
    <script>
      (function() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && !/Win32|MacIntel/i.test(navigator.platform);
        
        const style = document.createElement('style');
        
        // 公共样式
        let css = \`
          input:disabled,select:disabled,textarea:disabled{ background-color: #FFF; }
          *,*:before,*:after { box-sizing: inherit; }
          ul, li { margin: 0; padding: 0; list-style-type: none; }
          input, textarea, p, h4 { padding: 0; margin: 0; }
          body { box-sizing: border-box; }
        \`;

        if (!isMobile) {
            // PC端样式
            css += \`
              html,body { height: 100%; padding: 0; margin: 0; font-size:12px; --kdds-base-font-size: 12; }
              html,body,input, textarea, select, button { font-family:'Roboto', 'San Francisco', 'Helvetica Neue', Helvetica, Arial, 'PingFang SC', 'Hiragina Sans GB', 'WenQuanYi Micro Hei', 'microsoft yahei ui', 'microsoft yahei', sans-serif; }
              input:placeholder-shown { text-overflow: ellipsis; }
              textarea { overflow: auto; }
              input:-webkit-autofill, textarea:-webkit-autofill, select:-webkit-autofill { box-shadow: inset 0 0 0 1000px #fff; }
              
              /* 滚动条样式 */
              ::-webkit-scrollbar { width: 8px !important; height: 8px !important; overflow:visible; }
              ::-webkit-scrollbar-thumb { min-height: 28px; height: 5px; min-width: 2px; width: 5px; border-radius: 4px; border: dashed transparent; padding: 100px 0 0; border-width: 1px; background-color: #B2B2B2; background-clip: padding-box; }
              ::-webkit-scrollbar-thumb:hover { background:#999999; border-radius: 6; }
              ::-webkit-scrollbar-thumb:active { background-color:#999999; }
              ::-webkit-scrollbar-corner { background:transparent; }
              ::-webkit-scrollbar-track { border-radius: 10px; }
              ::-webkit-scrollbar-button { width:0; height:0; }
              :focus { outline: none; }
            \`;
        } else {
            // 移动端样式
            css += \`
              * { -webkit-tap-highlight-color: transparent; }
              html,body { padding: 0; margin: 0; height: 100%; overflow: hidden; font-size: 14px; --kdds-base-font-size: 14; font-family:-apple-system, BlinkMacSystemFont, "PingFang SC","Helvetica Neue",STHeiti,"Microsoft Yahei",Tahoma,Simsun,sans-serif; }
              body:hover { overflow: auto; }
              
              /* 隐藏滚动条 */
              ::-webkit-scrollbar { width: 0; height: 0; }
              ::-webkit-scrollbar-thumb { min-height: 2px; height: 5px; min-width: 2px; width: 5px; background: #b8b8b8; border-radius: 4px; border: none; }
              ::-webkit-scrollbar-track { border-radius: 10px; }
            \`;
        }
        
        style.textContent = css;
        document.head.appendChild(style);
      })();
    </script>
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
