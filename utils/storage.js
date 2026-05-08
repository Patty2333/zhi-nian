/**
 * 织念 - 本地数据存储管理
 * 提供卡片 CRUD、关联管理、关键词提取、自动关联推荐
 */

const CARDS_KEY = 'zhinian_cards'
const LINKS_KEY = 'zhinian_links'

// ==================== 卡片操作 ====================

/**
 * 获取所有卡片
 */
function getCards() {
  try {
    return wx.getStorageSync(CARDS_KEY) || []
  } catch (e) {
    return []
  }
}

/**
 * 获取单个卡片
 */
function getCard(id) {
  const cards = getCards()
  return cards.find(c => c.id === id) || null
}

/**
 * 新增卡片
 */
function addCard(card) {
  const cards = getCards()
  const newCard = {
    id: generateId(),
    content: card.content || '',
    category: card.category || 'spark',
    tags: card.tags || [],
    keywords: extractKeywords(card.content),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  cards.unshift(newCard)
  wx.setStorageSync(CARDS_KEY, cards)

  // 自动关联推荐
  autoLinkRecommend(newCard)

  return newCard
}

/**
 * 更新卡片
 */
function updateCard(id, updates) {
  const cards = getCards()
  const index = cards.findIndex(c => c.id === id)
  if (index !== -1) {
    cards[index] = {
      ...cards[index],
      ...updates,
      keywords: updates.content ? extractKeywords(updates.content) : cards[index].keywords,
      updatedAt: new Date().toISOString()
    }
    wx.setStorageSync(CARDS_KEY, cards)
    return cards[index]
  }
  return null
}

/**
 * 删除卡片（同时删除相关联的关联）
 */
function deleteCard(id) {
  let cards = getCards()
  cards = cards.filter(c => c.id !== id)
  wx.setStorageSync(CARDS_KEY, cards)

  // 删除与此卡片相关的关联
  let links = getLinks()
  links = links.filter(l => l.sourceId !== id && l.targetId !== id)
  wx.setStorageSync(LINKS_KEY, links)
}

/**
 * 获取某分区的卡片列表
 */
function getCategoryCards(category) {
  return getCards().filter(c => c.category === category)
}

// ==================== 关联操作 ====================

/**
 * 获取所有关联
 */
function getLinks() {
  try {
    return wx.getStorageSync(LINKS_KEY) || []
  } catch (e) {
    return []
  }
}

/**
 * 新增关联
 */
function addLink(sourceId, targetId, relationType = 'related') {
  if (sourceId === targetId) return null

  const links = getLinks()

  // 检查是否已存在
  const exists = links.find(
    l => (l.sourceId === sourceId && l.targetId === targetId) ||
         (l.sourceId === targetId && l.targetId === sourceId)
  )
  if (exists) return null

  const newLink = {
    id: generateId(),
    sourceId,
    targetId,
    relationType,
    createdAt: new Date().toISOString()
  }
  links.push(newLink)
  wx.setStorageSync(LINKS_KEY, links)
  return newLink
}

/**
 * 删除关联
 */
function deleteLink(id) {
  const links = getLinks()
  const filtered = links.filter(l => l.id !== id)
  wx.setStorageSync(LINKS_KEY, filtered)
}

/**
 * 获取与某卡片关联的所有卡片ID
 */
function getLinkedCardIds(cardId) {
  const links = getLinks()
  const linkedIds = new Set()
  links.forEach(l => {
    if (l.sourceId === cardId) linkedIds.add(l.targetId)
    if (l.targetId === cardId) linkedIds.add(l.sourceId)
  })
  return Array.from(linkedIds)
}

/**
 * 获取与某卡片关联的所有卡片详情
 */
function getLinkedCards(cardId) {
  const linkedIds = getLinkedCardIds(cardId)
  const allCards = getCards()
  return allCards.filter(c => linkedIds.includes(c.id))
}

// ==================== 关键词提取 ====================

/**
 * 从文本中提取关键词（简单实现：中文分词 + 停用词过滤）
 */
function extractKeywords(text) {
  if (!text) return []

  // 常见停用词
  const stopWords = new Set([
    '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
    '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
    '自己', '这', '他', '她', '它', '们', '什么', '这个', '那个', '哪个', '怎么',
    '如何', '为什么', '因为', '所以', '但是', '然后', '可以', '能', '可能',
    '觉得', '感觉', '想', '知道', '让', '把', '被', '对', '从', '跟', '与',
    '或', '及', '等', '等等', '之', '于', '而', '以', '其', '所', '者',
    '啊', '吧', '呢', '吗', '哦', '哈', '嗯', '呀', '嘛', '哇'
  ])

  // 提取2-4字的词组作为候选关键词
  const words = []
  // 按标点和空格分割
  const segments = text.split(/[\s，。！？、；：""''（）【】\n\r]+/).filter(s => s.trim())

  segments.forEach(seg => {
    // 提取连续的中文字符
    const chineseMatches = seg.match(/[\u4e00-\u9fa5]{2,}/g)
    if (chineseMatches) {
      chineseMatches.forEach(match => {
        // 提取2-4字子串
        for (let len = Math.min(4, match.length); len >= 2; len--) {
          for (let i = 0; i <= match.length - len; i++) {
            const word = match.slice(i, i + len)
            if (!stopWords.has(word) && word.length >= 2) {
              words.push(word)
            }
          }
        }
      })
    }

    // 提取英文单词
    const englishMatches = seg.match(/[a-zA-Z]{3,}/g)
    if (englishMatches) {
      englishMatches.forEach(w => words.push(w.toLowerCase()))
    }
  })

  // 词频统计 + 过滤低频词
  const freq = {}
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1 })

  // 按频率排序，取前8个
  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word)

  return sorted
}

