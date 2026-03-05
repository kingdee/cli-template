#!/usr/bin/env node

import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';

// 应用配置
const app = express();
const PORT = process.env.PORT || 3333;

// 路径配置
const CWD = process.cwd();
const KD_CONFIG_PATH = path.join(CWD, '.kd', 'config.json');
const DIST_KWC_DIR = path.join(CWD, 'dist', 'kwc');

/* ===============================
 * 1️⃣ 读取 kd config
 * =============================== */

interface KdConfig {
  isv?: string;
  app?: string;
  appId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

let kdConfig: KdConfig = {};

/**
 * 加载并解析 kd 配置文件
 */
function loadKdConfig() {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(KD_CONFIG_PATH)) {
      console.warn('[kd-config] .kd/config.json not found');
      kdConfig = {};
      return;
    }

    // 读取文件内容
    const raw = fs.readFileSync(KD_CONFIG_PATH, 'utf-8').trim();

    // 检查文件是否为空
    if (!raw) {
      console.warn('[kd-config] config.json is empty');
      kdConfig = {};
      return;
    }

    // 解析 JSON
    const parsedConfig = JSON.parse(raw);
    parsedConfig.appId = parsedConfig.app;

    // 验证必要字段
    if (parsedConfig.isv && parsedConfig.appId) {
      kdConfig = parsedConfig;
      console.log('[kd-config] Loaded:', { isv: parsedConfig.isv, app: parsedConfig.appId });
    } else {
      console.warn('[kd-config] Missing required fields (isv/app)');
      kdConfig = parsedConfig;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.error('[kd-config] Parse error:', e.message);
    kdConfig = {};
  }
}

loadKdConfig();

/* ===============================
 * 全局 Header / CORS
 * =============================== */

app.use((req: Request, res: Response, next: NextFunction) => {
  // CORS 配置
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
});

// 监听 config 变化
chokidar.watch(KD_CONFIG_PATH, { ignoreInitial: true }).on('change', () => {
  console.log('[kd-config] changed, reloading...');
  loadKdConfig();
  setupStaticMiddleware();
});

/* ===============================
 * 2️⃣ 设置静态服务（动态 based on config）
 * =============================== */

let staticRoutePath: string | null = null;

/**
 * 设置静态文件服务中间件
 */
function setupStaticMiddleware() {
  // 移除旧的静态路由
  if (staticRoutePath) {
    // 更可靠的路由移除方法
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const routes = (app._router as any)?.stack || [];
    const routeIndex = routes.findIndex(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (layer: any) => layer.route && layer.route.path === staticRoutePath
    );

    if (routeIndex !== -1) {
      routes.splice(routeIndex, 1);
      console.log('[static] Removed old static route:', staticRoutePath);
    }
    staticRoutePath = null;
  }

  const { isv, appId } = kdConfig;
  if (!isv || !appId) {
    console.warn('[kd-server] kdConfig missing isv/app, static route not mounted');
    return;
  }

  // 检查 dist/kwc 目录是否存在
  if (!fs.existsSync(DIST_KWC_DIR)) {
    console.warn('[static] dist/kwc directory not found, please run build first');
  }

  // 创建自定义静态中间件
  const isvDir = ['kingdee', 'kdxk'].includes(isv) ? isv : `isv/${isv}`;
  const mountPath = `/${isvDir}/${appId}`;

  // 创建中间件实例
  const staticMiddleware = express.static(DIST_KWC_DIR, {
    setHeaders(res, filePath) {
      const ext = path.extname(filePath).toLowerCase();

      // 设置正确的 Content-Type
      if (ext === '.js' || ext === '.mjs') {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (ext === '.css') {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      } else if (ext === '.json') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      } else if (ext === '.html') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      } else if (!ext) {
        // 一些 LWC / KWC runtime 可能没有扩展名
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      }

      console.log(
        '[static]',
        // res.getHeader('Content-Type'),
        path.relative(DIST_KWC_DIR, filePath)
      );
    },
    fallthrough: false, // 找不到直接 404
    maxAge: 0 // 开发环境不缓存
  });

  // 注册路由并保存路由路径
  app.use(mountPath, staticMiddleware);
  staticRoutePath = mountPath;

  console.log('[static] Mounted static files:', DIST_KWC_DIR, 'at', mountPath);
}

// 初次挂载
setupStaticMiddleware();

/* ===============================
 * 3️⃣ 监听 dist/kwc 变化
 * =============================== */

// 监听 dist/kwc 目录变化
function setupDistWatcher() {
  if (fs.existsSync(DIST_KWC_DIR)) {
    const watcher = chokidar.watch(DIST_KWC_DIR, {
      ignoreInitial: true,
      followSymlinks: false
    });

    watcher.on('all', (event, file) => {
      console.log(`[dist] ${event}: ${path.relative(CWD, file)}`);
    });

    watcher.on('ready', () => {
      console.log('[watch] Watching dist/kwc directory for changes...');
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    watcher.on('error', (error: any) => {
      console.error('[watch] Error watching dist/kwc:', error.message);
    });

    return watcher;
  }
  console.warn('[watch] dist/kwc directory not found, watching disabled');
  return null;

}

// 设置文件变化监听
const distWatcher = setupDistWatcher();

/* ===============================
 * 4️⃣ 启动服务
 * =============================== */

// 启动 HTTP 服务器

app.listen(PORT, () => {
  console.log('\n🚀 KD Dev Server Started');
  console.log(`📡 Listening on http://localhost:${PORT}`);
  console.log(`📁 Static files root: ${DIST_KWC_DIR}`);

  // 显示当前配置信息
  if (kdConfig.isv && kdConfig.appId) {
    const staticUrl = `http://localhost:${PORT}/isv/${kdConfig.isv}/${kdConfig.appId}`;
    console.log(`🔗 Static files URL: ${staticUrl}`);
  } else {
    console.log('⚠️  Static files not mounted, please check .kd/config.json');
  }

  console.log('\nPress Ctrl+C to stop server\n');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}).on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use, please use another port`);
  } else {
    console.error('❌ Failed to start server:', error.message);
  }
  process.exit(1);
});

// 处理进程关闭
process.on('SIGINT', () => {
  console.log('\n🛑 Server shutting down...');

  // 关闭文件监听器
  if (distWatcher) {
    distWatcher.close();
    console.log('📋 File watcher closed');
  }

  process.exit(0);
});
