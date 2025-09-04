import { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { ChatInterface } from "./components/ChatInterface";
import { WalletInterface } from "./components/WalletInterface";
import { AuthInterface } from "./components/AuthInterface";
import { LibraryInterface } from "./components/LibraryInterface";
import { AdminInterface } from "./components/AdminInterface";
import { ProfileInterface } from "./components/ProfileInterface";
import { useIsMobile } from "./components/ui/use-mobile";
import { useAuth } from "./hooks/useAuth";
import { apiService } from "./services/api";
import AutoStarfield from "./components/ui/auto-starfield";

// Unified state enum instead of multiple booleans
type AppView = 'wallet' | 'auth' | 'library' | 'admin' | 'world' | 'profile';
type AnimationState = 'idle' | 'entering' | 'exiting';

interface AppState {
  currentView: AppView;
  previousView: AppView | null;
  animationState: AnimationState;
  sidebarOpen: boolean;
  selectedWorldId?: string | null;
  pinnedWorlds: string[];
}

export default function App() {
  const isMobile = useIsMobile();
  const { user, loading, login, register, logout, isAuthenticated } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const [appState, setAppState] = useState<AppState>({
    currentView: 'library',
    previousView: null,
    animationState: 'idle',
    sidebarOpen: false,
    selectedWorldId: null,
    pinnedWorlds: []
  });

  // Load pinned worlds from API
  useEffect(() => {
    const loadPinnedWorlds = async () => {
      if (user?.session_token) {
        try {
          const userWorlds = await apiService.getUserWorlds();
          const pinnedWorldIds = userWorlds.map((uw: any) => uw.world?.id?.toString() || uw.id?.toString()).filter(Boolean);
          setAppState(prev => ({ ...prev, pinnedWorlds: pinnedWorldIds }));
        } catch (error) {
          // Silently handle error for fallback tokens
          setAppState(prev => ({ ...prev, pinnedWorlds: [] }));
        }
      }
    };
    loadPinnedWorlds();
  }, [user?.session_token]);

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
        <div className="text-xl text-white flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span>ИНИЦИАЛИЗАЦИЯ...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-site">
        <div className="text-xl text-red-400 p-6" style={{ color: '#FF0000' }}>ОШИБКА СИСТЕМЫ</div>
      </div>
    );
  }

  const handleSidebarToggle = () => {
    setAppState(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen }));
  };

  const handleWalletClick = () => transitionToView('wallet');
  const handleAuthClick = () => transitionToView('auth');
  const handleLibraryClick = () => transitionToView('library');
  const handleAdminClick = () => transitionToView('admin');

  const handleWorldSelect = async (worldId: string) => {
    try {
      // Pin the world via API (will use mock response for fallback tokens)
      await apiService.pinWorld(worldId);
      
      // Update local state
      const newPinnedWorlds = [...appState.pinnedWorlds];
      if (!newPinnedWorlds.includes(worldId)) {
        newPinnedWorlds.push(worldId);
      }
      setAppState(prev => ({ 
        ...prev, 
        selectedWorldId: worldId, 
        pinnedWorlds: newPinnedWorlds, 
        sidebarOpen: false,
        currentView: 'world',
        previousView: prev.currentView,
        animationState: 'idle'
      }));
    } catch (error) {
      // Fallback: still allow world selection even if API fails
      setAppState(prev => ({ 
        ...prev, 
        selectedWorldId: worldId, 
        sidebarOpen: false,
        currentView: 'world',
        previousView: prev.currentView,
        animationState: 'idle'
      }));
    }
  };

  const handleWorldUnpin = async (worldId: string) => {
    try {
      await apiService.unpinWorld(worldId);
    } catch (error) {
      // Continue with local unpin even if API fails
    }
    
    const newPinnedWorlds = appState.pinnedWorlds.filter(id => id !== worldId);
    
    // If the unpinned world is currently open, close it
    if (appState.selectedWorldId === worldId && appState.currentView === 'world') {
      setAppState(prev => ({ 
        ...prev, 
        pinnedWorlds: newPinnedWorlds,
        selectedWorldId: null,
        currentView: 'library',
        previousView: 'world',
        animationState: 'idle'
      }));
    } else {
      setAppState(prev => ({ ...prev, pinnedWorlds: newPinnedWorlds }));
    }
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
    } else if (tab === 'profile') {
      transitionToView('profile');
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
          onWorldSelect={handleWorldSelect}
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
      case 'profile':
        return <ProfileInterface user={user} />;
      case 'world':
        console.log('Rendering ChatInterface with selectedWorldId:', appState.selectedWorldId);
        return <ChatInterface user={user} selectedWorldId={appState.selectedWorldId} />;
      case 'library':
      default:
        return (
          <LibraryInterface 
            user={user}
            isAnimating={animationState !== 'idle'}
            animationDirection={animationState === 'entering' ? 'up' : animationState === 'exiting' ? 'down' : 'up'}
            onWorldSelect={handleWorldSelect}
          />
        );
    }
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, #37191a 0%, #070b11 100%)' }}>
      <AutoStarfield />
      <div className="cyberpunk-matrix-bg"></div>
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
        onLibraryClick={handleLibraryClick}
      />
      <div className="flex-1 flex relative min-h-0">
        
        <Sidebar 
          activeTab={appState.currentView} 
          onTabChange={handleTabChange} 
          onLibraryClick={handleLibraryClick}
          isLibraryActive={appState.currentView === 'library'}
          isOpen={appState.sidebarOpen}
          isMobile={isMobile}
          onWalletClick={handleWalletClick}
          onAuthClick={handleAuthClick}
          onProfileClick={() => transitionToView('profile')}
          user={user}
          pinnedWorlds={appState.pinnedWorlds}
          onWorldSelect={handleWorldSelect}
          onWorldUnpin={handleWorldUnpin}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onClose={() => setAppState(prev => ({ ...prev, sidebarOpen: false }))}
        />
        <div className="flex-1 relative min-w-0">
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
}