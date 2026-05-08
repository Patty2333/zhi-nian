App({
  onLaunch() {
    // 初始化本地存储
    this.initStorage()
  },

  initStorage() {
    const cards = wx.getStorageSync('zhinian_cards')
    if (!cards) {
      wx.setStorageSync('zhinian_cards', [])
    }
    const links = wx.getStorageSync('zhinian_links')
    if (!links) {
      wx.setStorageSync('zhinian_links', [])
    }
  },

  globalData: {
    categories: [
      { key: 'spark', name: '灵光一现', icon: '⚡', color: '#f6b93b', bgColor: '#2d2d44', desc: '突发奇想、碎片化灵感' },
      { key: 'knowledge', name: '知识入脑', icon: '📚', color: '#4a90d9', bgColor: '#1e2a3a', desc: '学到的内容、读书笔记' },
      { key: 'emotion', name: '情绪流淌', icon: '🌊', color: '#e056fd', bgColor: '#2a1e3a', desc: '心情记录、情绪日记' },
      { key: 'experience', name: '新鲜体验', icon: '✨', color: '#7bed9f', bgColor: '#1e3a2a', desc: '新尝试的活动、新认识的人' }
    ]
  }
})
