#!/usr/bin/env node

const express = require('express')
const fs = require('fs')
const path = require('path')
const chokidar = require('chokidar')

const app = express()
const PORT = 3000

const CWD = process.cwd()
const KD_CONFIG_PATH = path.join(CWD, '.kd', 'config.json')
const DIST_KWC_DIR = path.join(CWD, 'dist', 'kwc')

/* ===============================
 * 1️⃣ 读取 kd config
 * =============================== */

let kdConfig = {}

function loadKdConfig() {
  try {
    if (!fs.existsSync(KD_CONFIG_PATH)) {
      console.warn('[kd-config] .kd/config.json not found')
      kdConfig = {}
      return
    }

    const raw = fs.readFileSync(KD_CONFIG_PATH, 'utf-8').trim()
    if (!raw) {
      console.warn('[kd-config] config.json is empty')
      kdConfig = {}
      return
    }

    kdConfig = JSON.parse(raw)
  } catch (e) {
    console.error('[kd-config] parse error:', e.message)
  }
}

loadKdConfig()

/* ===============================
 * 全局 Header / CORS
 * =============================== */

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://feature.kingdee.com:1026')
  res.header('Access-Control-Allow-Credentials', true)
  res.header('Access-Control-Allow-Headers', 'Content-Type,Content-Length, Authorization, Accept,X-Requested-With')
  res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS')
  res.header('Content-Type', 'text/css;text/javascript;text/html;application/json;application/x-img')
  next()
})

// 监听 config 变化
chokidar.watch(KD_CONFIG_PATH, { ignoreInitial: true }).on('change', () => {
  console.log('[kd-config] changed, reloading...')
  loadKdConfig()
  setupStaticMiddleware()
})

/* ===============================
 * 2️⃣ 设置静态服务（动态 based on config）
 * =============================== */

let staticMiddleware = null

function setupStaticMiddleware() {
  // 移除旧的 middleware
  if (staticMiddleware) {
    app._router.stack = app._router.stack.filter(
      (layer) => layer.handle !== staticMiddleware
    )
  }

  const { isv, moduleId } = kdConfig
  if (!isv || !moduleId) {
    console.warn('[kd-server] kdConfig missing isv/moduleId, static route not mounted')
    return
  }

  const mountPath = `/isv/${isv}/${moduleId}`

  staticMiddleware = express.static(DIST_KWC_DIR, {
  setHeaders(res, filePath) {
    const ext = path.extname(filePath).toLowerCase()

    if (ext === '.js' || ext === '.mjs') {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
    }

    // 一些 LWC / KWC runtime 可能没有扩展名
    else if (!ext) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
    }

    console.log(
      '[static]',
      res.getHeader('Content-Type'),
      path.relative(DIST_KWC_DIR, filePath)
    )
  },
    fallthrough: false, // 找不到直接 404
  })

  app.use(mountPath, staticMiddleware)
}

// 初次挂载
setupStaticMiddleware()

/* ===============================
 * 3️⃣ 监听 dist/kwc 变化
 * =============================== */

if (fs.existsSync(DIST_KWC_DIR)) {
  chokidar.watch(DIST_KWC_DIR).on('all', (event, file) => {
    console.log(`[dist] ${event}: ${path.relative(CWD, file)}`)
  })
}


/* ===============================
 * 4️⃣ 启动服务
 * =============================== */

app.listen(PORT, () => {
  console.log(`
🚀 KD Dev Server Started
http://localhost:${PORT}
`)
})

