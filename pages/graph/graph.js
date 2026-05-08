// 织念 - 关联图谱页（Canvas 力导向图）
const { getCards, getLinks, getTimeAgo } = require('../../utils/storage')

const CATEGORY_CONFIG = {
  spark: { name: '灵光一现', color: '#f6b93b', lightColor: 'rgba(246, 185, 59, 0.3)' },
  knowledge: { name: '知识入脑', color: '#4a90d9', lightColor: 'rgba(74, 144, 217, 0.3)' },
  emotion: { name: '情绪流淌', color: '#e056fd', lightColor: 'rgba(224, 86, 253, 0.3)' },
  experience: { name: '新鲜体验', color: '#7bed9f', lightColor: 'rgba(123, 237, 159, 0.3)' }
}

Page({
  data: {
    categories: [
      { key: 'spark', name: '灵光一现', icon: '⚡', color: '#f6b93b' },
      { key: 'knowledge', name: '知识入脑', icon: '📚', color: '#4a90d9' },
      { key: 'emotion', name: '情绪流淌', icon: '🌊', color: '#e056fd' },
      { key: 'experience', name: '新鲜体验', icon: '✨', color: '#7bed9f' }
    ],
    currentFilter: 'all',
    nodeCount: 0,
    edgeCount: 0,
    showNodeDetail: false,
    selectedNode: null
  },

  // Canvas 相关
  canvas: null,
  ctx: null,
  dpr: 1,
  width: 0,
  height: 0,
  nodes: [],
  edges: [],
  draggingNode: null,
  dragOffsetX: 0,
  dragOffsetY: 0,

  onShow() {
    this.loadData()
  },

  onReady() {
    this.initCanvas()
  },

  loadData() {
    const allCards = getCards()
    const allLinks = getLinks()

    this.setData({
      nodeCount: allCards.length,
      edgeCount: allLinks.length
    })

    if (allCards.length > 0) {
      this.buildGraph(allCards, allLinks)
    }
  },

  buildGraph(cards, links) {
    const filter = this.data.currentFilter
    const filteredCards = filter === 'all' ? cards : cards.filter(c => c.category === filter)

    // 过滤出当前筛选范围内的连线
    const filteredIds = new Set(filteredCards.map(c => c.id))
    const filteredLinks = links.filter(l => filteredIds.has(l.sourceId) && filteredIds.has(l.targetId))

    // 构建节点数据
    this.nodes = filteredCards.map((card, i) => {
      const config = CATEGORY_CONFIG[card.category] || CATEGORY_CONFIG.spark
      return {
        id: card.id,
        content: card.content,
        category: card.category,
        categoryName: config.name,
        color: config.color,
        lightColor: config.lightColor,
        timeAgo: getTimeAgo(card.createdAt),
        linkCount: links.filter(l => l.sourceId === card.id || l.targetId === card.id).length,
        // 初始位置：环形布局
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: Math.max(18, Math.min(36, 16 + card.content.length / 10))
      }
    })

    // 构建边数据
    this.edges = filteredLinks.map(link => ({
      sourceId: link.sourceId,
      targetId: link.targetId
    }))

    // 环形布局初始化
    const centerX = this.width ? this.width / 2 : 200
    const centerY = this.height ? this.height / 2 : 300
    const radius = Math.min(centerX, centerY) * 0.65

    this.nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / this.nodes.length - Math.PI / 2
      node.x = centerX + radius * Math.cos(angle)
      node.y = centerY + radius * Math.sin(angle)
    })

    // 力导向模拟
    this.simulateForce()
    this.drawGraph()
  },

  initCanvas() {
    const query = wx.createSelectorQuery().in(this)
    query.select('#graphCanvas')
      .fields({ node: true, size: true })
      .exec(res => {
        if (!res[0]) return
        const { width, height } = res[0]
        this.width = width
        this.height = height

        wx.createSelectorQuery().in(this)
          .select('#graphCanvas')
          .fields({ node: true })
          .exec(canvasRes => {
            if (!canvasRes[0]) return
            wx.createCanvasContext({
              canvas: canvasRes[0],
              type: '2d'
            }).then(canvas => {
              this.canvas = canvas
              this.ctx = canvas.getContext('2d')
              this.dpr = wx.getSystemInfoSync().pixelRatio
              canvas.width = width * this.dpr
              canvas.height = height * this.dpr
              this.ctx.scale(this.dpr, this.dpr)
              this.loadData()
            })
          })
      })
  },

  // 力导向算法（简化版）
  simulateForce() {
    const iterations = 50
    const centerX = this.width / 2
    const centerY = this.height / 2

    for (let iter = 0; iter < iterations; iter++) {
      // 斥力（节点间互斥）
      for (let i = 0; i < this.nodes.length; i++) {
        for (let j = i + 1; j < this.nodes.length; j++) {
          const dx = this.nodes[j].x - this.nodes[i].x
          const dy = this.nodes[j].y - this.nodes[i].y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = 3000 / (dist * dist)
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force
          this.nodes[i].vx -= fx
          this.nodes[i].vy -= fy
          this.nodes[j].vx += fx
          this.nodes[j].vy += fy
        }
      }

      // 引力（有连线的节点互相吸引）
      this.edges.forEach(edge => {
        const source = this.nodes.find(n => n.id === edge.sourceId)
        const target = this.nodes.find(n => n.id === edge.targetId)
        if (!source || !target) return
        const dx = target.x - source.x
        const dy = target.y - source.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = (dist - 120) * 0.03
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        source.vx += fx
        source.vy += fy
        target.vx -= fx
        target.vy -= fy
      })

      // 向心力
      this.nodes.forEach(node => {
        const dx = centerX - node.x
        const dy = centerY - node.y
        node.vx += dx * 0.005
        node.vy += dy * 0.005

        // 阻尼
        node.vx *= 0.85
        node.vy *= 0.85

        // 更新位置
        node.x += node.vx
        node.y += node.vy

        // 边界约束
        const margin = 40
        node.x = Math.max(margin, Math.min(this.width - margin, node.x))
        node.y = Math.max(margin, Math.min(this.height - margin, node.y))
      })
    }
  },

  drawGraph() {
    if (!this.ctx) return
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.width, this.height)

    // 绘制连线
    ctx.strokeStyle = 'rgba(139, 139, 163, 0.2)'
    ctx.lineWidth = 1.5
    this.edges.forEach(edge => {
      const source = this.nodes.find(n => n.id === edge.sourceId)
      const target = this.nodes.find(n => n.id === edge.targetId)
      if (!source || !target) return
      ctx.beginPath()
      ctx.moveTo(source.x, source.y)
      ctx.lineTo(target.x, target.y)
      ctx.stroke()
    })

    // 绘制节点
    this.nodes.forEach(node => {
      // 光晕
      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 2)
      gradient.addColorStop(0, node.lightColor)
      gradient.addColorStop(1, 'transparent')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.radius * 2, 0, Math.PI * 2)
      ctx.fill()

      // 节点圆
      ctx.fillStyle = node.color
      ctx.globalAlpha = 0.9
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1

      // 节点内文字（首字或图标）
      ctx.fillStyle = '#ffffff'
      ctx.font = `${Math.max(12, node.radius * 0.7)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const label = node.content.charAt(0) || '·'
      ctx.fillText(label, node.x, node.y)
    })
  },

  changeFilter(e) {
    this.setData({ currentFilter: e.currentTarget.dataset.filter })
    this.loadData()
  },

  // 触摸交互
  onTouchStart(e) {
    const touch = e.touches[0]
    const x = touch.x
    const y = touch.y

    // 检测点击了哪个节点
    for (const node of this.nodes) {
      const dx = x - node.x
      const dy = y - node.y
      if (dx * dx + dy * dy < (node.radius + 15) ** 2) {
        this.draggingNode = node
        this.dragOffsetX = dx
        this.dragOffsetY = dy
        return
      }
    }

    // 点击空白处关闭弹窗
    if (this.data.showNodeDetail) {
      this.setData({ showNodeDetail: false, selectedNode: null })
    }
  },

  onTouchMove(e) {
    if (!this.draggingNode) return
    const touch = e.touches[0]
    this.draggingNode.x = touch.x - this.dragOffsetX
    this.draggingNode.y = touch.y - this.dragOffsetY

    // 边界约束
    const margin = 40
    this.draggingNode.x = Math.max(margin, Math.min(this.width - margin, this.draggingNode.x))
    this.draggingNode.y = Math.max(margin, Math.min(this.height - margin, this.draggingNode.y))

    this.drawGraph()
  },

  onTouchEnd(e) {
    if (this.draggingNode) {
      // 如果几乎没有移动，视为点击 → 显示详情
      const moved = Math.abs(this.draggingNode.vx) > 0.5 || Math.abs(this.draggingNode.vy) > 0.5
      if (!moved) {
        this.setData({
          showNodeDetail: true,
          selectedNode: this.draggingNode
        })
      }
      this.draggingNode = null
    }
  },

  closePopup() {
    this.setData({ showNodeDetail: false, selectedNode: null })
  },

  goToDetailFromGraph(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ showNodeDetail: false, selectedNode: null })
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  }
})
