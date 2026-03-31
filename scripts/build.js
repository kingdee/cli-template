import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync, rmSync } from 'fs';
import { join, basename } from 'path';
import minimist from 'minimist';
import pc from 'picocolors';

const argv = minimist(process.argv.slice(2), {
    alias: { e: ['env', 'target-env'] }
});
// 优先从 npm config 读取 type（支持 npm run build --type=frontend）
// 其次从命令行参数读取（支持 npm run build -- --type frontend）
const type = process.env.npm_config_type || argv.type;
const components = argv._;  // 位置参数（组件名）
// 支持 --env=dev 或 --target-env=dev（npm run 时使用）或 -e dev（直接调用时使用）
const env = process.env.npm_config_env || process.env.npm_config_target_env || argv.e;

/**
 * 带重试的目录删除（应对 macOS .DS_Store 导致的 ENOTEMPTY）
 * @param {string} dir - 目录路径
 * @param {number} retries - 最大重试次数
 */
function rmSyncRetry(dir, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            rmSync(dir, { recursive: true, force: true });
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
 * 清理 dist 目录（全量构建时使用）
 */
function cleanDist() {
    if (existsSync('dist')) {
        console.log('Cleaning dist directory...');
        rmSyncRetry('dist');
    }
}

// 校验：指定了组件名但没有指定 type
if (components.length > 0 && !type) {
    console.error(`\n${pc.red(pc.bold('Error:'))} The ${pc.yellow('--type')} option is required when specifying names`);
    console.error(`\n${pc.dim('Usage:')}`);
    console.error(pc.dim(` npm run build ${components[0]} --type=frontend`));
    console.error(pc.dim(` npm run build ${components[0]} --type=controller`));
    console.error(`\nAvailable type values: ${pc.cyan('frontend')}, ${pc.cyan('controller')}\n`);
    process.exit(1);
}

// 构建前端
function buildFrontend(comps) {
    const args = comps.length > 0 ? comps.join(' ') : '';
    try {
        execSync(`node scripts/buildFrontend.js ${args}`, { stdio: 'inherit' });
    } catch {
        process.exit(1);
    }
}

// 构建 controller
function buildController(comps, targetEnv) {
    const args = comps.length > 0 ? comps.join(' ') : '';
    const envArg = targetEnv ? `-e ${targetEnv}` : '';
    try {
        execSync(`node scripts/buildController.js ${args} ${envArg}`.trim(), { stdio: 'inherit' });
    } catch {
        process.exit(1);
    }
}

/**
 * 递归查找指定扩展名的文件
 * @param {string} dir - 目录路径
 * @param {string} ext - 文件扩展名（如 '.kwp'）
 * @returns {string[]} 匹配的文件路径数组
 */
function findFilesByExt(dir, ext) {
    const results = [];
    if (!existsSync(dir)) {
        return results;
    }
    const items = readdirSync(dir);
    for (const item of items) {
        const fullPath = join(dir, item);
        if (statSync(fullPath).isDirectory()) {
            results.push(...findFilesByExt(fullPath, ext));
        } else if (item.endsWith(ext)) {
            results.push(fullPath);
        }
    }
    return results;
}

/**
 * 拷贝元数据文件到 dist/metadata 目录
 */
function copyMetadata() {
    const destDir = 'dist/metadata';
    mkdirSync(destDir, { recursive: true });

    // 拷贝 pages 下的 .kwp 文件
    const kwpFiles = findFilesByExt('app/pages', '.kwp');
    for (const file of kwpFiles) {
        const destFile = join(destDir, basename(file));
        copyFileSync(file, destFile);
    }

    // 拷贝 app/kwc 下的 .kwc 文件
    const kwcFiles = findFilesByExt('app/kwc', '.kwc');
    for (const file of kwcFiles) {
        const destFile = join(destDir, basename(file));
        copyFileSync(file, destFile);
    }

    const total = kwpFiles.length + kwcFiles.length;
    if (total > 0) {
        console.log(pc.green(`\nCopied ${total} metadata file(s) to dist/metadata`));
    }
}

// 根据 type 执行对应构建
if (!type) {
    // 无参数：构建全部，先清理整个 dist 目录
    cleanDist();
    buildFrontend([]);
    buildController([], env);
    copyMetadata();
} else if (type === 'frontend') {
    buildFrontend(components);
} else if (type === 'controller') {
    buildController(components, env);
} else {
    console.error(`\n${pc.red(pc.bold('Error:'))} Unknown type value ${pc.yellow(`"${type}"`)}`);
    console.error(`Available type values: ${pc.cyan('frontend')}, ${pc.cyan('controller')}\n`);
    process.exit(1);
}
