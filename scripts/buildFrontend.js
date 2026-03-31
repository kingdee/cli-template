import { readdirSync, existsSync, rmSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'fs';
import { join } from 'path';
import { execSync, spawn } from 'child_process';
import minimist from 'minimist';
import pc from 'picocolors';

// 使用 minimist 解析命令行参数
const argv = minimist(process.argv.slice(2));
const isWatch = argv.watch || false;
const specifiedComponents = argv._;  // 位置参数（组件名）

/**
 * 带重试的目录删除（macOS 上 Spotlight/Finder 可能在删除过程中写入 .DS_Store 导致 ENOTEMPTY）
 */
function rmSyncRetry(dir, retries = 3, delay = 200) {
    for (let i = 0; i < retries; i++) {
        try {
            rmSync(dir, { recursive: true, force: true });
            return;
        } catch (err) {
            if (err.code === 'ENOTEMPTY' && i < retries - 1) {
                const ms = delay * (i + 1);
                console.log(`  rmSync ENOTEMPTY, retrying in ${ms}ms...`);
                const start = Date.now();
                while (Date.now() - start < ms) { /* busy wait */ }
            } else {
                throw err;
            }
        }
    }
}

/**
 * 清理前端构建目录
 * 如果指定了组件名，只清理这些组件的输出目录；否则清除 dist/kwc 和 dist/shoelace
 */
function cleanFrontendDirs(componentNames) {
    if (componentNames && componentNames.length > 0) {
        // 只清理指定组件的输出目录
        for (const name of componentNames) {
            const dir = join('dist/kwc', name);
            if (existsSync(dir)) {
                console.log(`Cleaning ${dir}...`);
                rmSyncRetry(dir);
            }
        }
    } else {
        // 全量清理
        const frontendDirs = ['dist/kwc', 'dist/shoelace'];
        for (const dir of frontendDirs) {
            if (existsSync(dir)) {
                console.log(`Cleaning ${dir}...`);
                rmSyncRetry(dir);
            }
        }
    }
}

// 根据是否指定组件决定清理范围
cleanFrontendDirs(specifiedComponents.length > 0 ? specifiedComponents : undefined);

/**
 * Recursively copy a directory, skipping .DS_Store files
 */
function copyDir(src, dest) {
    mkdirSync(dest, { recursive: true });
    for (const entry of readdirSync(src, { withFileTypes: true })) {
        if (entry.name === '.DS_Store') continue;
        const srcPath = join(src, entry.name);
        const destPath = join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * Copy shoelace resources to dist/shoelace
 * 1. Copy assets folder
 * 2. Merge theme CSS files into shoelace.css
 * 3. Generate version.json from package.json
 */
function copyShoelaceResources() {
    const shoelacePath = 'node_modules/@kdcloudjs/shoelace';
    const shoelaceDistPath = join(shoelacePath, 'dist');
    const outputDir = 'dist/shoelace';

    // Check if shoelace dist exists
    if (!existsSync(shoelaceDistPath)) {
        console.warn('Shoelace dist directory not found, skipping shoelace resource copy.');
        return;
    }

    // Create output directory
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }

    console.log('\nProcessing Shoelace resources...');

    // 1. Copy assets folder
    const assetsPath = join(shoelaceDistPath, 'assets');
    if (existsSync(assetsPath)) {
        copyDir(assetsPath, join(outputDir, 'assets'));
    } else {
        console.warn('  - Assets folder not found, skipping.');
    }

    // 2. 单独输出各主题 CSS 文件到 css 目录（添加 shoelace- 前缀）
    const themesPath = join(shoelaceDistPath, 'themes');
    const cssOutputDir = join(outputDir, 'css');
    if (existsSync(themesPath)) {
        // 确保 css 输出目录存在
        if (!existsSync(cssOutputDir)) {
            mkdirSync(cssOutputDir, { recursive: true });
        }

        // 只处理 light.css 和 dark.css
        const targetThemes = ['light.css', 'dark.css'];

        for (const themeFile of targetThemes) {
            const srcPath = join(themesPath, themeFile);
            if (existsSync(srcPath)) {
                const destFileName = `shoelace-${themeFile}`;
                const destPath = join(cssOutputDir, destFileName);
                copyFileSync(srcPath, destPath);
            }
        }

        // 复制 shoelace-light.css 为 shoelace.css（兼容现有用户）
        const lightCssPath = join(cssOutputDir, 'shoelace-light.css');
        if (existsSync(lightCssPath)) {
            const compatPath = join(cssOutputDir, 'shoelace.css');
            copyFileSync(lightCssPath, compatPath);
        }
    } else {
        console.warn('  - Themes folder not found, skipping CSS copy.');
    }

    // 3. Generate version.json from package.json
    const packageJsonPath = join(shoelacePath, 'package.json');
    if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        const versionJson = { version: packageJson.version };
        writeFileSync(join(outputDir, 'version.json'), JSON.stringify(versionJson, null, 2));
    } else {
        console.warn('  - Shoelace package.json not found, skipping version.json generation.');
    }

    console.log('Shoelace resources processed successfully!\n');
}

const componentsDir = 'app/kwc';
// 排除非组件目录
const excludeDirs = ['static'];
let componentFolders = readdirSync(componentsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && !excludeDirs.includes(dirent.name))
    .map(dirent => dirent.name);

// 如果指定了组件名，只编译这些组件
if (specifiedComponents.length > 0) {
    // 验证指定的组件是否存在
    const validComponents = [];
    const invalidComponents = [];

    for (const comp of specifiedComponents) {
        if (componentFolders.includes(comp)) {
            validComponents.push(comp);
        } else {
            invalidComponents.push(comp);
        }
    }

    if (invalidComponents.length > 0) {
        console.warn(`\n${pc.yellow('Warning:')} The following components were not found and will be skipped: ${pc.yellow(invalidComponents.join(', '))}`);
        console.log(`Available components: ${pc.dim(componentFolders.join(', '))}\n`);
    }

    if (validComponents.length === 0) {
        console.error(`\n${pc.red(pc.bold('Error:'))} No valid components specified.\n`);
        process.exit(1);
    }

    componentFolders = validComponents;
    console.log(`\nBuilding specified components: ${validComponents.join(', ')}\n`);
}

// Generate Tag Mapping
const tagMapping = {};
const toKebab = (str) => str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();


componentFolders.forEach(folder => {
    // Generate a random hash (ensure it starts with a letter to avoid camelCase issues)
    const hash = `v${Math.random().toString(36).substring(2, 8)}`;
    const tagName = `kwc-${toKebab(folder)}`;
    tagMapping[tagName] = `${tagName}-${hash}`;
});

console.log(pc.dim(`Building frontend...\n`));
if (isWatch) {
    console.log('\nStarting Watch Mode for all components...');
    const processes = [];

    // Clean up processes on exit
    const cleanup = () => {
        console.log('\nStopping all watch processes...');
        processes.forEach(p => p.kill());
        process.exit(0);
    };
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // Concurrent watch for each component
    if (componentFolders.length > 0) {
        for (const folder of componentFolders) {
            const filePath = join(componentsDir, folder, `${folder}.js`);
            if (existsSync(filePath)) {
                console.log(`Starting watch for: ${folder}`);
                // Use spawn for parallel execution
                try {
                    const rollupCmd = process.platform === 'win32' ? 'rollup.cmd' : 'rollup';
                    const child = spawn(rollupCmd, ['-c', 'rollup.config.js', '--watch'], {
                        stdio: 'inherit',
                        shell: process.platform === 'win32', // Only use shell on Windows if needed, or rely on .cmd extension
                        env: {
                            ...process.env,
                            TARGET_COMPONENT: folder,
                            KWC_TAG_MAPPING: JSON.stringify(tagMapping)
                        }
                    });

                    child.on('error', (err) => {
                        console.error(`Failed to start watch for ${folder}:`, err);
                    });

                    processes.push(child);
                } catch (err) {
                    console.error(`Error starting watch process for ${folder}:`, err);
                }
            } else {
                console.warn(`Skipping ${folder}: entry file not found.`);
            }
        }
    }
} else if (componentFolders.length > 0) {
    for (const folder of componentFolders) {
        const filePath = join(componentsDir, folder, `${folder}.js`);
        if (existsSync(filePath)) {
            console.log(`\nBuilding component: ${folder}...`);
            try {
                // Pass the current environment variables along with TARGET_COMPONENT
                execSync('rollup -c rollup.config.js', {
                    stdio: 'inherit',
                    env: {
                        ...process.env,
                        TARGET_COMPONENT: folder,
                        KWC_TAG_MAPPING: JSON.stringify(tagMapping)
                    }
                });
            } catch (e) {
                console.error(`Failed to build ${folder}`);
                process.exit(1);
            }
        } else {
            console.warn(`Skipping ${folder}: entry file not found.`);
        }
    }
} else {
    // Fallback: if no components found but main.js exists
    if (existsSync(join(componentsDir, 'main.js'))) {
        console.log('\nNo component folders found. Building main.js...');
        try {
            execSync('rollup -c rollup.config.js', {
                stdio: 'inherit',
                env: {
                    ...process.env,
                    TARGET_COMPONENT: 'main',
                    KWC_TAG_MAPPING: JSON.stringify(tagMapping)
                }
            });
        } catch (e) {
            console.error('Failed to build main.js');
            process.exit(1);
        }
    }
}

// Copy shoelace resources after build (only in non-watch mode)
if (!isWatch) {
    copyShoelaceResources();
    console.log(pc.green(`Frontend build completed\n`));
}
