/**
 * 织念 ZhiNian - 后端 API 服务
 * 功能：用户注册/登录、卡片数据云端同步
 * 存储：JSON 文件（零数据库依赖）
 */

const http = require('http')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const PORT = process.env.PORT || 3000
const DATA_DIR = path.join(__dirname, 'data')

// ====== 数据存储工具 ======
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

function getUsers() {
  ensureDataDir()
  const f = path.join(DATA_DIR, 'users.json')
  if (!fs.existsSync(f)) { fs.writeFileSync(f, '{}'); return {} }
  return JSON.parse(fs.readFileSync(f, 'utf-8'))
}

function saveUsers(users) {
  ensureDataDir()
  fs.writeFileSync(path.join(DATA_DIR, 'users.json'), JSON.stringify(users, null, 2))
}

function hashPwd(pwd, salt) {
  return crypto.pbkdf2Sync(pwd, salt, 10000, 64, 'sha256').toString('hex')
}

function makeSalt() { return crypto.randomBytes(16).toString('hex') }
function makeToken() { return crypto.randomBytes(32).toString('hex') }

// ====== 用户数据存储 ======
function getUserDataDir(userId) {
  const dir = path.join(DATA_DIR, 'users', userId)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function getUserData(userId) {
  const f = path.join(getUserDataDir(userId), 'data.json')
  if (!fs.existsSync(f)) return { cards: [], links: [] }
  return JSON.parse(fs.readFileSync(f, 'utf-8'))
}

function saveUserData(userId, data) {
  fs.writeFileSync(path.join(getUserDataDir(userId), 'data.json'), JSON.stringify(data, null, 2))
}

// ====== 在线 token 表 ======
const activeTokens = new Map()

// ====== 工具函数 ======
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Token')
}

function jsonRes(res, code, data) {
  cors(res)
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(data))
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', () => { try { resolve(JSON.parse(body)) } catch { resolve({}) } })
  })
}

function getUserId(req) {
  const token = (req.headers['authorization'] || req.headers['x-token'] || '').replace('Bearer ', '')
  return activeTokens.get(token) || null
}

// ====== 路由 ======
async function handleRequest(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  const urlPath = new URL(req.url, `http://${req.headers.host}`).pathname

  try {
    // POST /api/register
    if (urlPath === '/api/register' && req.method === 'POST') {
      const { username, password } = await parseBody(req)
      if (!username || !password || username.length < 2 || password.length < 4) {
        return jsonRes(res, 400, { error: '用户名至少2位，密码至少4位' })
      }
      const users = getUsers()
      if (users[username]) {
        return jsonRes(res, 409, { error: '用户名已存在' })
      }
      const salt = makeSalt()
      const userId = crypto.randomUUID()
      users[username] = { hash: hashPwd(password, salt), salt, createdAt: new Date().toISOString(), userId }
      saveUsers(users)
      const token = makeToken()
      activeTokens.set(token, userId)
      return jsonRes(res, 200, { ok: true, token, userId, username })
    }

    // POST /api/login
    if (urlPath === '/api/login' && req.method === 'POST') {
      const { username, password } = await parseBody(req)
      const user = (getUsers())[username]
      if (!user || user.hash !== hashPwd(password, user.salt)) {
        return jsonRes(res, 401, { error: '用户名或密码错误' })
      }
      const token = makeToken()
      activeTokens.set(token, user.userId)
      return jsonRes(res, 200, { ok: true, token, userId: user.userId, username })
    }

    // POST /api/sync （需登录）
    if (urlPath === '/api/sync' && req.method === 'POST') {
      const userId = getUserId(req)
      if (!userId) return jsonRes(res, 401, { error: '未登录' })
      const body = await parseBody(req)
      saveUserData(userId, { cards: body.cards || [], links: body.links || [] })
      return jsonRes(res, 200, { ok: true, message: '同步成功' })
    }

    // GET /api/data （需登录）
    if (urlPath === '/api/data' && req.method === 'GET') {
      const userId = getUserId(req)
      if (!userId) return jsonRes(res, 401, { error: '未登录' })
      return jsonRes(res, 200, getUserData(userId))
    }

    // 静态文件
    if (req.method === 'GET' && (urlPath === '/' || urlPath === '/index.html')) {
      cors(res)
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8'))
      return
    }

    jsonRes(res, 404, { error: 'Not Found' })

  } catch (err) {
    console.error('Server error:', err)
    jsonRes(res, 500, { error: '服务器内部错误' })
  }
}

// ====== 启动 ======
ensureDataDir()
http.createServer(handleRequest).listen(PORT, () => {
  console.log(`🧶 织念后端服务启动成功！ http://localhost:${PORT}`)
})
