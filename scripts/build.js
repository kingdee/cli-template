import { readdirSync, existsSync, rmSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'fs';
import { join } from 'path';
import { execSync, spawn } from 'child_process';

const args = process.argv.slice(2);
const isWatch = args.includes('--watch');

// Clean dist directory once at the beginning
if (existsSync('dist')) {
    console.log('Cleaning dist directory...');
    rmSync('dist', { recursive: true, force: true });
}

/**
 * Recursively copy a directory (compatible with Node.js < 16.7)
 */
function copyDir(src, dest) {
    mkdirSync(dest, { recursive: true });
    for (const entry of readdirSync(src, { withFileTypes: true })) {
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
        console.log('  - Copied assets folder');
    } else {
        console.warn('  - Assets folder not found, skipping.');
    }

    // 2. Merge theme CSS files
    const themesPath = join(shoelaceDistPath, 'themes');
    if (existsSync(themesPath)) {
        const cssFiles = readdirSync(themesPath).filter(file => file.endsWith('.css'));
        if (cssFiles.length > 0) {
            let mergedCss = '';
            cssFiles.forEach(file => {
                const cssContent = readFileSync(join(themesPath, file), 'utf-8');
                mergedCss += `/* ${file} */\n${cssContent}\n\n`;
            });
            writeFileSync(join(outputDir, 'shoelace.css'), mergedCss);
            console.log(`  - Merged ${cssFiles.length} theme CSS files into shoelace.css`);
        } else {
            console.warn('  - No CSS files found in themes folder.');
        }
    } else {
        console.warn('  - Themes folder not found, skipping CSS merge.');
    }

    // 3. Generate version.json from package.json
    const packageJsonPath = join(shoelacePath, 'package.json');
    if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        const versionJson = { version: packageJson.version };
        writeFileSync(join(outputDir, 'version.json'), JSON.stringify(versionJson, null, 2));
        console.log(`  - Generated version.json (version: ${packageJson.version})`);
    } else {
        console.warn('  - Shoelace package.json not found, skipping version.json generation.');
    }

    console.log('Shoelace resources processed successfully!\n');
}

const componentsDir = 'app/kwc';
const componentFolders = readdirSync(componentsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

// Generate Tag Mapping
const tagMapping = {};
const toKebab = (str) => str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();

componentFolders.forEach(folder => {
    // Generate a random hash (ensure it starts with a letter to avoid camelCase issues)
    const hash = `v${Math.random().toString(36).substring(2, 8)}`;
    const tagName = `kwc-${toKebab(folder)}`;
    tagMapping[tagName] = `${tagName}-${hash}`;
});

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
}
