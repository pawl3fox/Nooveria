import { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { ChatInterface } from "./components/ChatInterface";
import { WalletInterface } from "./components/WalletInterface";
import { AuthInterface } from "./components/AuthInterface";
import { LibraryInterface } from "./components/LibraryInterface";
import { AdminInterface } from "./components/AdminInterface";
import { useIsMobile } from "./components/ui/use-mobile";
import { useAuth } from "./hooks/useAuth";
import { apiService } from "./services/api";
import { saveLastChatId, getLastChatId } from "./utils/lastChat";

// Unified state enum instead of multiple booleans
type AppView = 'chat' | 'wallet' | 'auth' | 'library' | 'admin';
type AnimationState = 'idle' | 'entering' | 'exiting';

interface AppState {
  currentView: AppView;
  previousView: AppView | null;
  animationState: AnimationState;
  sidebarOpen: boolean;
  selectedChatId?: string | null;
}

export default function App() {
  const isMobile = useIsMobile();
  const { user, loading, login, register, logout, isAuthenticated } = useAuth();
  
  const [appState, setAppState] = useState<AppState>({
    currentView: 'chat',
    previousView: null,
    animationState: 'idle',
    sidebarOpen: false,
    selectedChatId: getLastChatId()
  });

  const [animationTimer, setAnimationTimer] = useState<NodeJS.Timeout | null>(null);

  // Auto-close sidebar on mobile when view changes
  useEffect(() => {
    if (isMobile) {
      setAppState(prev => ({ ...prev, sidebarOpen: false }));
    }
  }, [appState.currentView, isMobile]);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (animationTimer) {
        clearTimeout(animationTimer);
      }
    };
  }, [animationTimer]);

  const transitionToView = useCallback((newView: AppView) => {
    const currentView = appState.currentView;
    
    // Don't animate if clicking on the same view
    if (currentView === newView) {
      return;
    }
    
    // Clear any existing timer
    if (animationTimer) {
      clearTimeout(animationTimer);
    }
    
    // If we're transitioning from library, animate it out first
    if (currentView === 'library' && newView !== 'library') {
      setAppState(prev => ({
        ...prev,
        animationState: 'exiting',
        previousView: currentView
      }));

      const timer = setTimeout(() => {
        setAppState({
          currentView: newView,
          previousView: currentView,
          animationState: 'idle'
        });
        setAnimationTimer(null);
      }, 300);
      
      setAnimationTimer(timer);
      return;
    }

    // If we're transitioning to library, animate it in
    if (newView === 'library') {
      setAppState({
        currentView: newView,
        previousView: currentView,
        animationState: 'entering'
      });

      const timer = setTimeout(() => {
        setAppState(prev => ({
          ...prev,
          animationState: 'idle'
        }));
        setAnimationTimer(null);
      }, 300);
      
      setAnimationTimer(timer);
      return;
    }

    // Direct transition for non-library views
    setAppState({
      currentView: newView,
      previousView: currentView,
      animationState: 'idle'
    });
  }, [appState.currentView, animationTimer]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-site">
        <div className="text-xl text-primary-heading">Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-site">
        <div className="text-xl text-red-400">Ошибка загрузки пользователя</div>
      </div>
    );
  }

  const handleSidebarToggle = () => {
    setAppState(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen }));
  };

  const handleWalletClick = () => transitionToView('wallet');
  const handleAuthClick = () => transitionToView('auth');
  const handleLibraryClick = () => transitionToView('library');
  const handleChatClick = () => {
    const lastChatId = getLastChatId();
    setAppState(prev => ({ ...prev, selectedChatId: lastChatId }));
    transitionToView('chat');
  };
  const handleAdminClick = () => transitionToView('admin');

  const handleChatSelect = (chatId: string) => {
    saveLastChatId(chatId);
    setAppState(prev => ({ ...prev, selectedChatId: chatId }));
    transitionToView('chat');
  };

  const handleNewChat = async () => {
    try {
      // Create a new chat and switch to it
      const newChat = await apiService.createChat();
      setAppState(prev => ({ ...prev, selectedChatId: newChat.id }));
      transitionToView('chat');
    } catch (error) {
      console.error('Failed to create new chat:', error);
      // Fallback to regular chat view
      setAppState(prev => ({ ...prev, selectedChatId: null }));
      transitionToView('chat');
    }
  };

  const handleChatCreated = (chatId: string) => {
    saveLastChatId(chatId);
  };

  const handleAuthLogin = async (email: string, password: string) => {
    const user = await login(email, password);
    if (user.role === 'admin') {
      transitionToView('admin');
    } else {
      transitionToView('chat');
    }
    return user;
  };

  const handleAuthRegister = async (email: string, password: string, displayName: string) => {
    try {
      const user = await register(email, password, displayName);
      if (user.role === 'admin') {
        transitionToView('admin');
      } else {
        transitionToView('chat');
      }
      return user;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.reload();
    }
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'library') {
      handleLibraryClick();
    } else if (tab === 'chat') {
      handleChatClick();
    }
  };

  const renderMainContent = () => {
    const { currentView, animationState } = appState;

    // Show library when currentView is library (regardless of animation state)
    if (currentView === 'library') {
      return (
        <LibraryInterface 
          user={user}
          isAnimating={animationState !== 'idle'}
          animationDirection={animationState === 'entering' ? 'up' : animationState === 'exiting' ? 'down' : 'up'}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
          onChatCreated={handleChatCreated}
        />
      );
    }

    // Show other views when library is not active
    switch (currentView) {
      case 'wallet':
        return <WalletInterface user={user} />;
      case 'auth':
        return <AuthInterface onLogin={handleAuthLogin} onRegister={handleAuthRegister} />;
      case 'admin':
        return <AdminInterface user={user} />;
      case 'chat':
      default:
        return <ChatInterface user={user} selectedChatId={appState.selectedChatId} onChatCreated={handleChatCreated} />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-site relative overflow-hidden">
      <Header 
        onWalletClick={handleWalletClick} 
        onAuthClick={handleAuthClick}
        onSidebarToggle={handleSidebarToggle}
        currentView={appState.currentView}
        isMobile={isMobile}
        user={user}
        onLogout={handleLogout}
        isAuthenticated={isAuthenticated}
        onAdminClick={handleAdminClick}
        onNewChat={handleNewChat}
      />
      <div className="flex-1 flex relative min-h-0">
        {/* Mobile overlay */}
        {isMobile && appState.sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setAppState(prev => ({ ...prev, sidebarOpen: false }))}
          />
        )}
        
        <Sidebar 
          activeTab={appState.currentView} 
          onTabChange={handleTabChange} 
          onLibraryClick={handleLibraryClick}
          isLibraryActive={appState.currentView === 'library'}
          isOpen={appState.sidebarOpen}
          isMobile={isMobile}
          onWalletClick={handleWalletClick}
          onAuthClick={handleAuthClick}
          user={user}
          onChatSelect={handleChatSelect}
        />
        <div className="flex-1 relative min-w-0">
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
}