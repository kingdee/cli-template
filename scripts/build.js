import { build } from 'vite';
import * as path from 'path';
import * as fs from 'fs';
import chokidar from 'chokidar';
import { generateEntries } from './entry-generator.js';

const COMPONENTS_DIR = path.resolve(process.cwd(), 'app/kwc');
const TEMP_ENTRY_DIR = path.resolve(process.cwd(), 'temp-entry');

// Shoelace 资源路径配置
const SHOELACE_DIST_DIR = path.resolve(process.cwd(), 'node_modules/@kdcloudjs/shoelace/dist');
const SHOELACE_OUTPUT_DIR = path.resolve(process.cwd(), 'dist/shoelace');

// 解析参数
const isWatch = process.argv.includes('--watch');
const buildMode = isWatch ? 'development' : 'production';

/**
 * 递归拷贝目录（兼容 Node.js 10+）
 * @param {string} src 源目录
 * @param {string} dest 目标目录
 */
function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
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
 * 处理 Shoelace 资源：assets 拷贝、CSS 处理、version.json 生成
 */
function processShoelaceAssets() {
    console.log('Processing Shoelace assets...');

    // 确保输出目录存在
    if (!fs.existsSync(SHOELACE_OUTPUT_DIR)) {
        fs.mkdirSync(SHOELACE_OUTPUT_DIR, { recursive: true });
    }

    // 1. 拷贝 assets 目录
    const assetsSource = path.join(SHOELACE_DIST_DIR, 'assets');
    const assetsDest = path.join(SHOELACE_OUTPUT_DIR, 'assets');
    if (fs.existsSync(assetsSource)) {
        copyDirectory(assetsSource, assetsDest);
    } else {
        console.warn(`[shoelace] Assets directory not found: ${assetsSource}`);
    }

    // 2. 处理主题 CSS 文件
    const themesDir = path.join(SHOELACE_DIST_DIR, 'themes');
    const cssOutputDir = path.join(SHOELACE_OUTPUT_DIR, 'css');
    const lightCssSource = path.join(themesDir, 'light.css');
    const darkCssSource = path.join(themesDir, 'dark.css');

    // 确保 css 输出目录存在
    if (!fs.existsSync(cssOutputDir)) {
        fs.mkdirSync(cssOutputDir, { recursive: true });
    }

    if (fs.existsSync(lightCssSource)) {
        // 拷贝为 shoelace-light.css
        const lightCssDest = path.join(cssOutputDir, 'shoelace-light.css');
        fs.copyFileSync(lightCssSource, lightCssDest);

        // 生成 shoelace.css（内容与 shoelace-light.css 一致）
        const defaultCssDest = path.join(cssOutputDir, 'shoelace.css');
        fs.copyFileSync(lightCssSource, defaultCssDest);
    } else {
        console.warn(`[shoelace] light.css not found: ${lightCssSource}`);
    }

    if (fs.existsSync(darkCssSource)) {
        // 拷贝为 shoelace-dark.css
        const darkCssDest = path.join(cssOutputDir, 'shoelace-dark.css');
        fs.copyFileSync(darkCssSource, darkCssDest);
    } else {
        console.warn(`[shoelace] dark.css not found: ${darkCssSource}`);
    }

    // 3. 生成 version.json
    const shoelacePkgPath = path.resolve(process.cwd(), 'node_modules/@kdcloudjs/shoelace/package.json');
    if (fs.existsSync(shoelacePkgPath)) {
        const shoelacePkg = JSON.parse(fs.readFileSync(shoelacePkgPath, 'utf-8'));
        const versionJson = { version: shoelacePkg.version };
        const versionJsonPath = path.join(SHOELACE_OUTPUT_DIR, 'version.json');
        fs.writeFileSync(versionJsonPath, JSON.stringify(versionJson, null, 2));
    } else {
        console.warn(`[shoelace] package.json not found: ${shoelacePkgPath}`);
    }

    console.log('Shoelace assets processing complete!');
}

// 单个组件构建函数
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
    console.log(`Starting build in ${buildMode} mode${isWatch ? ' (watching)' : ''}...`);

    // 1. 生成所有入口文件
    const entryPoints = generateEntries(COMPONENTS_DIR, TEMP_ENTRY_DIR);
    const components = Object.keys(entryPoints);

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

    // 2. 执行全量构建（Watch 模式下作为初始构建）
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
        // 非 Watch 模式：构建完成后处理 Shoelace 资源并清理临时目录
        processShoelaceAssets();
        cleanup();
        console.log('All components built successfully!');
        return;
    }

    // 3. Watch 模式：启动监听
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
            buildComponent(componentName, entryPoints[componentName]);
            delete buildTasks[componentName];
        }, 300);
    };

    watcher
        .on('add', handleFileChange)
        .on('change', handleFileChange)
        .on('unlink', handleFileChange);
}

run();
