import React from 'react';

interface CyberpunkEffectsProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'hologram' | 'glitch' | 'neon' | 'grid' | 'scan';
  intensity?: 'low' | 'medium' | 'high';
}

export function CyberpunkEffects({ 
  children, 
  className = '', 
  variant = 'hologram',
  intensity = 'medium' 
}: CyberpunkEffectsProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'hologram':
        return 'cyberpunk-hologram';
      case 'glitch':
        return 'cyberpunk-glitch';
      case 'neon':
        return 'cyberpunk-text-glow';
      case 'grid':
        return 'cyberpunk-grid';
      case 'scan':
        return 'cyberpunk-card';
      default:
        return '';
    }
  };

  const getIntensityClasses = () => {
    switch (intensity) {
      case 'low':
        return 'opacity-60';
      case 'medium':
        return 'opacity-80';
      case 'high':
        return 'opacity-100';
      default:
        return 'opacity-80';
    }
  };

  return (
    <div className={`${getVariantClasses()} ${getIntensityClasses()} ${className}`}>
      {children}
    </div>
  );
}

export function CyberpunkBorder({ 
  children, 
  className = '',
  animated = true 
}: { 
  children: React.ReactNode; 
  className?: string;
  animated?: boolean;
}) {
  return (
    <div className={`cyberpunk-border ${animated ? 'animate-pulse' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function CyberpunkButton({ 
  children, 
  onClick,
  className = '',
  variant = 'primary',
  disabled = false
}: { 
  children: React.ReactNode; 
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'cyberpunk-enhanced-btn';
      case 'secondary':
        return 'cyberpunk-btn border border-accent text-accent bg-transparent';
      case 'danger':
        return 'cyberpunk-enhanced-btn';
      default:
        return 'cyberpunk-enhanced-btn';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return { borderColor: '#FF003C', color: '#FF003C' };
      default:
        return {};
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${getVariantClasses()} px-6 py-3 rounded-lg font-medium transition-all duration-400 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
      } ${className}`}
      style={getVariantStyles()}
    >
      {children}
    </button>
  );
}

export function CyberpunkLoader({ 
  size = 'medium',
  className = '' 
}: { 
  size?: 'small' | 'medium' | 'large';
  className?: string;
}) {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-4 h-4';
      case 'medium':
        return 'w-6 h-6';
      case 'large':
        return 'w-8 h-8';
      default:
        return 'w-6 h-6';
    }
  };

  return (
    <div className={`cyberpunk-loading ${getSizeClasses()} ${className}`} />
  );
}

export function CyberpunkNotification({ 
  children, 
  type = 'info',
  className = '' 
}: { 
  children: React.ReactNode; 
  type?: 'info' | 'success' | 'warning' | 'error';
  className?: string;
}) {
  const getTypeClasses = () => {
    switch (type) {
      case 'success':
        return 'border-l-green-400 bg-gradient-to-r from-green-400/10 to-accent/10';
      case 'warning':
        return 'border-l-yellow-400 bg-gradient-to-r from-yellow-400/10 to-accent/10';
      case 'error':
        return 'border-l-destructive bg-gradient-to-r from-destructive/10 to-accent/10';
      default:
        return 'border-l-accent bg-gradient-to-r from-accent/10 to-accent-secondary/10';
    }
  };

  return (
    <div className={`cyberpunk-notification ${getTypeClasses()} p-4 rounded-r-lg ${className}`}>
      {children}
    </div>
  );
}

export function CyberpunkInput({ 
  placeholder,
  value,
  onChange,
  className = '',
  type = 'text'
}: { 
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`cyberpunk-terminal w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all duration-300 cyberpunk-data-stream ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(15, 15, 15, 0.95) 100%)',
        border: '1px solid rgba(0, 245, 255, 0.5)',
        color: '#00F5FF'
      }}
    />
  );
}

export function CyberpunkProgressBar({ 
  progress,
  className = '',
  showPercentage = true
}: { 
  progress: number;
  className?: string;
  showPercentage?: boolean;
}) {
  return (
    <div className={`cyberpunk-progress h-3 rounded-lg relative ${className}`}>
      <div 
        className="cyberpunk-progress-bar h-full rounded-lg transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
}

export function CyberpunkPanel({ 
  children, 
  className = '',
  title,
  status = 'active'
}: { 
  children: React.ReactNode; 
  className?: string;
  title?: string;
  status?: 'active' | 'inactive' | 'error';
}) {
  const getStatusClass = () => {
    switch (status) {
      case 'active':
        return 'cyberpunk-status-active';
      case 'error':
        return 'cyberpunk-glitch';
      default:
        return '';
    }
  };

  return (
    <div className={`cyberpunk-terminal cyberpunk-circuit cyberpunk-neon-border p-6 ${className}`}>
      {title && (
        <h3 className={`text-lg font-bold cyberpunk-text-glow mb-4 ${getStatusClass()}`}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

export function CyberpunkMatrix({ className = '' }: { className?: string }) {
  return (
    <div className={`cyberpunk-matrix-bg ${className}`} />
  );
}

export function CyberpunkStatusIndicator({ 
  status = 'active',
  label,
  className = ''
}: {
  status?: 'active' | 'inactive' | 'error' | 'warning';
  label?: string;
  className?: string;
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return '#00F5FF';
      case 'error':
        return '#FF003C';
      case 'warning':
        return '#FFFF00';
      default:
        return '#666666';
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'active':
        return 'cyberpunk-status-active';
      case 'error':
        return 'cyberpunk-glitch';
      default:
        return '';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className={`w-2 h-2 rounded-full ${getStatusClass()}`}
        style={{ 
          backgroundColor: getStatusColor(),
          boxShadow: `0 0 10px ${getStatusColor()}`
        }}
      />
      {label && (
        <span className={`text-sm ${getStatusClass()}`} style={{ color: getStatusColor() }}>
          {label}
        </span>
      )}
    </div>
  );
}