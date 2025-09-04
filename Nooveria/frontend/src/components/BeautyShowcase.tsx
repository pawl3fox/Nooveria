import React from 'react'
import { GlassCard } from './ui/glass-card'
import { EnhancedButton } from './ui/enhanced-button'
import { LoadingSpinner, Skeleton } from './ui/loading-states'
import { PageTransition } from './ui/page-transition'

const BeautyShowcase: React.FC = () => {
  return (
    <PageTransition variant="slide" className="p-8 space-y-8">
      {/* Animated Background */}
      <div className="particles-bg" />
      
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-glow">
          Frontend Beauty Showcase
        </h1>
        <p className="text-lg text-muted-foreground">
          Explore enhanced UI components and effects
        </p>
      </div>

      {/* Glass Cards Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Glass Morphism Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard variant="subtle" className="p-6">
            <h3 className="text-lg font-medium mb-2">Subtle Glass</h3>
            <p className="text-sm text-muted-foreground">
              Minimal glass effect with subtle transparency
            </p>
          </GlassCard>
          
          <GlassCard variant="default" className="p-6">
            <h3 className="text-lg font-medium mb-2">Default Glass</h3>
            <p className="text-sm text-muted-foreground">
              Balanced glass effect for most use cases
            </p>
          </GlassCard>
          
          <GlassCard variant="intense" blur="lg" className="p-6">
            <h3 className="text-lg font-medium mb-2">Intense Glass</h3>
            <p className="text-sm text-muted-foreground">
              Strong glass effect with heavy blur
            </p>
          </GlassCard>
        </div>
      </section>

      {/* Enhanced Buttons Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Enhanced Buttons</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <EnhancedButton variant="gradient" effect="glow">
            Gradient
          </EnhancedButton>
          
          <EnhancedButton variant="neon" effect="ripple">
            Neon Effect
          </EnhancedButton>
          
          <EnhancedButton variant="glass" effect="none">
            Glass Button
          </EnhancedButton>
          
          <EnhancedButton variant="magnetic" effect="none">
            Magnetic
          </EnhancedButton>
          
          <EnhancedButton variant="shimmer" size="lg">
            Shimmer Effect
          </EnhancedButton>
          
          <EnhancedButton variant="default" effect="bounce">
            Bounce
          </EnhancedButton>
          
          <EnhancedButton variant="outline" className="ripple">
            Ripple
          </EnhancedButton>
          
          <EnhancedButton variant="secondary" className="magnetic-hover">
            Hover Me
          </EnhancedButton>
        </div>
      </section>

      {/* Loading States Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Loading States</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center">
          <div className="text-center space-y-2">
            <LoadingSpinner variant="default" size="lg" />
            <p className="text-sm">Default</p>
          </div>
          
          <div className="text-center space-y-2">
            <LoadingSpinner variant="dots" size="lg" />
            <p className="text-sm">Dots</p>
          </div>
          
          <div className="text-center space-y-2">
            <LoadingSpinner variant="pulse" size="lg" />
            <p className="text-sm">Pulse</p>
          </div>
          
          <div className="text-center space-y-2">
            <LoadingSpinner variant="bars" size="lg" />
            <p className="text-sm">Bars</p>
          </div>
          
          <div className="text-center space-y-2">
            <LoadingSpinner variant="orbit" size="lg" />
            <p className="text-sm">Orbit</p>
          </div>
        </div>
      </section>

      {/* Skeleton Loading Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Skeleton Loading</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Skeleton variant="circular" className="w-12 h-12" />
            <div className="space-y-2 flex-1">
              <Skeleton variant="text" className="h-4 w-3/4" />
              <Skeleton variant="text" className="h-4 w-1/2" />
            </div>
          </div>
          
          <Skeleton variant="card" />
        </div>
      </section>

      {/* Micro-interactions Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Micro-interactions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-card rounded-lg btn-press cursor-pointer">
            <p className="text-center">Press Effect</p>
          </div>
          
          <div className="p-4 bg-card rounded-lg magnetic-hover cursor-pointer">
            <p className="text-center">Magnetic Hover</p>
          </div>
          
          <div className="p-4 bg-card rounded-lg float cursor-pointer">
            <p className="text-center">Float Animation</p>
          </div>
          
          <div className="p-4 bg-card rounded-lg pulse-glow cursor-pointer">
            <p className="text-center">Pulse Glow</p>
          </div>
        </div>
      </section>

      {/* Background Patterns Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Background Patterns</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 rounded-lg mesh-gradient border border-white/20 flex items-center justify-center">
            <p className="text-white font-medium">Mesh Gradient</p>
          </div>
          
          <div className="h-32 rounded-lg grid-pattern border border-white/20 flex items-center justify-center">
            <p className="text-white font-medium">Grid Pattern</p>
          </div>
          
          <div className="h-32 rounded-lg noise-texture bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/20 flex items-center justify-center">
            <p className="text-white font-medium">Noise Texture</p>
          </div>
        </div>
      </section>
    </PageTransition>
  )
}

export default BeautyShowcase