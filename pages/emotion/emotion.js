const { getCategoryCards, getLinks, getTimeAgo } = require('../../utils/storage')

Page({
  data: { cards: [] },
  onShow() {
    const rawCards = getCategoryCards('emotion')
    const allLinks = getLinks()
    this.setData({ cards: rawCards.map(c => ({ ...c, timeAgo: getTimeAgo(c.createdAt), linkCount: allLinks.filter(l => l.sourceId === c.id || l.targetId === c.id).length })) })
  },
  goToDetail(e) { wx.navigateTo({ url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}` }) },
  goToNew() { wx.navigateTo({ url: '/pages/new-card/new-card?category=emotion' }) }
})
