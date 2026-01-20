import { build } from 'vite';
import * as path from 'path';
import * as fs from 'fs';
import chokidar from 'chokidar';
import { generateEntries } from './entry-generator.js';

const COMPONENTS_DIR = path.resolve(process.cwd(), 'app/kwc');
const TEMP_ENTRY_DIR = path.resolve(process.cwd(), 'temp-entry');

// 解析参数
const isWatch = process.argv.includes('--watch');
const buildMode = isWatch ? 'development' : 'production';

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
        // 非 Watch 模式：构建完成后清理临时目录并退出
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
