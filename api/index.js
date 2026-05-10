/**
 * 织念 ZhiNian - Vercel Serverless API
 * 功能：用户注册/登录、卡片数据云端同步
 * 存储：Vercel KV (Redis) 或 JSON 文件回退
 */

const crypto = require('crypto')

// ====== 工具函数 ======
function hashPwd(pwd, salt) {
  return crypto.pbkdf2Sync(pwd, salt, 10000, 64, 'sha256').toString('hex')
}
function makeSalt() { return crypto.randomBytes(16).toString('hex') }
function makeToken() { return crypto.randomBytes(32).toString('hex') }

// ====== 内存存储（Vercel Serverless 冷启动会重置，需配合外部存储）======
// 使用 Vercel KV 或 fallback 到内存（开发模式）
let usersStore = {}
let dataStore = {}  // userId -> { cards, links }
const activeTokens = new Map()

// 初始化时尝试从环境变量或文件加载种子数据
function initSeedData() {
  // Patty 的旧数据迁移 - 种子数据
  const pattyUserId = 'f09d3fb2-c745-41ff-a34a-2aad885be4c4'
  if (!usersStore['Patty']) {
    usersStore['Patty'] = {
      hash: '47ee0ef13fb33d984c178d705424b5f210e40e06821d07468460a8fa5a681a1e36e29a426247c7c5e9bb68b9eec76e36d4077b03b4e02946786ef1d7ca014abb',
      salt: 'be73f32c3b85f433917d04cc24651bd6',
      createdAt: '2026-05-09T02:27:38.106Z',
      userId: pattyUserId
    }
    // Patty 的 19 条记录 + 2 条关联
    dataStore[pattyUserId] = {"cards":[{"id":"moy458rl792ig1","content":"因为工作的事情好焦虑，到底怎么缓解！！！","category":"emotion","tags":[],"keywords":["工作","焦虑","缓解"],"createdAt":"2026-05-09T08:59:59.265Z","updatedAt":"2026-05-09T08:59:59.265Z"},{"id":"moxrq05irywt67","content":"生命最温柔的时刻，是学会对自己说："你已经很努力了"。（这是蛤蟆先生教会我的终极治愈）","category":"knowledge","tags":[],"keywords":["温柔","努力","终极治愈","蛤蟆先生"],"createdAt":"2026-05-09T03:12:12.870Z","updatedAt":"2026-05-09T03:12:12.870Z"},{"id":"moxro66k6uxss2","content":"你的人生剧本，只能由你自己改写。（原生家庭≠命运，你永远有选择权）","category":"knowledge","tags":[],"keywords":["选择权","原生家庭","人生剧本"],"createdAt":"2026-05-09T03:10:47.372Z","updatedAt":"2026-05-09T03:10:47.372Z"},{"id":"moxrmn2y47cgja","content":"当你停止自我审判，世界才会放过你。（那个批判你的声音，真的值得信任吗？）","category":"knowledge","tags":[],"keywords":["自我审判","批判","信任"],"createdAt":"2026-05-09T03:09:35.962Z","updatedAt":"2026-05-09T03:09:53.273Z"},{"id":"moxreqlgai8vqn","content":"讨好型人格的代价，是弄丢真实的自己。（警惕那些"我必须让人喜欢"的执念）","category":"knowledge","tags":[],"keywords":["代价","讨好型人格","自己","让人喜欢","执念"],"createdAt":"2026-05-09T03:03:27.268Z","updatedAt":"2026-05-09T03:03:27.268Z"},{"id":"moxqqwdcgxanic","content":"真正的成长，是戒掉对他人认可的瘾。（从"儿童自我状态"走向"成人自我状态"）","category":"knowledge","tags":[],"keywords":["成长","他人认可","自我状态"],"createdAt":"2026-05-09T02:44:55.008Z","updatedAt":"2026-05-09T02:44:55.008Z"},{"id":"moxqoqwm6iox64","content":"情绪不是你的敌人，否认情绪才是。（允许自己愤怒/悲伤/脆弱，才是健康的开始）","category":"knowledge","tags":[],"keywords":["情绪","悲伤","脆弱","敌人"],"createdAt":"2026-05-09T02:43:14.614Z","updatedAt":"2026-05-09T02:43:14.614Z"},{"id":"moxqbki0kvciqc","content":"尝试看了AI短剧，挺有意思的，剧情跌宕起伏直戳爽点，虽然抽卡的结果仍有穿帮，但在发展初期也不失为用户创造了捉虫的乐趣。批判性地看，仍需要提高人物建模审美和剧情发展的连贯性，还有很大的进步空间。","category":"experience","tags":[],"keywords":["AI短剧","爽点","捉虫","审美","剧情"],"createdAt":"2026-05-09T02:32:59.784Z","updatedAt":"2026-05-09T02:32:59.784Z"},{"id":"moxq0fuageq96u","content":"早上上班路上路过万象汇，一群阿姨在门前的巨型柯基装置前拍错位合照，很生动，她们拍完后查看效果的笑声很是爽朗大方，空气里震荡着欢乐和幸福。","category":"emotion","tags":[],"keywords":["万象汇","早上","上班","路上","合照","欢乐","幸福"],"createdAt":"2026-05-09T02:24:20.530Z","updatedAt":"2026-05-09T02:24:20.530Z"},{"id":"mownwduo4hr4bp","content":"视觉系（Visual kei），也被称为视觉摇滚。兴起于1980年代末期的日本音乐运动与亚文化。它以华丽夸张的服装、浓烈大胆的妆容，以及中性化或反串的造型风格而闻名，融合了西方的华丽摇滚（Glam Rock）、重金属等元素与日本本土文化。","category":"knowledge","tags":[],"keywords":["摇滚","华丽","融合","视觉系","视觉摇滚","重金属"],"createdAt":"2026-05-08T08:37:25.920Z","updatedAt":"2026-05-08T08:37:25.920Z"},{"id":"mowlgjgtiq5mny","content":"麦当劳的板烧鸡腿堡挺好吃的，热量也低适合作为中饭减肥。","category":"experience","tags":[],"keywords":["热量","麦当劳","板烧鸡腿堡","减肥"],"createdAt":"2026-05-08T07:29:07.469Z","updatedAt":"2026-05-08T08:48:17.367Z"},{"id":"mowlcnleqe57xa","content":"最近因为AI的冲击，组织架构变动，个人的landing存在障碍，看不到短期的职业发展方向，对未来失去掌控感，继而触发焦虑情绪。不知道该怎么调节自己，反复内耗。","category":"emotion","tags":[],"keywords":["landing","AI","组织架构变动","未来掌控感","职业发展方向"],"createdAt":"2026-05-08T07:26:06.194Z","updatedAt":"2026-05-08T08:47:40.438Z"},{"id":"mowar8vpygtcrz","content":"你不是一个烂苹果，你只是好透了。","category":"spark","tags":[],"keywords":["烂苹果"],"createdAt":"2026-05-08T02:29:31.189Z","updatedAt":"2026-05-08T08:42:54.659Z"},{"id":"mowafxt7dr4f99","content":"五一节假日去大连看海了，大海辽阔，可以容纳所有的不开心。大海汹涌，可以冲刷掉一切顽固焦虑。","category":"experience","tags":[],"keywords":["一切顽固焦虑","五一","去大","固焦虑","大海","海了","节假日","连看"],"createdAt":"2026-05-08T02:20:43.627Z","updatedAt":"2026-05-09T02:20:43.627Z"},{"id":"mowa8o8z2egler","content":"5-4-3-2-1 感官 grounding 法：\n当你感到思绪纷飞、坐立不安的时候，试试这个缓解焦虑的小方法——\n👀 说出你看到的 5 样东西\n👂 说出你听到的 4 种声音\n✋ 说出你能触摸到的 3 种质感\n👃 说出你闻到的 2 种气味\n👅 说出你尝到的 1 种味道","category":"knowledge","tags":[],"keywords":["缓解焦虑","grounding","思绪纷飞","坐立不安"],"createdAt":"2026-05-08T02:15:04.644Z","updatedAt":"2026-05-08T08:44:57.382Z"},{"id":"mowa196fjcvr29","content":"焦虑的本质不是对未来的恐惧，而是想象力跑在了行动力的前面。你脑子里预演了一万种糟糕结局，却忘了现实往往比想象温柔得多。就像坐过山车最紧张的是爬坡那段，等到真正俯冲下去，反而只剩风在耳边笑了。","category":"emotion","tags":[],"keywords":["想象","未来","焦虑"],"createdAt":"2026-05-08T02:09:18.519Z","updatedAt":"2026-05-09T08:47:56.393Z"},{"id":"mow9uoozsh57ta","content":"MCP（Model Context Protocol）是Anthropic提出的AI模型上下文协议，旨在让AI助手能够安全、标准化地连接各类外部数据源和工具，成为AI应用的"USB接口"标准。\n 2026年2月，OpenClaw项目采用阿里云SAE托管实践，展示了如何通过MCP协议快速接入多种AI能力，开发者无需重复编写适配代码。","category":"knowledge","tags":[],"keywords":["AI","Anthropic","MCP","OpenClaw","上下文协议","USB接口"],"createdAt":"2026-05-08T02:04:12.035Z","updatedAt":"2026-05-08T08:45:56.473Z"},{"id":"mow9qmcbt11k4f","content":"长寿公式=健康饮食+每天运动42分钟+每天7.2-8小时睡眠\n2026年《柳叶刀》子刊发布重磅研究，总结出简单"长寿公式"：健康饮食+每天运动42分钟+每天7.2-8小时睡眠，三者搭配到黄金状态可延寿近10年。","category":"knowledge","tags":[],"keywords":["8小时睡眠","健康","运动","长寿","饮食","柳叶刀"],"createdAt":"2026-05-08T02:01:02.363Z","updatedAt":"2026-05-08T08:46:26.609Z"},{"id":"mow9maby322tc6","content":"ABCDE法则：A (Activating Event) - 诱发事件：触发情绪的具体情境\nB (Beliefs) - 信念：对事件的认知和评价\nC (Consequences) - 情绪和行为后果：因信念产生的反应\nD (Disputing) - 辩论：质疑并挑战不合理信念\nE (Effects) - 效果：形成新的合理认知与积极行为\n\n一句话案例： 当工作中被领导批评（A），如果认为"领导在针对我"（B），会感到沮丧愤怒（C）；通过辩论（D）发现可能是工作压力传导，从而形成新的合理认知（E），情绪得到改善。","category":"knowledge","tags":[],"keywords":["Activating","Beliefs","Consequences","Disputing","Effects","合理","情绪","认知","ABCDE法则"],"createdAt":"2026-05-08T01:57:40.174Z","updatedAt":"2026-05-08T08:46:52.970Z"}],"links":[{"id":"mowlcvqnw8u0gw","sourceId":"mowlcnleqe57xa","targetId":"mow9uoozsh57ta","createdAt":"2026-05-08T07:26:16.751Z"},{"id":"moxqouu0y3axu7","sourceId":"moxqoqwm6iox64","targetId":"mow9maby322tc6","createdAt":"2026-05-09T02:43:19.704Z"}]}
    console.log('✅ Patty 种子数据已加载')
  }
}

