import { readdirSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const args = process.argv.slice(2);
const isWatch = args.includes('--watch');

// Clean dist directory once at the beginning
if (existsSync('dist')) {
    console.log('Cleaning dist directory...');
    rmSync('dist', { recursive: true, force: true });
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
    console.log('\nStarting Watch Mode...');
    try {
        execSync('rollup -c rollup.config.js --watch', {
            stdio: 'inherit',
            env: {
                ...process.env,
                KWC_TAG_MAPPING: JSON.stringify(tagMapping)
            }
        });
    } catch (e) {
        // Watch mode interrupted
        process.exit(0);
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
