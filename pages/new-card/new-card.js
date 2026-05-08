// 织念 - 新建记录页逻辑
const { addCard, extractKeywords, getRecommendations, addLink, getCategoryCards } = require('../../utils/storage')

Page({
  data: {
    categories: [
      { key: 'spark', name: '灵光一现', icon: '⚡', color: '#f6b93b', bgColor: '#2d2d44' },
      { key: 'knowledge', name: '知识入脑', icon: '📚', color: '#4a90d9', bgColor: '#1e2a3a' },
      { key: 'emotion', name: '情绪流淌', icon: '🌊', color: '#e056fd', bgColor: '#2a1e3a' },
      { key: 'experience', name: '新鲜体验', icon: '✨', color: '#7bed9f', bgColor: '#1e3a2a' }
    ],
    selectedCategory: '',
    content: '',
    contentLength: 0,
    previewKeywords: [],
    selectedTags: [],
    quickTags: [],
    autoFocus: true,
    showLinkHint: false,
    linkedRecommendations: [],
    newCardId: null,
    placeholderText: '记录下此刻的想法...',
    currentCategoryName: ''
  },

  onLoad(options) {
    // 如果从分区页进入，预设分类
    if (options.category) {
      this.setData({
        selectedCategory: options.category,
        currentCategoryName: this.getCategoryName(options.category),
        placeholderText: this.getPlaceholder(options.category),
        quickTags: this.getQuickTags(options.category)
      })
    } else {
      this.setData({
        selectedCategory: 'spark',
        currentCategoryName: '灵光一现',
        placeholderText: '✨ 突然冒出的灵感，快记下来...',
        quickTags: ['创意', '想法', '待探索', '疑问']
      })
    }
  },

  getCategoryName(key) {
    const map = { spark: '灵光一现', knowledge: '知识入脑', emotion: '情绪流淌', experience: '新鲜体验' }
    return map[key] || ''
  },

  getPlaceholder(category) {
    const map = {
      spark: '✨ 突然冒出的灵感，快记下来...',
      knowledge: '📝 今天学到了什么新知识？',
      emotion: '💭 此刻的心情如何？',
      experience: '🌟 尝试了什么新鲜事？'
    }
    return map[category] || ''
  },

  getQuickTags(category) {
    const map = {
      spark: ['创意', '想法', '待探索', '疑问', '顿悟'],
      knowledge: ['读书', '课程', '文章', '视频', '播客'],
      emotion: ['开心', '焦虑', '平静', '感动', '疲惫'],
      experience: ['第一次', '新朋友', '新地方', '新技能', '新食物']
    }
    return map[category] || []
  },

  selectCategory(e) {
    const key = e.currentTarget.dataset.key
    const cat = this.data.categories.find(c => c.key === key)
    this.setData({
      selectedCategory: key,
      currentCategoryName: cat.name,
      placeholderText: this.getPlaceholder(key),
      quickTags: this.getQuickTags(key),
      selectedTags: []
    })
  },

  onInput(e) {
    const content = e.detail.value
    this.setData({
      content,
      contentLength: content.length,
      previewKeywords: content.trim() ? extractKeywords(content) : []
    })
  },

  onFocus() {},
  onBlur() {},

  toggleTag(e) {
    const tag = e.currentTarget.dataset.tag
    let tags = [...this.data.selectedTags]
    const idx = tags.indexOf(tag)
    if (idx !== -1) {
      tags.splice(idx, 1)
    } else {
      tags.push(tag)
    }
    this.setData({ selectedTags: tags })
  },

  removeTag(e) {
    const tag = e.currentTarget.dataset.tag
    this.setData({
      selectedTags: this.data.selectedTags.filter(t => t !== tag)
    })
  },

  saveCard() {
    const { content, selectedCategory, selectedTags } = this.data
    if (!content.trim()) return

    const newCard = addCard({
      content: content.trim(),
      category: selectedCategory,
      tags: selectedTags
    })

    // 获取关联推荐
    const recs = getRecommendations(newCard.id)

    wx.showToast({ title: '已保存 ✨', icon: 'success' })

    if (recs && recs.length > 0) {
      this.setData({
        showLinkHint: true,
        linkedRecommendations: recs.slice(0, 5),
        newCardId: newCard.id,
        content: '',
        contentLength: 0,
        previewKeywords: [],
        selectedTags: []
      })
    } else {
      setTimeout(() => wx.navigateBack(), 800)
    }
  },

  createQuickLink(e) {
    const targetId = e.currentTarget.dataset.id
    if (this.data.newCardId) {
      addLink(this.data.newCardId, targetId)
      wx.showToast({ title: '关联成功 🔗', icon: 'success' })
      // 从推荐列表中移除
      this.setData({
        linkedRecommendations: this.data.linkedRecommendations.filter(r => r.targetId !== targetId)
      })
    }
  },

  skipLinks() {
    this.setData({ showLinkHint: false, linkedRecommendations: [] })
    setTimeout(() => wx.navigateBack(), 300)
  },

  goBack() {
    wx.navigateBack()
  }
})
