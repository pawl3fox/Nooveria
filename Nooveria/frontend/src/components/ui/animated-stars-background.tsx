import React, { useEffect, useRef } from 'react'

interface AnimatedStarsBackgroundProps {
  starCount?: number
  speed?: number
  starColor?: string
  glowSize?: number
  direction?: 'down' | 'up' | 'left' | 'right'
  className?: string
}

const AnimatedStarsBackground: React.FC<AnimatedStarsBackgroundProps> = ({
  starCount = 150,
  speed = 0.5,
  starColor = '#8b5cf6',
  glowSize = 3,
  direction = 'down',
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const starsRef = useRef<Array<{x: number, y: number, size: number, opacity: number}>>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const initStars = () => {
      starsRef.current = Array.from({ length: starCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.8 + 0.2
      }))
    }

    const drawStar = (star: typeof starsRef.current[0]) => {
      const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowSize)
      gradient.addColorStop(0, `${starColor}${Math.floor(star.opacity * 255).toString(16).padStart(2, '0')}`)
      gradient.addColorStop(1, 'transparent')
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(star.x, star.y, glowSize, 0, Math.PI * 2)
      ctx.fill()
    }

    const updateStars = () => {
      starsRef.current.forEach(star => {
        switch (direction) {
          case 'down':
            star.y += speed
            if (star.y > canvas.height + glowSize) star.y = -glowSize
            break
          case 'up':
            star.y -= speed
            if (star.y < -glowSize) star.y = canvas.height + glowSize
            break
          case 'left':
            star.x -= speed
            if (star.x < -glowSize) star.x = canvas.width + glowSize
            break
          case 'right':
            star.x += speed
            if (star.x > canvas.width + glowSize) star.x = -glowSize
            break
        }
      })
    }

    const animate = () => {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      updateStars()
      starsRef.current.forEach(drawStar)
      
      animationRef.current = requestAnimationFrame(animate)
    }

    resizeCanvas()
    initStars()
    animate()

    const handleResize = () => {
      resizeCanvas()
      initStars()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener('resize', handleResize)
    }
  }, [starCount, speed, starColor, glowSize, direction])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 -z-10 ${className}`}
      style={{ background: '#000000' }}
    />
  )
}

export default AnimatedStarsBackground