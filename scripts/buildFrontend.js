import { build } from 'vite';
import * as path from 'path';
import * as fs from 'fs';
import chokidar from 'chokidar';
import { generateEntries } from './entry-generator.js';
import minimist from 'minimist';
import pc from 'picocolors';

const COMPONENTS_DIR = path.resolve(process.cwd(), 'app/kwc');
const TEMP_ENTRY_DIR = path.resolve(process.cwd(), 'temp-entry');

// 排除非组件目录
const EXCLUDE_DIRS = ['static', 'types'];

// 使用 minimist 解析命令行参数
const argv = minimist(process.argv.slice(2));
const isWatch = argv.watch || false;
const specifiedComponents = argv._;  // 位置参数（组件名）
const buildMode = isWatch ? 'development' : 'production';

// Shoelace 资源路径配置
const SHOELACE_DIST_DIR = path.resolve(process.cwd(), 'node_modules/@kdcloudjs/shoelace/dist');
const SHOELACE_OUTPUT_DIR = path.resolve(process.cwd(), 'dist/shoelace');

/**
 * 获取所有可用组件列表
 * @returns {string[]}
 */
function getAvailableComponents() {
    return fs.readdirSync(COMPONENTS_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && !EXCLUDE_DIRS.includes(dirent.name))
        .map(dirent => dirent.name);
}

/**
 * 带重试的目录删除（应对 macOS .DS_Store 导致的 ENOTEMPTY）
 * @param {string} dir - 目录路径
 * @param {number} retries - 最大重试次数
 */
function rmSyncRetry(dir, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            fs.rmSync(dir, { recursive: true, force: true });
            return;
        } catch (err) {
            if (err.code === 'ENOTEMPTY' && i < retries - 1) {
                const waitMs = 100 * (i + 1);
                const start = Date.now();
                while (Date.now() - start < waitMs) { /* busy wait */ }
            } else {
                throw err;
            }
        }
    }
}

/**
 * 清理前端构建目录
 * @param {string[]} [componentNames] - 如果指定，只清理这些组件的输出目录；否则清理全部
 */
function cleanFrontendDirs(componentNames) {
    if (componentNames && componentNames.length > 0) {
        // 指定组件：只清理对应组件的输出目录
        for (const name of componentNames) {
            const componentDir = `dist/kwc/${name}`;
            if (fs.existsSync(componentDir)) {
                console.log(`Cleaning ${componentDir}...`);
                rmSyncRetry(componentDir);
            }
        }
    } else {
        // 全量构建：清理整个 dist/kwc 和 dist/shoelace
        const frontendDirs = ['dist/kwc', 'dist/shoelace'];
        for (const dir of frontendDirs) {
            if (fs.existsSync(dir)) {
                console.log(`Cleaning ${dir}...`);
                rmSyncRetry(dir);
            }
        }
    }
}

/**
 * 递归拷贝目录（兼容 Node.js 10+），跳过 .DS_Store 文件
 * @param {string} src 源目录
 * @param {string} dest 目标目录
 */
function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.name === '.DS_Store') continue;
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * 处理 shoelace 资源：assets拷贝、CSS单独输出、version.json生成
 * 所有资源统一输出到 dist/shoelace/ 目录
 */
function processShoelaceAssets() {
    console.log('[shoelace] Processing shoelace assets...');

    const shoelaceRoot = path.resolve(process.cwd(), 'node_modules/@kdcloudjs/shoelace');
    const shoelaceDist = path.join(shoelaceRoot, 'dist');
    const outputDir = path.resolve(process.cwd(), 'dist/shoelace');
    const cssOutputDir = path.join(outputDir, 'css');

    // 检查 shoelace 是否存在
    if (!fs.existsSync(shoelaceDist)) {
        console.warn('[shoelace] @kdcloudjs/shoelace/dist not found, skipping...');
        return;
    }

    // 确保输出目录存在
    if (!fs.existsSync(cssOutputDir)) {
        fs.mkdirSync(cssOutputDir, { recursive: true });
    }

    // 1. 拷贝 assets 目录
    const assetsSource = path.join(shoelaceDist, 'assets');
    const assetsDest = path.join(outputDir, 'assets');
    if (fs.existsSync(assetsSource)) {
        copyDirectory(assetsSource, assetsDest);
    }

    // 2. 单独输出各主题 CSS 文件到 css 目录（添加 shoelace- 前缀）
    const themesDir = path.join(shoelaceDist, 'themes');
    if (fs.existsSync(themesDir)) {
        const targetThemes = ['light.css', 'dark.css'];
        for (const themeFile of targetThemes) {
            const srcPath = path.join(themesDir, themeFile);
            if (fs.existsSync(srcPath)) {
                const destFileName = `shoelace-${themeFile}`;
                const destPath = path.join(cssOutputDir, destFileName);
                fs.copyFileSync(srcPath, destPath);
            }
        }

        // 复制 shoelace-light.css 为 shoelace.css（兼容现有用户）
        const lightCssPath = path.join(cssOutputDir, 'shoelace-light.css');
        if (fs.existsSync(lightCssPath)) {
            const compatPath = path.join(cssOutputDir, 'shoelace.css');
            fs.copyFileSync(lightCssPath, compatPath);
        }
    }

    // 3. 读取 shoelace 的 version 并生成 version.json
    const shoelacePkgPath = path.join(shoelaceRoot, 'package.json');
    if (fs.existsSync(shoelacePkgPath)) {
        const shoelacePkg = JSON.parse(fs.readFileSync(shoelacePkgPath, 'utf-8'));
        const versionJson = { version: shoelacePkg.version };
        const versionOutputPath = path.join(outputDir, 'version.json');
        fs.writeFileSync(versionOutputPath, JSON.stringify(versionJson, null, 2));
    }

    console.log('[shoelace] All shoelace resources processed successfully!');
}

