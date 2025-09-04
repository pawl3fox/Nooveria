import { Button } from "./ui/button";
import { Wallet2, UserPlus, Zap, Menu, Shield, Globe2 } from "lucide-react";
import { User as UserType } from "../services/api";

interface HeaderProps {
  onWalletClick: () => void;
  onAuthClick: () => void;
  onSidebarToggle?: () => void;
  currentView: 'chat' | 'wallet' | 'auth' | 'library' | 'admin';
  isMobile?: boolean;
  user?: UserType;
  onLogout?: () => void;
  isAuthenticated?: boolean;
  onAdminClick?: () => void;
  onLibraryClick?: () => void;
}

export function Header({ onWalletClick, onAuthClick, currentView, isMobile, onSidebarToggle, user, onAdminClick, onLogout, onLibraryClick }: HeaderProps) {
  return (
    <div 
      className={`${isMobile ? 'h-16' : 'h-20'} flex items-center justify-between ${isMobile ? 'px-4' : 'px-8'} cyberpunk-hologram cyberpunk-data-stream border-b border-accent relative z-40`}
      style={{ 
        background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.08) 0%, rgba(255, 0, 60, 0.06) 50%, rgba(255, 255, 0, 0.04) 100%)',
        backdropFilter: 'blur(15px) saturate(1.2)'
      }}
    >
      {/* Mobile menu button */}
      {isMobile && (
        <Button
          onClick={onSidebarToggle}
          className="cyberpunk-btn transition-all duration-200 p-2"
          size="sm"
        >
          <Menu className="w-5 h-5" />
        </Button>
      )}
      
      {/* Logo/Brand Section */}
      <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
        <Button
          variant="ghost"
          onClick={onLibraryClick}
          className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-lg bg-accent/10 border border-accent/30 gpu-accelerated relative overflow-hidden hover:bg-accent/20 transition-all duration-200 z-50 cyberpunk-enhanced-btn smooth-transition ${
            currentView === 'library' ? 'cyberpunk-status-active bg-accent/30 border-accent/50' : ''
          }`}
        >
          <Globe2 className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} cyberpunk-text-glow transition-transform duration-200 group-hover:rotate-12`} />
        </Button>
        <div>
          <h1 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold cyberpunk-text-glow cyberpunk-glitch`} data-text="NOOVERIA">NOOVERIA</h1>
          {!isMobile && <p className="text-xs text-secondary">Приключенческий портал</p>}
        </div>
      </div>
      
      {/* Action Buttons - Desktop */}
      {!isMobile && (
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={onWalletClick}
            className={`cyberpunk-enhanced-btn smooth-transition gpu-accelerated ${
              currentView === 'wallet' 
                ? 'cyberpunk-status-active' 
                : ''
            }`}
          >
            <Wallet2 className="w-4 h-4 mr-2" />
            КОШЕЛЁК
          </Button>
          
          {user?.role === 'admin' && user?.email && (
            <Button
              onClick={onAdminClick}
              className={`cyberpunk-enhanced-btn smooth-transition gpu-accelerated ${
                currentView === 'admin'
                  ? 'cyberpunk-status-active'
                  : ''
              }`}
            >
              <Shield className="w-4 h-4 mr-2" />
              СИСТЕМА
            </Button>
          )}
          
          {user?.email ? (
            <Button
              onClick={onLogout}
              className="cyberpunk-enhanced-btn smooth-transition gpu-accelerated"
              style={{ borderColor: '#FF003C', color: '#FF003C' }}
            >
              <Zap className="w-4 h-4 mr-2" />
              ВЫЙТИ
            </Button>
          ) : (
            <Button
              onClick={onAuthClick}
              className={`cyberpunk-enhanced-btn smooth-transition gpu-accelerated ${
                currentView === 'auth'
                  ? 'cyberpunk-status-active'
                  : ''
              }`}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              ВХОД/РЕГИСТРАЦИЯ
            </Button>
          )}
        </div>
      )}
      
      {/* Mobile - no wallet/auth buttons here */}
    </div>
  );
}