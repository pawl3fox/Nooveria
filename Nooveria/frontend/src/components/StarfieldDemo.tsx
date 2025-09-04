import React, { useState } from 'react'
import AnimatedStarsBackground from './ui/animated-stars-background'
import CSSStarsBackground from './ui/css-stars-background'
import { EnhancedButton } from './ui/enhanced-button'

const StarfieldDemo: React.FC = () => {
  const [config, setConfig] = useState({
    type: 'canvas' as 'canvas' | 'css',
    starCount: 150,
    speed: 0.5,
    starColor: '#8b5cf6',
    direction: 'down' as 'down' | 'up' | 'left' | 'right'
  })

  const colors = [
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'White', value: '#ffffff' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Green', value: '#10b981' }
  ]

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      {config.type === 'canvas' ? (
        <AnimatedStarsBackground
          starCount={config.starCount}
          speed={config.speed}
          starColor={config.starColor}
          direction={config.direction}
        />
      ) : (
        <CSSStarsBackground
          starCount={config.starCount}
          speed={config.speed * 20}
          starColor={config.starColor}
        />
      )}

      {/* Controls */}
      <div className="relative z-10 p-8">
        <div className="max-w-md mx-auto bg-black/50 backdrop-blur-md rounded-lg p-6 border border-white/20">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            Starfield Controls
          </h1>

          {/* Type Toggle */}
          <div className="mb-4">
            <label className="block text-white text-sm mb-2">Type</label>
            <div className="flex gap-2">
              <EnhancedButton
                variant={config.type === 'canvas' ? 'gradient' : 'outline'}
                size="sm"
                onClick={() => setConfig(prev => ({ ...prev, type: 'canvas' }))}
              >
                Canvas
              </EnhancedButton>
              <EnhancedButton
                variant={config.type === 'css' ? 'gradient' : 'outline'}
                size="sm"
                onClick={() => setConfig(prev => ({ ...prev, type: 'css' }))}
              >
                CSS
              </EnhancedButton>
            </div>
          </div>

          {/* Star Count */}
          <div className="mb-4">
            <label className="block text-white text-sm mb-2">
              Stars: {config.starCount}
            </label>
            <input
              type="range"
              min="50"
              max="300"
              value={config.starCount}
              onChange={(e) => setConfig(prev => ({ ...prev, starCount: Number(e.target.value) }))}
              className="w-full"
            />
          </div>

          {/* Speed */}
          <div className="mb-4">
            <label className="block text-white text-sm mb-2">
              Speed: {config.speed.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={config.speed}
              onChange={(e) => setConfig(prev => ({ ...prev, speed: Number(e.target.value) }))}
              className="w-full"
            />
          </div>

          {/* Direction (Canvas only) */}
          {config.type === 'canvas' && (
            <div className="mb-4">
              <label className="block text-white text-sm mb-2">Direction</label>
              <div className="grid grid-cols-2 gap-2">
                {(['down', 'up', 'left', 'right'] as const).map(dir => (
                  <EnhancedButton
                    key={dir}
                    variant={config.direction === dir ? 'gradient' : 'outline'}
                    size="sm"
                    onClick={() => setConfig(prev => ({ ...prev, direction: dir }))}
                  >
                    {dir.charAt(0).toUpperCase() + dir.slice(1)}
                  </EnhancedButton>
                ))}
              </div>
            </div>
          )}

          {/* Color */}
          <div className="mb-4">
            <label className="block text-white text-sm mb-2">Color</label>
            <div className="grid grid-cols-3 gap-2">
              {colors.map(color => (
                <EnhancedButton
                  key={color.value}
                  variant={config.starColor === color.value ? 'gradient' : 'outline'}
                  size="sm"
                  onClick={() => setConfig(prev => ({ ...prev, starColor: color.value }))}
                  style={{ 
                    borderColor: color.value,
                    color: config.starColor === color.value ? 'white' : color.value
                  }}
                >
                  {color.name}
                </EnhancedButton>
              ))}
            </div>
          </div>

          {/* Code Example */}
          <div className="mt-6 p-4 bg-gray-900 rounded text-xs text-gray-300 overflow-x-auto">
            <pre>{`<AnimatedStarsBackground
  starCount={${config.starCount}}
  speed={${config.speed}}
  starColor="${config.starColor}"
  direction="${config.direction}"
/>`}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StarfieldDemo