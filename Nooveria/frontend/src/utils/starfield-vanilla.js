// Vanilla JavaScript Starfield - No Framework Required
class Starfield {
  constructor(options = {}) {
    this.canvas = options.canvas || this.createCanvas()
    this.ctx = this.canvas.getContext('2d')
    
    // Configuration
    this.starCount = options.starCount || 150
    this.speed = options.speed || 0.5
    this.starColor = options.starColor || '#8b5cf6'
    this.glowSize = options.glowSize || 3
    this.direction = options.direction || 'down' // 'down', 'up', 'left', 'right'
    
    this.stars = []
    this.animationId = null
    
    this.init()
  }

  createCanvas() {
    const canvas = document.createElement('canvas')
    canvas.style.position = 'fixed'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.zIndex = '-1'
    canvas.style.background = '#000000'
    document.body.appendChild(canvas)
    return canvas
  }

  init() {
    this.resize()
    this.createStars()
    this.animate()
    
    window.addEventListener('resize', () => this.resize())
  }

  resize() {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  createStars() {
    this.stars = Array.from({ length: this.starCount }, () => ({
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.8 + 0.2
    }))
  }

  drawStar(star) {
    const gradient = this.ctx.createRadialGradient(
      star.x, star.y, 0,
      star.x, star.y, this.glowSize
    )
    
    const alpha = Math.floor(star.opacity * 255).toString(16).padStart(2, '0')
    gradient.addColorStop(0, `${this.starColor}${alpha}`)
    gradient.addColorStop(1, 'transparent')
    
    this.ctx.fillStyle = gradient
    this.ctx.beginPath()
    this.ctx.arc(star.x, star.y, this.glowSize, 0, Math.PI * 2)
    this.ctx.fill()
  }

  updateStars() {
    this.stars.forEach(star => {
      switch (this.direction) {
        case 'down':
          star.y += this.speed
          if (star.y > this.canvas.height + this.glowSize) {
            star.y = -this.glowSize
            star.x = Math.random() * this.canvas.width
          }
          break
        case 'up':
          star.y -= this.speed
          if (star.y < -this.glowSize) {
            star.y = this.canvas.height + this.glowSize
            star.x = Math.random() * this.canvas.width
          }
          break
        case 'left':
          star.x -= this.speed
          if (star.x < -this.glowSize) {
            star.x = this.canvas.width + this.glowSize
            star.y = Math.random() * this.canvas.height
          }
          break
        case 'right':
          star.x += this.speed
          if (star.x > this.canvas.width + this.glowSize) {
            star.x = -this.glowSize
            star.y = Math.random() * this.canvas.height
          }
          break
      }
    })
  }

  animate() {
    this.ctx.fillStyle = '#000000'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    this.updateStars()
    this.stars.forEach(star => this.drawStar(star))
    
    this.animationId = requestAnimationFrame(() => this.animate())
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas)
    }
  }

  updateConfig(options) {
    Object.assign(this, options)
    if (options.starCount && options.starCount !== this.starCount) {
      this.createStars()
    }
  }
}

export default Starfield