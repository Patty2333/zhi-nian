// 织念 - 首页逻辑
const { getCards, getLinks, getCategoryCards, getTimeAgo } = require('../../utils/storage')

Page({
  data: {
    greetingText: '',
    totalCards: 0,
    totalLinks: 0,
    todayCount: 0,
    categoryCounts: {
      spark: 0,
      knowledge: 0,
      emotion: 0,
      experience: 0
    },
    recentCards: []
  },

  onLoad() {
    this.setGreeting()
    this.loadStats()
  },

  onShow() {
    this.loadStats()
  },

  onPullDownRefresh() {
    this.loadStats()
    wx.stopPullDownRefresh()
  },

  setGreeting() {
    const hour = new Date().getHours()
    let text = '夜深了'
    if (hour >= 5 && hour < 9) text = '早安'
    else if (hour >= 9 && hour < 12) text = '上午好'
    else if (hour >= 12 && hour < 14) text = '中午好'
    else if (hour >= 14 && hour < 18) text = '下午好'
    else if (hour >= 18 && hour < 22) text = '晚上好'
    this.setData({ greetingText: text })
  },

  loadStats() {
    const allCards = getCards()
    const allLinks = getLinks()

    // 总数统计
    const totalCards = allCards.length
    const totalLinks = allLinks.length

    // 今日新增
    const today = new Date().toISOString().slice(0, 10)
    const todayCount = allCards.filter(c => c.createdAt && c.createdAt.startsWith(today)).length

    // 各分区计数
    const categoryCounts = {
      spark: getCategoryCards('spark').length,
      knowledge: getCategoryCards('knowledge').length,
      emotion: getCategoryCards('emotion').length,
      experience: getCategoryCards('experience').length
    }

    // 最近5条记录（按时间倒序）
    const sortedCards = [...allCards].sort((a, b) =>
      new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt)
    )
    const recentCards = sortedCards.slice(0, 5).map(card => ({
      ...card,
      timeAgo: getTimeAgo(card.createdAt || card.updatedAt),
      categoryName: this.getCategoryName(card.category),
      linkCount: allLinks.filter(l => l.sourceId === card.id || l.targetId === card.id).length,
      content: card.content.length > 80 ? card.content.slice(0, 80) + '...' : card.content
    }))

    this.setData({
      totalCards,
      totalLinks,
      todayCount,
      categoryCounts,
      recentCards
    })
  },

  getCategoryName(key) {
    const map = {
      spark: '灵光一现',
      knowledge: '知识入脑',
      emotion: '情绪流淌',
      experience: '新鲜体验'
    }
    return map[key] || ''
  },

  goToCategory(e) {
    const category = e.currentTarget.dataset.category
    const urlMap = {
      spark: '/pages/spark/spark',
      knowledge: '/pages/knowledge/knowledge',
      emotion: '/pages/emotion/emotion',
      experience: '/pages/experience/experience'
    }
    wx.navigateTo({ url: urlMap[category] })
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  goToGraph() {
    wx.switchTab({ url: '/pages/graph/graph' })
  }
})