initSeedData()

// ====== Vercel Serverless Handler ======
module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Token')

  if (req.method === 'OPTIONS') { res.status(204).end(); return }

  try {
    const urlPath = new URL(req.url, `https://${req.headers.host}`).pathname

    // POST /api/register
    if (urlPath === '/api/register' && req.method === 'POST') {
      const { username, password } = req.body
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
      return res.status(200).json({ ok: true, token, userId, username })
    }

    // POST /api/login
    if (urlPath === '/api/login' && req.method === 'POST') {
      const { username, password } = req.body
      const user = usersStore[username]
      if (!user || user.hash !== hashPwd(password, user.salt)) {
        return res.status(401).json({ error: '用户名或密码错误' })
      }
      const token = makeToken()
      activeTokens.set(token, user.userId)
      return res.status(200).json({ ok: true, token, userId: user.userId, username })
    }

    // POST /api/sync （需登录）
    if (urlPath === '/api/sync' && req.method === 'POST') {
      const token = (req.headers['authorization'] || req.headers['x-token'] || '').replace('Bearer ', '')
      const userId = activeTokens.get(token)
      if (!userId) return res.status(401).json({ error: '未登录' })
      dataStore[userId] = { cards: req.body.cards || [], links: req.body.links || [] }
      return res.status(200).json({ ok: true, message: '同步成功' })
    }

    // GET /api/data （需登录）
    if (urlPath === '/api/data' && req.method === 'GET') {
      const token = (req.headers['authorization'] || req.headers['x-token'] || '').replace('Bearer ', '')
      const userId = activeTokens.get(token)
      if (!userId) return res.status(401).json({ error: '未登录' })
      return res.status(200).json(dataStore[userId] || { cards: [], links: [] })
    }

    return res.status(404).json({ error: 'Not Found' })

  } catch (err) {
    console.error('API Error:', err)
    return res.status(500).json({ error: '服务器内部错误' })
  }
}