/**
 * 单个组件构建函数
 * @param {string} componentName
 * @param {string} entryFile
 */
async function buildComponent(componentName, entryFile) {
    const logPrefix = isWatch ? '[Rebuild] ' : '';
    console.log(`${logPrefix}Building component: ${componentName}...`);

    process.env.TARGET_COMPONENT = componentName;
    process.env.ENTRY_FILE = entryFile;

    try {
        await build({
            configFile: path.resolve(process.cwd(), 'vite.config.js'),
            mode: buildMode
        });
        if (isWatch) {
            console.log(`[Success] ${componentName} built.`);
        }
    } catch (error) {
        console.error(`[Error] Failed to build ${componentName}:`, error);
        throw error;
    }
}

async function run() {
    console.log(pc.dim(`Building frontend...\n`));

    // 1. 获取所有可用组件
    const availableComponents = getAvailableComponents();

    // 2. 如果指定了组件名，验证并过滤
    let targetComponents;

    if (specifiedComponents.length > 0) {
        const validComponents = [];
        const invalidComponents = [];

        for (const comp of specifiedComponents) {
            if (availableComponents.includes(comp)) {
                validComponents.push(comp);
            } else {
                invalidComponents.push(comp);
            }
        }

        if (invalidComponents.length > 0) {
            console.warn(`\n${pc.yellow('Warning:')} The following components were not found and will be skipped: ${pc.yellow(invalidComponents.join(', '))}`);
            console.log(`Available components: ${pc.dim(availableComponents.join(', '))}\n`);
        }

        if (validComponents.length === 0) {
            console.error(`\n${pc.red(pc.bold('Error:'))} No valid components specified.\n`);
            process.exit(1);
        }

        targetComponents = validComponents;
        console.log(`\nBuilding specified components: ${pc.cyan(validComponents.join(', '))}\n`);
    } else {
        targetComponents = availableComponents;
    }

    // 3. 清理目录（指定组件时只清理对应目录）
    cleanFrontendDirs(specifiedComponents.length > 0 ? targetComponents : undefined);

    // 4. 生成入口文件
    const entryPoints = generateEntries(COMPONENTS_DIR, TEMP_ENTRY_DIR);

    // 5. 过滤出目标组件的入口
    const components = targetComponents.filter(name => entryPoints[name]);

    const cleanup = () => {
        if (fs.existsSync(TEMP_ENTRY_DIR)) {
            fs.rmSync(TEMP_ENTRY_DIR, { recursive: true, force: true });
        }
    };

    if (components.length === 0) {
        console.log('No components found to build.');
        if (!isWatch) {
            cleanup();
        }
        return;
    }

    // 6. 执行全量构建（Watch 模式下作为初始构建）
    for (const componentName of components) {
        try {
            await buildComponent(componentName, entryPoints[componentName]);
        } catch (error) {
            console.error(error);
            if (!isWatch) {
                cleanup();
                process.exit(1);
            }
        }
    }

    if (!isWatch) {
        // 非 Watch 模式：构建时处理 shoelace 资源
        processShoelaceAssets();
        cleanup();
        console.log(pc.green(`Frontend build completed\n`));
        return;
    }

    // 7. Watch 模式：启动监听
    console.log('Initial build complete. Watching for changes...');

    const watcher = chokidar.watch(COMPONENTS_DIR, {
        ignored: /(^|[/\\])\../, // 忽略点文件
        persistent: true,
        ignoreInitial: true
    });

    // 组件构建任务队列（简单的防抖映射）
    const buildTasks = {};

    const handleFileChange = (filePath) => {
        // 解析组件名
        const relativePath = path.relative(COMPONENTS_DIR, filePath);
        const componentName = relativePath.split(path.sep)[0];

        if (!componentName || !entryPoints[componentName]) {
            return;
        }

        // 防抖处理
        if (buildTasks[componentName]) {
            clearTimeout(buildTasks[componentName]);
        }

        buildTasks[componentName] = setTimeout(() => {
            buildComponent(componentName, entryPoints[componentName]).catch(() => {
                // error already logged
            });
            delete buildTasks[componentName];
        }, 300);
    };

    watcher
        .on('add', handleFileChange)
        .on('change', handleFileChange)
        .on('unlink', handleFileChange);

    // Handle process exit
    process.on('SIGINT', () => {
        cleanup();
        process.exit();
    });
}

run();
