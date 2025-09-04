import { Button } from "./ui/button";
import { BookOpen, Wallet2, UserPlus, Grid2X2, ChevronDown, ExternalLink, Pin, Crown, Settings, Globe2, X, Zap } from "lucide-react";

// Orthodox Cross SVG Component
const OrthodoxCross = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2v20M8 6h8M9 18h6M12 2h-1v4h-3v2h3v10h-3v2h3v4h2v-4h3v-2h-3V8h3V6h-3V2h-1z"/>
    <rect x="11" y="1" width="2" height="22"/>
    <rect x="7" y="5" width="10" height="2"/>
    <rect x="8" y="17" width="8" height="2"/>
  </svg>
);
import { useState, useEffect } from "react";
import { apiService } from "../services/api";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLibraryClick: () => void;
  isLibraryActive: boolean;
  isOpen?: boolean;
  isMobile?: boolean;
  onWalletClick?: () => void;
  onAuthClick?: () => void;
  onProfileClick?: () => void;
  user?: any;
  pinnedWorlds?: string[];
  onWorldSelect?: (worldId: string) => void;
  onWorldUnpin?: (worldId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
}

interface Service {
  id: string;
  name: string;
  icon: typeof Code;
  url: string;
  description: string;
}

interface ChatHistory {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

const myServices: Service[] = [
  {
    id: 'chatoslav',
    name: 'ЧатоСлав',
    icon: Crown,
    url: window.location.origin.replace('3001', '3000'),
    description: 'Королевский чат-бот'
  },
  {
    id: 'nooveria',
    name: 'Nooveria',
    icon: Globe2,
    url: window.location.origin,
    description: 'ИИ игровые миры',
    isActive: true
  }
];



export function Sidebar({ activeTab, onTabChange, onLibraryClick, isLibraryActive, isOpen = true, isMobile = false, onWalletClick, onAuthClick, onProfileClick, user, pinnedWorlds = [], onWorldSelect, onWorldUnpin, isCollapsed = false, onToggleCollapse, onClose }: SidebarProps) {
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const [worlds, setWorlds] = useState<any[]>([]);
  const [loadingWorlds, setLoadingWorlds] = useState(false);

  const handleServiceClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const toggleServices = () => {
    setServicesExpanded(!servicesExpanded);
  };

  const loadWorlds = async () => {
    if (!user?.session_token) {
      console.log('No session token, skipping worlds load');
      return;
    }
    
    console.log('Loading worlds with token:', user.session_token.substring(0, 20) + '...');
    setLoadingWorlds(true);
    try {
      const worldsData = await apiService.getWorlds();
      console.log('Worlds loaded:', worldsData);
      setWorlds(worldsData);
    } catch (error) {
      console.error('Failed to load worlds:', error);
    } finally {
      setLoadingWorlds(false);
    }
  };

  const handleWorldUnpinConfirm = (worldId: string) => {
    if (window.confirm('Удалить EXP из закрепленных?')) {
      onWorldUnpin?.(worldId);
    }
  };

  useEffect(() => {
    if (user?.session_token) {
      loadWorlds();
    }
  }, [user?.session_token, pinnedWorlds.length]);

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 7) return `${diffDays} дн. назад`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} нед. назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  // Mobile sidebar positioning and behavior
  const sidebarClasses = isMobile 
    ? `fixed left-0 top-0 bottom-0 z-50 w-64 h-full transform transition-transform duration-300 ease-out overflow-y-auto scrollbar-hide ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`
    : `${isCollapsed ? 'w-16' : 'w-72'} h-full flex flex-col transition-all duration-300`;

  const sidebarStyle = isMobile 
    ? { background: '#1A1A1A' }
    : { background: 'rgba(0, 0, 0, 0.3)' };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}
      
      <div 
        className={sidebarClasses} 
        style={{
          ...sidebarStyle,
          ...(isMobile && {
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitScrollbar: { display: 'none' },
            zIndex: 50
          })
        }}
      >
      {/* Collapse Toggle Button */}
      {!isMobile && onToggleCollapse && (
        <div className="flex-shrink-0 p-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="text-white hover:bg-white/10 p-2"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-90' : '-rotate-90'}`} />
          </Button>
        </div>
      )}

      {/* Header Section - Always First */}
      <div className={`flex-shrink-0 ${isMobile ? 'px-4 pb-2' : isCollapsed ? 'p-2' : 'px-6 pb-2'} text-center relative z-10`}>
{!isCollapsed && <div className="mt-3 h-1 w-16 rounded-full mx-auto bg-gradient-to-r from-transparent via-white to-transparent"></div>}
      </div>

      {/* Our Services Section - Second Position */}
      {!isCollapsed && (
      <div className={`flex-shrink-0 ${isMobile ? 'px-4 pb-2' : 'px-6 pb-2'} relative z-10`}>
        <Button
          variant="ghost"
          className={`w-full justify-between ${isMobile ? 'text-base py-4 px-4' : 'text-base py-3 px-4'} rounded-xl transition-all duration-200 group cyberpunk-enhanced-btn cyberpunk-menu-item ${
            servicesExpanded
              ? "bg-white/20 text-white shadow-lg border border-white/40"
              : "text-white hover:text-white bg-transparent border border-white/20 hover:border-white/40 hover:bg-white/10"
          }`}
          onClick={toggleServices}
        >
          <span className="flex items-center">
            <Grid2X2 className="w-5 h-5 mr-3" />
            НАШИ СЕРВИСЫ
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
            servicesExpanded ? 'rotate-180' : ''
          }`} />
        </Button>

        {/* Services Dropdown */}
        <div 
          className={`transition-all duration-300 ease-out overflow-hidden ${
            servicesExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
          style={{
            transformOrigin: 'top',
            transform: servicesExpanded ? 'scaleY(1)' : 'scaleY(0.95)'
          }}
        >
          <div className={`${isMobile ? 'pt-2 pb-1 px-2' : 'pt-3 pb-2 px-2'} space-y-1`}>
            {myServices.map((service) => {
              const IconComponent = service.icon;
              return (
                <Button
                  key={service.id}
                  variant="ghost"
                  className={`w-full justify-start ${isMobile ? 'text-sm py-3 px-3' : 'text-sm py-2.5 px-3'} rounded-lg transition-all duration-200 group ${
                    service.isActive 
                      ? 'bg-white/20 text-white border border-white/40' 
                      : 'text-white/80 hover:text-white bg-transparent hover:bg-white/10 border border-transparent hover:border-white/30'
                  }`}
                  onClick={() => handleServiceClick(service.url)}
                >
                  <IconComponent className="w-4 h-4 mr-2.5 flex-shrink-0" />
                  <span className="flex-1 text-left truncate">{service.name}</span>
                  {!service.isActive && (
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0" />
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Divider after services */}
        <div className={`${servicesExpanded ? 'mt-3' : 'mt-2'} h-px bg-gradient-to-r from-transparent via-white/30 to-transparent transition-all duration-300`}></div>
      </div>
      )}


      
      {/* Mobile Wallet & Auth Section */}
      {isMobile && (
        <div className="flex-shrink-0 px-4 pb-4">
          <div className="space-y-2">
            <Button
              variant="ghost"
              className={`w-full justify-start text-base py-3 px-4 rounded-xl transition-all duration-200 touch-target ${
                activeTab === "wallet" 
                  ? "bg-white/20 text-white shadow-lg border border-white/40" 
                  : "text-white/80 hover:text-white bg-transparent border border-white/20 hover:border-white/40 hover:bg-white/10"
              }`}
              onClick={onWalletClick}
            >
              <Wallet2 className="w-5 h-5 mr-3" />
              КРЕДИТЫ
            </Button>
            
            <Button
              variant="ghost"
              className={`w-full justify-start text-base py-3 px-4 rounded-xl transition-all duration-200 touch-target ${
                activeTab === "auth" 
                  ? "bg-white/20 text-white shadow-lg border border-white/40" 
                  : "text-white/80 hover:text-white bg-transparent border border-white/20 hover:border-white/40 hover:bg-white/10"
              }`}
              onClick={onAuthClick}
            >
              <Zap className="w-5 h-5 mr-3" />
              ПОДКЛЮЧЕНИЕ
            </Button>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mt-4"></div>
        </div>
      )}
      
      {/* Main Navigation Section */}
      <div className={`flex-shrink-0 ${isMobile ? 'p-4 pt-0' : isCollapsed ? 'p-2 pt-2' : 'px-6 pt-4'} space-y-2 transition-all duration-300 relative z-10`}>
        <Button
          variant="ghost"
          className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start'} ${isMobile ? 'text-base py-4 px-4' : isCollapsed ? 'text-xs py-2 px-2' : 'text-base py-3 px-4'} rounded-xl transition-all duration-200 group cyberpunk-enhanced-btn cyberpunk-menu-item ${
            activeTab === 'profile'
              ? "bg-white/20 text-white shadow-lg border border-white/40"
              : "text-white/80 hover:text-white bg-transparent border border-white/20 hover:border-white/40 hover:bg-white/10"
          }`}
          onClick={() => onTabChange('profile')}
        >
          <Settings className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
          {!isCollapsed && 'ЛИЧНЫЙ КАБИНЕТ'}
        </Button>
        <Button
          variant="ghost"
          className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start'} ${isMobile ? 'text-base py-4 px-4' : isCollapsed ? 'text-xs py-2 px-2' : 'text-base py-3 px-4'} rounded-xl transition-all duration-200 group cyberpunk-enhanced-btn cyberpunk-menu-item ${
            isLibraryActive
              ? "bg-white/20 text-white shadow-lg border border-white/40"
              : "text-white/80 hover:text-white bg-transparent border border-white/20 hover:border-white/40 hover:bg-white/10"
          }`}
          onClick={onLibraryClick}
        >
          <BookOpen className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'} transition-transform duration-200 ${
            isLibraryActive ? "" : "group-hover:rotate-12"
          }`} />
          {!isCollapsed && 'БИБЛИОТЕКА'}
        </Button>
        
        {/* Pinned Worlds Section */}
        {pinnedWorlds.length > 0 && !isCollapsed && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-white px-4">АКТИВНЫЕ СЕССИИ</div>
            {pinnedWorlds.map((worldId) => {
              const world = worlds.find(w => w.id.toString() === worldId.toString());
              if (!world) {
                // Show loading placeholder if world not found
                return (
                  <div key={worldId} className="flex items-center gap-2 px-2">
                    <Button
                      variant="ghost"
                      className="flex-1 justify-start text-sm py-2 px-3 rounded-lg transition-all duration-200 text-white/80 hover:text-white bg-transparent hover:bg-white/10 border border-transparent hover:border-white/30"
                      onClick={() => onWorldSelect?.(worldId)}
                    >
                      <Pin className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">Сессия #{worldId}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-6 w-6 hover:bg-destructive/20 hover:text-destructive flex-shrink-0"
                      onClick={() => handleWorldUnpinConfirm(worldId)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                );
              }
              return (
                <div key={worldId} className="flex items-center gap-2 px-2">
                  <Button
                    variant="ghost"
                    className="flex-1 justify-start text-sm py-2 px-3 rounded-lg transition-all duration-200 text-white/80 hover:text-white bg-transparent hover:bg-white/10 border border-transparent hover:border-white/30"
                    onClick={() => onWorldSelect?.(worldId)}
                  >
                    <Pin className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{world.name}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-6 w-6 hover:bg-destructive/20 hover:text-destructive flex-shrink-0"
                    onClick={() => handleWorldUnpinConfirm(worldId)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Spacer to maintain consistent height */}
      <div className="flex-1" />


      </div>
    </>
  );
}