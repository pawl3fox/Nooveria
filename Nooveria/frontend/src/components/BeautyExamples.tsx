import React from 'react'

const BeautyExamples: React.FC = () => {
  return (
    <div className="p-8 space-y-12 max-w-6xl mx-auto">
      {/* Import Instructions */}
      <section className="space-y-4">
        <h1 className="text-3xl font-bold text-glow">Frontend Beauty Implementation Guide</h1>
        <p className="text-lg text-muted-foreground">
          Here's how to use the new beauty enhancements in your components:
        </p>
      </section>

      {/* CSS Imports */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">1. Import CSS Files</h2>
        <div className="bg-card p-4 rounded-lg border">
          <pre className="text-sm text-green-400">
{`// Add to your main CSS file or component
@import "./styles/micro-interactions.css";
@import "./styles/animated-backgrounds.css";
@import "./styles/hover-effects.css";`}
          </pre>
        </div>
      </section>

      {/* Component Usage */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">2. Component Usage Examples</h2>
        
        <div className="space-y-6">
          {/* Enhanced Buttons */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Enhanced Buttons</h3>
            <div className="bg-card p-4 rounded-lg border">
              <pre className="text-sm text-blue-400">
{`import { EnhancedButton } from './components/ui/enhanced-button'

// Different variants
<EnhancedButton variant="gradient" effect="glow">
  Gradient Button
</EnhancedButton>

<EnhancedButton variant="neon" effect="ripple">
  Neon Effect
</EnhancedButton>

<EnhancedButton variant="shimmer" size="lg">
  Shimmer Animation
</EnhancedButton>`}
              </pre>
            </div>
          </div>

          {/* Glass Cards */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Glass Morphism Cards</h3>
            <div className="bg-card p-4 rounded-lg border">
              <pre className="text-sm text-blue-400">
{`import { GlassCard } from './components/ui/glass-card'

<GlassCard variant="intense" blur="lg" className="p-6">
  <h3>Glass Card Content</h3>
  <p>Beautiful glass morphism effect</p>
</GlassCard>`}
              </pre>
            </div>
          </div>

          {/* Loading States */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Loading States</h3>
            <div className="bg-card p-4 rounded-lg border">
              <pre className="text-sm text-blue-400">
{`import { LoadingSpinner, Skeleton } from './components/ui/loading-states'

// Different spinner variants
<LoadingSpinner variant="orbit" size="lg" />
<LoadingSpinner variant="dots" size="md" />
<LoadingSpinner variant="bars" size="sm" />

// Skeleton loading
<Skeleton variant="card" />
<Skeleton variant="circular" className="w-12 h-12" />`}
              </pre>
            </div>
          </div>

          {/* Page Transitions */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Page Transitions</h3>
            <div className="bg-card p-4 rounded-lg border">
              <pre className="text-sm text-blue-400">
{`import { PageTransition } from './components/ui/page-transition'

<PageTransition variant="slide" duration={300}>
  <YourPageContent />
</PageTransition>`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CSS Classes */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">3. CSS Class Usage</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Micro-interactions */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Micro-interactions</h3>
            <div className="bg-card p-4 rounded-lg border space-y-2">
              <div className="text-sm space-y-1">
                <p><code className="text-green-400">btn-press</code> - Button press effect</p>
                <p><code className="text-green-400">magnetic-hover</code> - Magnetic hover</p>
                <p><code className="text-green-400">ripple</code> - Ripple effect</p>
                <p><code className="text-green-400">float</code> - Floating animation</p>
                <p><code className="text-green-400">pulse-glow</code> - Pulse glow effect</p>
              </div>
            </div>
          </div>

          {/* Hover Effects */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Hover Effects</h3>
            <div className="bg-card p-4 rounded-lg border space-y-2">
              <div className="text-sm space-y-1">
                <p><code className="text-green-400">tilt-hover</code> - 3D tilt effect</p>
                <p><code className="text-green-400">glow-border</code> - Glowing border</p>
                <p><code className="text-green-400">morph-shadow</code> - Morphing shadow</p>
                <p><code className="text-green-400">elastic-scale</code> - Elastic scaling</p>
                <p><code className="text-green-400">neon-text</code> - Neon text glow</p>
              </div>
            </div>
          </div>

          {/* Background Effects */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Background Effects</h3>
            <div className="bg-card p-4 rounded-lg border space-y-2">
              <div className="text-sm space-y-1">
                <p><code className="text-green-400">particles-bg</code> - Floating particles</p>
                <p><code className="text-green-400">mesh-gradient</code> - Animated mesh</p>
                <p><code className="text-green-400">grid-pattern</code> - Moving grid</p>
                <p><code className="text-green-400">noise-texture</code> - Noise overlay</p>
              </div>
            </div>
          </div>

          {/* Utility Classes */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Utility Classes</h3>
            <div className="bg-card p-4 rounded-lg border space-y-2">
              <div className="text-sm space-y-1">
                <p><code className="text-green-400">text-glow</code> - Text glow effect</p>
                <p><code className="text-green-400">custom-scrollbar</code> - Styled scrollbar</p>
                <p><code className="text-green-400">smooth-scroll</code> - Smooth scrolling</p>
                <p><code className="text-green-400">focus-ring</code> - Enhanced focus</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">4. Live Examples</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tilt Card */}
          <div className="tilt-hover bg-card p-6 rounded-lg border cursor-pointer">
            <h3 className="font-medium mb-2">Tilt Effect</h3>
            <p className="text-sm text-muted-foreground">Hover for 3D tilt</p>
          </div>

          {/* Glow Border Card */}
          <div className="glow-border bg-card p-6 rounded-lg cursor-pointer">
            <h3 className="font-medium mb-2">Glow Border</h3>
            <p className="text-sm text-muted-foreground">Hover for glow</p>
          </div>

          {/* Morph Shadow Card */}
          <div className="morph-shadow bg-card p-6 rounded-lg cursor-pointer">
            <h3 className="font-medium mb-2">Morph Shadow</h3>
            <p className="text-sm text-muted-foreground">Hover for shadow</p>
          </div>
        </div>
      </section>

      {/* Performance Tips */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">5. Performance Tips</h2>
        <div className="bg-card p-6 rounded-lg border space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium text-yellow-400">⚡ Optimization Guidelines</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Use <code>transform</code> and <code>opacity</code> for animations (GPU accelerated)</li>
              <li>• Add <code>will-change</code> property for elements that will animate</li>
              <li>• Use <code>transform3d()</code> to trigger hardware acceleration</li>
              <li>• Limit the number of simultaneous animations</li>
              <li>• Use <code>contain: layout style</code> to prevent layout shifts</li>
              <li>• Prefer CSS animations over JavaScript for simple effects</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}

export default BeautyExamples