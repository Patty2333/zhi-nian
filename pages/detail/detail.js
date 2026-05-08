// 织念 - 详情页逻辑（核心：关联管理）
const {
  getCard, getCards, getLinks, addLink, deleteLink,
  getLinkedCards, getRecommendations, updateCard, deleteCard, getTimeAgo
} = require('../../utils/storage')

const CATEGORY_MAP = {
  spark: { name: '灵光一现', color: '#f6b93b' },
  knowledge: { name: '知识入脑', color: '#4a90d9' },
  emotion: { name: '情绪流淌', color: '#e056fd' },
  experience: { name: '新鲜体验', color: '#7bed9f' }
}

Page({
  data: {
    card: null,
    categoryName: '',
    createdAtFormatted: '',
    updatedAtFormatted: '',
    linkedCards: [],
    recommendations: [],
    isEditing: false,
    editContent: '',
    showPicker: false,
    pickableCards: [],
    searchText: ''
  },

  onLoad(options) {
    if (options.id) {
      this.loadDetail(options.id)
    }
  },

  onShow() {
    if (this.data.card) {
      this.loadDetail(this.data.card.id)
    }
  },

  loadDetail(id) {
    const card = getCard(id)
    if (!card) {
      wx.showToast({ title: '记录不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1000)
      return
    }

    const catInfo = CATEGORY_MAP[card.category] || { name: '', color: '' }
    const linkedCards = getLinkedCards(id).map(c => ({
      ...c,
      categoryName: CATEGORY_MAP[c.category]?.name || '',
      categoryColor: CATEGORY_MAP[c.category]?.color || '',
      timeAgo: getTimeAgo(c.createdAt),
      content: c.content.length > 60 ? c.content.slice(0, 60) + '...' : c.content
    }))

    // 找到关联ID用于取消关联
    const allLinks = getLinks()
    linkedCards.forEach(lc => {
      const link = allLinks.find(l =>
        (l.sourceId === id && l.targetId === lc.id) ||
        (l.targetId === id && l.sourceId === lc.id)
      )
      lc.linkId = link ? link.id : ''
    })

    // 获取推荐
    let recommendations = getRecommendations(id)
    // 过滤掉已关联的
    const linkedIds = new Set(linkedCards.map(lc => lc.id))
    recommendations = recommendations.filter(r => !linkedIds.has(r.targetId)).map(r => ({
      ...r,
      targetCatName: CATEGORY_MAP[r.targetCategory]?.name || '',
      targetContent: r.targetContent.length > 50 ? r.targetContent + '...' : r.targetContent
    }))

    this.setData({
      card,
      categoryName: catInfo.name,
      createdAtFormatted: this.formatDate(card.createdAt),
      updatedAtFormatted: this.formatDate(card.updatedAt),
      linkedCards,
      recommendations,
      editContent: card.content
    })
  },

  formatDate(isoStr) {
    if (!isoStr) return ''
    const d = new Date(isoStr)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  },

  // --- 编辑 ---
  startEdit() { this.setData({ isEditing: true }) },
  cancelEdit() { this.setData({ isEditing: false, editContent: this.data.card.content }) },

  onEditInput(e) { this.setData({ editContent: e.detail.value }) },

  saveEdit() {
    const content = this.data.editContent.trim()
    if (!content) {
      wx.showToast({ title: '内容不能为空', icon: 'none' })
      return
    }
    updateCard(this.data.card.id, { content })
    wx.showToast({ title: '已更新 ✨', icon: 'success' })
    this.setData({ isEditing: false })
    this.loadDetail(this.data.card.id)
  },

  // --- 删除 ---
  confirmDelete() {
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，相关的关联也会被移除',
      confirmColor: '#ff4757',
      success: (res) => {
        if (res.confirm) {
          deleteCard(this.data.card.id)
          wx.showToast({ title: '已删除', icon: 'success' })
          setTimeout(() => wx.navigateBack(), 800)
        }
      }
    })
  },

  // --- 关联操作 ---
  showLinkPicker() {
    const allCards = getCards().filter(c => c.id !== this.data.card.id)
    // 排除已关联的
    const linkedIds = new Set(this.data.linkedCards.map(lc => lc.id))
    const pickable = allCards.filter(c => !linkedIds.has(c.id)).map(c => ({
      ...c,
      catName: CATEGORY_MAP[c.category]?.name || '',
      timeAgo: getTimeAgo(c.createdAt),
      content: c.content.length > 50 ? c.content.slice(0, 50) + '...' : c.content
    }))
    this.setData({ showPicker: true, pickableCards: pickable, searchText: '' })
  },

  hideLinkPicker() { this.setData({ showPicker: false }) },

  onSearchInput(e) {
    const text = e.detail.value.toLowerCase()
    this.setData({ searchText: text })
    if (!text) {
      this.showLinkPicker() // reset
      return
    }
    const filtered = this.data.pickableCards.filter(c =>
      c.content.toLowerCase().includes(text) ||
      c.keywords.some(k => k.toLowerCase().includes(text)) ||
      c.tags.some(t => t.toLowerCase().includes(text))
    )
    this.setData({ pickableCards: filtered })
  },

  createLink(e) {
    const targetId = e.currentTarget.dataset.id
    addLink(this.data.card.id, targetId)
    wx.showToast({ title: '关联成功 🔗', icon: 'success' })
    this.setData({ showPicker: false })
    this.loadDetail(this.data.card.id)
  },

  unlinkCard(e) {
    const linkId = e.currentTarget.dataset.linkid
    wx.showModal({
      title: '取消关联',
      content: '确定要取消这条关联吗？',
      success: (res) => {
        if (res.confirm) {
          deleteLink(linkId)
          wx.showToast({ title: '已取消关联', icon: 'none' })
          this.loadDetail(this.data.card.id)
        }
      }
    })
  },

  connectRecommend(e) {
    const targetId = e.currentTarget.dataset.id
    addLink(this.data.card.id, targetId)
    wx.showToast({ title: '关联成功 🔗', icon: 'success' })
    this.loadDetail(this.data.card.id)
  },

  goToLinkedCard(e) {
    const id = e.currentTarget.dataset.id
    wx.redirectTo({ url: `/pages/detail/detail?id=${id}` })
  }
})
