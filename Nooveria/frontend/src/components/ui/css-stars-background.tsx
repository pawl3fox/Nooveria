import React from 'react'

interface CSSStarsBackgroundProps {
  starCount?: number
  speed?: number
  starColor?: string
  className?: string
}

const CSSStarsBackground: React.FC<CSSStarsBackgroundProps> = ({
  starCount = 100,
  speed = 20,
  starColor = '#8b5cf6',
  className = ''
}) => {
  const stars = Array.from({ length: starCount }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    animationDelay: Math.random() * speed,
    size: Math.random() * 3 + 1,
    opacity: Math.random() * 0.8 + 0.2
  }))

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden bg-black ${className}`}>
      <style jsx>{`
        .star {
          position: absolute;
          border-radius: 50%;
          background: ${starColor};
          animation: fall ${speed}s linear infinite;
          box-shadow: 0 0 6px ${starColor}, 0 0 12px ${starColor}, 0 0 18px ${starColor};
        }
        
        @keyframes fall {
          0% {
            transform: translateY(-100vh);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }
      `}</style>
      
      {stars.map(star => (
        <div
          key={star.id}
          className="star"
          style={{
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.animationDelay}s`,
            opacity: star.opacity
          }}
        />
      ))}
    </div>
  )
}

export default CSSStarsBackground