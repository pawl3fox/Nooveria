import React from 'react'
import { starfieldConfig } from '../../config/starfield'
import AnimatedStarsBackground from './animated-stars-background'

const AutoStarfield: React.FC = () => {
  if (!starfieldConfig.enabled) return null
  
  if (starfieldConfig.type === 'css') {
    return <div className="css-starfield" />
  }
  
  return <AnimatedStarsBackground {...starfieldConfig} />
}

export default AutoStarfield