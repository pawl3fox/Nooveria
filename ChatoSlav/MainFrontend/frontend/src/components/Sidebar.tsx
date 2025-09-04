import { Button } from "./ui/button";
import { MessageCircle, BookOpen, Wallet, UserPlus, LayoutGrid, ChevronDown, ExternalLink, Code, FileText, Settings, Clock, Trash2 } from "lucide-react";
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
  user?: any;
  onChatSelect?: (chatId: string) => void;
}

interface Service {
  id: string;
  name: string;
  icon: typeof Code;
  url: string;
  description: string;
  isActive?: boolean;
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
    icon: MessageCircle,
    url: window.location.origin,
    description: 'Текущий сервис - ИИ помощник',
    isActive: true
  },
  {
    id: 'nooveria',
    name: 'Nooveria',
    icon: Code,
    url: window.location.origin.replace('3000', '3001'),
    description: 'Генератор миров для текстовых RPG'
  },
  {
    id: 'admin-panel',
    name: 'Панель управления',
    icon: Settings,
    url: 'https://admin.example.com',
    description: 'Управление сервисами'
  }
];



export function Sidebar({ activeTab, onTabChange, onLibraryClick, isLibraryActive, isOpen = true, isMobile = false, onWalletClick, onAuthClick, user, onChatSelect }: SidebarProps) {
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const [chatHistoryExpanded, setChatHistoryExpanded] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);

  const handleServiceClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const toggleServices = () => {
    setServicesExpanded(!servicesExpanded);
  };

  const handleChatClick = () => {
    if (activeTab === 'chat') {
      // Если уже на вкладке чата, переключаем историю
      setChatHistoryExpanded(!chatHistoryExpanded);
    } else {
      // Если на другой вкладке, переходим на чат без открытия истории
      setChatHistoryExpanded(false);
      onTabChange('chat');
    }
  };

  const handleChatHistoryItemClick = (chatId: string) => {
    if (onChatSelect) {
      onChatSelect(chatId);
    }
    setChatHistoryExpanded(false);
  };

  const loadChats = async () => {
    if (!user?.session_token) return;
    
    setLoadingChats(true);
    try {
      const chats = await apiService.getChats();
      setChatHistory(chats.map((chat: any) => ({
        id: chat.id,
        title: chat.title,
        lastMessage: '',
        timestamp: new Date(chat.updated_at),
        messageCount: chat.message_count
      })));
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoadingChats(false);
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    
    if (!user?.session_token) return;
    
    try {
      await apiService.deleteChat(chatId);
      setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  useEffect(() => {
    if (user?.session_token) {
      loadChats();
    }
  }, [user?.session_token]);

  // Refresh chats when chat tab becomes active
  useEffect(() => {
    if (activeTab === 'chat' && user?.session_token) {
      loadChats();
    }
  }, [activeTab, user?.session_token]);

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
    ? `fixed left-0 top-0 bottom-0 z-50 w-64 h-full bg-sidebar transform transition-transform duration-300 ease-out shadow-2xl border-r border-accent ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`
    : 'w-72 h-full bg-sidebar flex flex-col shadow-lg border-r border-accent';

  return (
    <div className={sidebarClasses}>
      {/* Header Section - Always First */}
      <div className={`flex-shrink-0 ${isMobile ? 'p-6 pt-8' : 'p-8'} text-center`}>
        <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-medium text-primary-heading mb-1`}>Наш ИИ</h2>
        <div className="mt-3 h-1 w-16 rounded-full mx-auto btn-outline"></div>
      </div>

      {/* Our Services Section - Second Position */}
      <div className={`flex-shrink-0 ${isMobile ? 'px-4 pb-2' : 'px-6 pb-2'}`}>
        <Button
          variant="ghost"
          className={`w-full justify-between ${isMobile ? 'text-base py-4 px-4' : 'text-base py-3 px-4'} rounded-xl transition-all duration-200 group ${
            servicesExpanded
              ? "btn-menu-active-subtle shadow-lg"
              : "text-primary-heading hover:text-hover bg-transparent border border-accent/30 hover:border-accent"
          }`}
          onClick={toggleServices}
        >
          <span className="flex items-center">
            <LayoutGrid className="w-5 h-5 mr-3" />
            Наши сервисы
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
                      ? 'text-accent-primary bg-accent/20 border-accent/50' 
                      : 'text-secondary hover:text-hover bg-transparent hover:bg-accent/10 border border-transparent hover:border-accent/50'
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
        <div className={`${servicesExpanded ? 'mt-3' : 'mt-2'} h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent transition-all duration-300`}></div>
      </div>

      {/* Mobile Account Section */}
      {isMobile && (
        <div className="px-4 pb-4">
          <div className="mobile-account-section pt-4 pb-4">
            <h3 className="text-sm font-medium text-primary-heading mb-3 px-4">Аккаунт</h3>
            <div className="space-y-2 px-2">
              <Button
                variant="ghost"
                className={`w-full justify-start text-base py-3 px-4 rounded-xl transition-all duration-200 touch-target ${
                  activeTab === "wallet" 
                    ? "btn-menu-active-subtle shadow-lg" 
                    : "text-secondary hover:text-hover bg-transparent border border-accent/30 hover:border-accent"
                }`}
                onClick={onWalletClick}
              >
                <Wallet className="w-5 h-5 mr-3" />
                Кошелёк
              </Button>
              
              <Button
                variant="ghost"
                className={`w-full justify-start text-base py-3 px-4 rounded-xl transition-all duration-200 touch-target ${
                  activeTab === "auth" 
                    ? "btn-menu-active-subtle shadow-lg" 
                    : "text-secondary hover:text-hover bg-transparent border border-accent/30 hover:border-accent"
                }`}
                onClick={onAuthClick}
              >
                <UserPlus className="w-5 h-5 mr-3" />
                Вход / Регистрация
              </Button>
            </div>
          </div>
          {/* Divider line */}
          <div className="h-px bg-gradient-to-r from-transparent via-accent to-transparent mx-4"></div>
        </div>
      )}
      
      {/* Main Navigation Section */}
      <div className={`flex-shrink-0 ${isMobile ? 'p-4 pt-4' : 'p-6 pt-4'} space-y-3 transition-all duration-300`}>
        {/* Chat Button with History Dropdown */}
        <div className="space-y-1">
          <Button
            variant="ghost"
            className={`w-full ${activeTab === 'chat' ? 'justify-between' : 'justify-start'} ${isMobile ? 'text-base py-4 px-4' : 'text-base py-3 px-4'} rounded-xl transition-all duration-200 ${
              activeTab === "chat" 
                ? "btn-menu-active-subtle shadow-lg" 
                : "text-secondary hover:text-hover bg-transparent border border-accent/30 hover:border-accent"
            }`}
            onClick={handleChatClick}
          >
            <span className="flex items-center">
              <MessageCircle className="w-5 h-5 mr-3" />
              Чат
            </span>
            {activeTab === 'chat' && (
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                chatHistoryExpanded ? 'rotate-180' : ''
              }`} />
            )}
          </Button>

          {/* Chat History Dropdown - только когда активна вкладка чата */}
          {activeTab === 'chat' && (
            <div 
              className={`transition-all duration-300 ease-out overflow-hidden ${
                chatHistoryExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
              style={{
                transformOrigin: 'top',
                transform: chatHistoryExpanded ? 'scaleY(1)' : 'scaleY(0.95)'
              }}
            >
              <div className={`${isMobile ? 'pt-1 pb-1 px-2' : 'pt-2 pb-2 px-2'} space-y-1`}>
                {chatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    className={`w-full ${isMobile ? 'text-xs py-2 px-3' : 'text-xs py-2 px-3'} rounded-lg transition-all duration-200 group text-secondary hover:text-hover bg-transparent hover:bg-accent/10 border border-transparent hover:border-accent/50 h-auto cursor-pointer`}
                    onClick={() => handleChatHistoryItemClick(chat.id)}
                  >
                    <div className="flex items-start w-full min-w-0">
                      <Clock className="w-3 h-3 mr-2 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="truncate font-medium text-primary mb-0.5">
                          {chat.title}
                        </div>
                        <div className="truncate text-secondary/80 mb-1">
                          {chat.lastMessage}
                        </div>
                        <div className="flex items-center justify-between text-secondary/60">
                          <span>{formatTime(chat.timestamp)}</span>
                          <span>{chat.messageCount} сообщ.</span>
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
                
                {chatHistory.length === 0 && (
                  <div className="text-center py-4 px-3">
                    <div className="text-secondary/60 text-xs">
                      История чатов пуста
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          className={`w-full justify-start ${isMobile ? 'text-base py-4 px-4' : 'text-base py-3 px-4'} rounded-xl transition-all duration-200 group ${
            isLibraryActive
              ? "btn-menu-active-subtle shadow-lg"
              : "text-secondary hover:text-hover bg-transparent border border-accent/30 hover:border-accent"
          }`}
          onClick={onLibraryClick}
        >
          <BookOpen className={`w-5 h-5 mr-3 transition-transform duration-200 ${
            isLibraryActive ? "" : "group-hover:rotate-12"
          }`} />
          Библиотека
        </Button>
      </div>

      {/* Spacer to maintain consistent height */}
      <div className="flex-1" />

      {/* Footer Section */}
      <div 
        className={`flex-shrink-0 ${isMobile ? 'p-4' : 'p-6'} border-t border-accent/30`}
        style={{ backgroundColor: '#0C0C0E' }}
      >
        <div className="text-center">
          <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-primary-heading space-y-1`}>
            <p>Отечественный ресурс</p>
            <p>для работы с передовыми технологиями</p>
          </div>
        </div>
      </div>
    </div>
  );
}