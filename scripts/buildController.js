import { execSync } from 'child_process';
import { existsSync } from 'fs';
import minimist from 'minimist';
import pc from 'picocolors';

const argv = minimist(process.argv.slice(2), {
    alias: { e: ['env', 'target-env'] }
});

const components = argv._;
// 支持 --env=dev 或 --target-env=dev（npm run 时使用）或 -e dev（直接调用时使用）
const env = process.env.npm_config_env || process.env.npm_config_target_env || argv.e;

const controllerDir = 'app/ks/controller';

// 检查 controller 目录是否存在
if (!existsSync(controllerDir)) {
    console.log(pc.dim('No controller directory found, skipping controller build.'));
    process.exit(0);
}

// 构建 kd project build 命令
const cmdParts = ['kd', 'project', 'build'];

// 添加组件名（位置参数）
if (components.length > 0) {
    cmdParts.push(...components);
}

// 添加 --type controller
cmdParts.push('--type', 'controller');

// 添加环境参数
if (env) {
    cmdParts.push('-e', env);
}

const cmd = cmdParts.join(' ');

try {
    execSync(cmd, { stdio: 'inherit' });
} catch {
    process.exit(1);
}