// ==================== 自动关联推荐 ====================

/**
 * 为新卡片自动推荐关联
 */
function autoLinkRecommend(newCard) {
  const allCards = getCards().filter(c => c.id !== newCard.id)
  if (allCards.length === 0) return

  const recommendations = []

  allCards.forEach(existingCard => {
    let score = 0

    // 关键词重叠评分
    const commonKeywords = newCard.keywords.filter(k =>
      existingCard.keywords.includes(k)
    )
    score += commonKeywords.length * 10

    // 同分区加分
    if (newCard.category === existingCard.category) {
      score += 3
    }

    // 内容相似度（简单的字符重叠）
    const newWords = new Set(newCard.keywords)
    const existingWords = new Set(existingCard.keywords)
    const intersection = [...newWords].filter(w => existingWords.has(w))
    const union = [...new Set([...newCard.keywords, ...existingCard.keywords])]
    const jaccard = union.length > 0 ? intersection.length / union.length : 0
    score += jaccard * 5

    if (score >= 5) {
      recommendations.push({
        targetId: existingCard.id,
        score,
        commonKeywords,
        targetContent: existingCard.content.slice(0, 50),
        targetCategory: existingCard.category
      })
    }
  })

  // 存储推荐结果（用于在详情页展示）
  if (recommendations.length > 0) {
    const recKey = `zhinian_recommend_${newCard.id}`
    try {
      wx.setStorageSync(recKey, recommendations.sort((a, b) => b.score - a.score))
    } catch (e) {
      // ignore
    }
  }
}

/**
 * 获取某卡片的自动关联推荐
 */
function getRecommendations(cardId) {
  try {
    return wx.getStorageSync(`zhinian_recommend_${cardId}`) || []
  } catch (e) {
    return []
  }
}

// ==================== 工具函数 ====================

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/**
 * 相对时间格式化
 */
function getTimeAgo(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const date = new Date(dateStr)
  const diff = now - date

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  return dateStr.slice(5, 10)
}

module.exports = {
  getCards,
  getCard,
  addCard,
  updateCard,
  deleteCard,
  getCategoryCards,
  getLinks,
  addLink,
  deleteLink,
  getLinkedCardIds,
  getLinkedCards,
  extractKeywords,
  autoLinkRecommend,
  getRecommendations,
  getTimeAgo
}
