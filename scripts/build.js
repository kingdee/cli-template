import { readdirSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// Clean dist directory once at the beginning
if (existsSync('dist')) {
    console.log('Cleaning dist directory...');
    rmSync('dist', { recursive: true, force: true });
}

const componentsDir = 'app/kwc';
const componentFolders = readdirSync(componentsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

console.log(`Found components: ${componentFolders.join(', ')}`);

if (componentFolders.length > 0) {
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
                        TARGET_COMPONENT: folder
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
                    TARGET_COMPONENT: 'main'
                }
            });
        } catch (e) {
            console.error('Failed to build main.js');
            process.exit(1);
        }
    }
}
