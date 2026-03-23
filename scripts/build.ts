import { build } from 'vite';
import * as path from 'path';
import * as fs from 'fs';
import chokidar from 'chokidar';
import { generateEntries } from './entry-generator';

const COMPONENTS_DIR = path.resolve(process.cwd(), 'app/kwc');
const TEMP_ENTRY_DIR = path.resolve(process.cwd(), 'temp-entry');

// 解析参数
const isWatch = process.argv.includes('--watch');
const buildMode = isWatch ? 'development' : 'production';

/**
 * 递归复制目录（兼容 Node.js 10+）
 */
function copyDirectory(src: string, dest: string) {
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
        console.log(`[shoelace] Copied assets to ${assetsDest}`);
    }

    // 2. 单独输出各主题 CSS 文件到 css 目录（添加 shoelace- 前缀）
    const themesDir = path.join(shoelaceDist, 'themes');
    if (fs.existsSync(themesDir)) {
        // 只处理 light.css 和 dark.css
        const targetThemes = ['light.css', 'dark.css'];
        
        for (const themeFile of targetThemes) {
            const srcPath = path.join(themesDir, themeFile);
            if (fs.existsSync(srcPath)) {
                const destFileName = `shoelace-${themeFile}`;
                const destPath = path.join(cssOutputDir, destFileName);
                fs.copyFileSync(srcPath, destPath);
                console.log(`[shoelace] Copied ${themeFile} to ${destFileName}`);
            }
        }

        // 复制 shoelace-light.css 为 shoelace.css（兼容现有用户）
        const lightCssPath = path.join(cssOutputDir, 'shoelace-light.css');
        if (fs.existsSync(lightCssPath)) {
            const compatPath = path.join(cssOutputDir, 'shoelace.css');
            fs.copyFileSync(lightCssPath, compatPath);
            console.log(`[shoelace] Created shoelace.css (copy of shoelace-light.css) for compatibility`);
        }
    }

    // 3. 读取 shoelace 的 version 并生成 version.json
    const shoelacePkgPath = path.join(shoelaceRoot, 'package.json');
    if (fs.existsSync(shoelacePkgPath)) {
        const shoelacePkg = JSON.parse(fs.readFileSync(shoelacePkgPath, 'utf-8'));
        const versionJson = { version: shoelacePkg.version };
        const versionOutputPath = path.join(outputDir, 'version.json');
        fs.writeFileSync(versionOutputPath, JSON.stringify(versionJson, null, 2));
        console.log(`[shoelace] Generated version.json with version: ${shoelacePkg.version}`);
    }

    console.log('[shoelace] All shoelace resources processed successfully!');
}

// 单个组件构建函数
async function buildComponent(componentName: string, entryFile: string) {
    const logPrefix = isWatch ? '[Rebuild] ' : '';
    console.log(`${logPrefix}Building component: ${componentName}...`);

    process.env.TARGET_COMPONENT = componentName;
    process.env.ENTRY_FILE = entryFile;

    try {
        await build({
            configFile: path.resolve(process.cwd(), 'vite.config.ts'),
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
        // 非 Watch 模式：处理 shoelace 资源，然后清理临时目录并退出
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
    const buildTasks: Record<string, NodeJS.Timeout> = {};

    const handleFileChange = (filePath: string) => {
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
