// 织念 - 灵感分区
const { getCategoryCards, getLinks, getTimeAgo } = require('../../utils/storage')

Page({
  data: { cards: [] },

  onShow() { this.loadCards() },

  loadCards() {
    const rawCards = getCategoryCards('spark')
    const allLinks = getLinks()
    const cards = rawCards.map(card => ({
      ...card,
      timeAgo: getTimeAgo(card.createdAt),
      linkCount: allLinks.filter(l => l.sourceId === card.id || l.targetId === card.id).length
    }))
    this.setData({ cards })
  },

  goToDetail(e) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}` })
  },

  goToNew() {
    wx.navigateTo({ url: '/pages/new-card/new-card?category=spark' })
  }
})
