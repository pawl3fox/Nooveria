import { Button } from "./ui/button";
import { Wallet, UserPlus, Crown, Menu, Shield, Plus } from "lucide-react";
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
  onNewChat?: () => void;
}

export function Header({ onWalletClick, onAuthClick, currentView, isMobile, onSidebarToggle, user, onAdminClick, onLogout, onNewChat }: HeaderProps) {
  return (
    <div 
      className={`${isMobile ? 'h-16' : 'h-20'} flex items-center justify-between ${isMobile ? 'px-4' : 'px-8'} shadow-lg border-b border-accent`}
      style={{ background: 'radial-gradient(circle at center, #1A1A1D 0%, #0C0C0E 100%)' }}
    >
      {/* Mobile menu button */}
      {isMobile && (
        <Button
          onClick={onSidebarToggle}
          className="shadow-lg hover:shadow-xl transition-all duration-200 btn-outline p-2"
          size="sm"
        >
          <Menu className="w-5 h-5" />
        </Button>
      )}
      
      {/* Logo/Brand Section */}
      <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
        <Button
          onClick={onNewChat}
          className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-lg shadow-lg btn-outline hover:btn-gradient transition-all duration-200`}
          size="sm"
        >
          <Crown className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
        </Button>
        <div>
          <h1 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-primary-heading`}>ЧатоСлав</h1>
          {!isMobile && <p className="text-xs text-secondary">Только для своих</p>}
        </div>
      </div>
      
      {/* Action Buttons - Desktop */}
      {!isMobile && (
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={onWalletClick}
            className={`transition-all duration-200 shadow-sm hover:shadow-md ${
              currentView === 'wallet' 
                ? 'btn-header-active' 
                : 'btn-outline'
            }`}
          >
            <Wallet className="w-4 h-4 mr-2" />
            Кошелёк
          </Button>
          
          {user?.role === 'admin' && user?.email && (
            <Button
              onClick={onAdminClick}
              className={`shadow-lg hover:shadow-xl transition-all duration-200 ${
                currentView === 'admin'
                  ? 'btn-header-active'
                  : 'btn-outline'
              }`}
            >
              <Shield className="w-4 h-4 mr-2" />
              Админ
            </Button>
          )}
          
          {user?.email ? (
            <Button
              onClick={onLogout}
              className="shadow-lg hover:shadow-xl transition-all duration-200 btn-outline"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Выйти
            </Button>
          ) : (
            <Button
              onClick={onAuthClick}
              className={`shadow-lg hover:shadow-xl transition-all duration-200 ${
                currentView === 'auth'
                  ? 'btn-header-active'
                  : 'btn-outline'
              }`}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Вход / Регистрация
            </Button>
          )}
        </div>
      )}
      
      {/* Mobile - no wallet/auth buttons here */}
    </div>
  );
}