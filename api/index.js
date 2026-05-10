/**
 * 织念 ZhiNian - Vercel Serverless API
 */

const crypto = require('crypto')

function hashPwd(pwd, salt) {
  return crypto.pbkdf2Sync(pwd, salt, 10000, 64, 'sha256').toString('hex')
}
function makeSalt() { return crypto.randomBytes(16).toString('hex') }
function makeToken() { return crypto.randomBytes(32).toString('hex') }

// 种子数据（精简版）
const SEED_USERS = {
  'Patty': {
    hash: '47ee0ef13fb33d984c178d705424b5f210e40e06821d07468460a8fa5a681a1e36e29a426247c7c5e9bb68b9eec76e36d4077b03b4e02946786ef1d7ca014abb',
    salt: 'be73f32c3b85f433917d04cc24651bd6',
    userId: 'f09d3fb2-c745-41ff-a34a-2aad885be4c4'
  }
}

const SEED_DATA = {
  'f09d3fb2-c745-41ff-a34a-2aad885be4c4': {
    "cards":[
      {"id":"moy458rl792ig1","content":"因为工作的事情好焦虑，到底怎么缓解！！！","category":"emotion","tags":[],"keywords":["工作","焦虑","缓解"],"createdAt":"2026-05-09T08:59:59.265Z"},
      {"id":"moxrq05irywt67","content":"生命最温柔的时刻，是学会对自己说：你已经很努力了。（这是蛤蟆先生教会我的终极治愈）","category":"knowledge","tags":[],"keywords":["温柔","努力","终极治愈","蛤蟆先生"],"createdAt":"2026-05-09T03:12:12.870Z"},
      {"id":"moxro66k6uxss2","content":"你的人生剧本，只能由你自己改写。（原生家庭≠命运，你永远有选择权）","category":"knowledge","tags":[],"keywords":["选择权","原生家庭","人生剧本"],"createdAt":"2026-05-09T03:10:47.372Z"},
      {"id":"moxrmn2y47cgja","content":"当你停止自我审判，世界才会放过你。（那个批判你的声音，真的值得信任吗？）","category":"knowledge","tags":[],"keywords":["自我审判","批判","信任"],"createdAt":"2026-05-09T03:09:35.962Z"},
      {"id":"moxreqlgai8vqn","content":"讨好型人格的代价，是弄丢真实的自己。（警惕那些"我必须让人喜欢"的执念）","category":"knowledge","tags":[],"keywords":["代价","讨好型人格","自己","让人喜欢","执念"],"createdAt":"2026-05-09T03:03:27.268Z"},
      {"id":"moxqqwdcgxanic","content":"真正的成长，是戒掉对他人认可的瘾。（从"儿童自我状态"走向"成人自我状态"）","category":"knowledge","tags":[],"keywords":["成长","他人认可","自我状态"],"createdAt":"2026-05-09T02:44:55.008Z"},
      {"id":"moxqoqwm6iox64","content":"情绪不是你的敌人，否认情绪才是。（允许自己愤怒/悲伤/脆弱，才是健康的开始）","category":"knowledge","tags":[],"keywords":["情绪","悲伤","脆弱","敌人"],"createdAt":"2026-05-09T02:43:14.614Z"},
      {"id":"moxqbki0kvciqc","content":"尝试看了AI短剧，挺有意思的，剧情跌宕起伏直戳爽点。","category":"experience","tags":[],"keywords":["AI短剧","爽点","捉虫","审美","剧情"],"createdAt":"2026-05-09T02:32:59.784Z"},
      {"id":"moxq0fuageq96u","content":"早上上班路上路过万象汇，一群阿姨在门前的巨型柯基装置前拍错位合照，很生动。","category":"emotion","tags":[],"keywords":["万象汇","早上","上班","合照","欢乐","幸福"],"createdAt":"2026-05-09T02:24:20.530Z"},
      {"id":"mownwduo4hr4bp","content":"视觉系（Visual kei），也被称为视觉摇滚。兴起于1980年代末期的日本音乐运动与亚文化。","category":"knowledge","tags":[],"keywords":["摇滚","华丽","融合","视觉系","视觉摇滚","重金属"],"createdAt":"2026-05-08T08:37:25.920Z"},
      {"id":"mowlgjgtiq5mny","content":"麦当劳的板烧鸡腿堡挺好吃的，热量也低适合作为中饭减肥。","category":"experience","tags":[],"keywords":["热量","麦当劳","板烧鸡腿堡","减肥"],"createdAt":"2026-05-08T07:29:07.469Z"},
      {"id":"mowlcnleqe57xa","content":"最近因为AI的冲击，组织架构变动，个人的landing存在障碍，看不到短期的职业发展方向。","category":"emotion","tags":[],"keywords":["landing","AI","组织架构变动","未来掌控感","职业发展方向"],"createdAt":"2026-05-08T07:26:06.194Z"},
      {"id":"mowar8vpygtcrz","content":"你不是一个烂苹果，你只是好透了。","category":"spark","tags":[],"keywords":["烂苹果"],"createdAt":"2026-05-08T02:29:31.189Z"},
      {"id":"mowafxt7dr4f99","content":"五一节假日去大连看海了，大海辽阔，可以容纳所有的不开心。","category":"experience","tags":[],"keywords":["五一","大连看海","大海","焦虑"],"createdAt":"2026-05-08T02:20:43.627Z"},
      {"id":"mowa8o8z2egler","content":"5-4-3-2-1 感官 grounding 法：当你感到思绪纷飞时试试这个缓解焦虑的小方法。","category":"knowledge","tags":[],"keywords":["缓解焦虑","grounding","思绪纷飞"],"createdAt":"2026-05-08T02:15:04.644Z"},
      {"id":"mowa196fjcvr29","content":"焦虑的本质不是对未来的恐惧，而是想象力跑在了行动力的前面。","category":"emotion","tags":[],"keywords":["想象","未来","焦虑"],"createdAt":"2026-05-08T02:09:18.519Z"},
      {"id":"mow9uoozsh57ta","content":"MCP（Model Context Protocol）是Anthropic提出的AI模型上下文协议，成为AI应用的USB接口标准。","category":"knowledge","tags":[],"keywords":["AI","Anthropic","MCP","USB接口"],"createdAt":"2026-05-08T02:04:12.035Z"},
      {"id":"mow9qmcbt11k4f","content":"长寿公式=健康饮食+每天运动42分钟+每天7.2-8小时睡眠，三者搭配到黄金状态可延寿近10年。","category":"knowledge","tags":[],"keywords":["健康","运动","长寿","饮食","柳叶刀"],"createdAt":"2026-05-08T02:01:02.363Z"},
      {"id":"mow9maby322tc6","content":"ABCDE法则：A诱发事件 B信念 C后果 D辩论 E效果。","category":"knowledge","tags":[],"keywords":["ABCDE法则","合理","情绪","认知"],"createdAt":"2026-05-08T01:57:40.174Z"}
    ],
    "links":[
      {"id":"mowlcvqnw8u0gw","sourceId":"mowlcnleqe57xa","targetId":"mow9uoozsh57ta","createdAt":"2026-05-08T07:26:16.751Z"},
      {"id":"moxqouu0y3axu7","sourceId":"moxqoqwm6iox64","targetId":"mow9maby322tc6","createdAt":"2026-05-09T02:43:19.704Z"}
    ]
  }
}

// 运行时存储
const usersStore = { ...SEED_USERS }
const dataStore = { ...SEED_DATA }
const activeTokens = new Map()

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Token')

  if (req.method === 'OPTIONS') { return res.status(204).end() }

  const url = new URL(req.url, `https://${req.headers.host}`)
  const path = url.pathname.replace(/^\/api\/?/, '') || ''

  try {
    let body = {}
    if (req.body && typeof req.body === 'string') {
      try { body = JSON.parse(req.body) } catch(e) { body = {} }
    } else if (req.body) {
      body = req.body
    }

    // POST /api/register
    if (path === 'register' && req.method === 'POST') {
      const { username, password } = body
      if (!username || !password || username.length < 2 || password.length < 4) {
        return res.status(400).json({ error: '用户名至少2位，密码至少4位' })
      }
      if (usersStore[username]) {
        return res.status(409).json({ error: '用户名已存在' })
      }
      const salt = makeSalt()
      const userId = crypto.randomUUID()
      usersStore[username] = { hash: hashPwd(password, salt), salt, createdAt: new Date().toISOString(), userId }
      const token = makeToken()
      activeTokens.set(token, userId)
      return res.json({ ok: true, token, userId, username })
    }

    // POST /api/login
    if (path === 'login' && req.method === 'POST') {
      const { username, password } = body
      const user = usersStore[username]
      if (!user || user.hash !== hashPwd(password, user.salt)) {
        return res.status(401).json({ error: '用户名或密码错误' })
      }
      const token = makeToken()
      activeTokens.set(token, user.userId)
      return res.json({ ok: true, token, userId: user.userId, username })
    }

    // POST /api/sync
    if (path === 'sync' && req.method === 'POST') {
      const token = (req.headers['authorization'] || '').replace('Bearer ', '')
      const userId = activeTokens.get(token)
      if (!userId) return res.status(401).json({ error: '未登录' })
      dataStore[userId] = { cards: body.cards || [], links: body.links || [] }
      return res.json({ ok: true, message: '同步成功' })
    }

    // GET /api/data
    if (path === 'data' && req.method === 'GET') {
      const token = (req.headers['authorization'] || '').replace('Bearer ', '')
      const userId = activeTokens.get(token)
      if (!userId) return res.status(401).json({ error: '未登录' })
      return res.json(dataStore[userId] || { cards: [], links: [] })
    }

    return res.status(404).json({ error: 'Not Found' })
  } catch(err) {
    console.error('API Error:', err)
    return res.status(500).json({ error: '服务器内部错误' })
  }
}
