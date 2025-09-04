import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { User, Clock, Flame, Globe, TrendingUp, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { useIsMobile } from "./ui/use-mobile";
import { apiService, User as UserType } from "../services/api";

interface ProfileInterfaceProps {
  user: UserType;
}

interface UserStats {
  totalTokensSpent: number;
  totalTimeSpent: number;
  worldsVisited: number;
  favoriteWorld?: string;
  joinDate: string;
  worldStats: Array<{
    worldId: string;
    worldName: string;
    tokensSpent: number;
    timeSpent: number;
    lastVisit: string;
  }>;
}

export function ProfileInterface({ user }: ProfileInterfaceProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      setIsLoading(true);
      
      // Get user worlds and wallet data (will return mock data for fallback tokens)
      const [userWorlds, walletData] = await Promise.all([
        apiService.getUserWorlds(),
        apiService.getWallets()
      ]);
      
      const worldsCount = userWorlds.length;
      const favoriteWorld = worldsCount > 0 ? (userWorlds[0].world?.name || userWorlds[0].name || 'Нет данных') : 'Нет данных';
      
      // Use real API data for tokens and time
      let totalTokensSpent = 0;
      const worldStats = userWorlds.map((uw: any, index: number) => {
        const tokensSpent = uw.tokens_spent || 0;
        const timeSpent = uw.time_spent || 0;
        totalTokensSpent += tokensSpent;
        
        return {
          worldId: uw.world?.id?.toString() || uw.id?.toString() || `world_${index}`,
          worldName: uw.world?.name || uw.name || 'Неизвестный мир',
          tokensSpent: tokensSpent,
          timeSpent: timeSpent,
          lastVisit: uw.last_accessed || uw.created_at || new Date().toISOString()
        };
      });
      
      const stats: UserStats = {
        totalTokensSpent: totalTokensSpent,
        totalTimeSpent: worldStats.reduce((sum, world) => sum + world.timeSpent, 0),
        worldsVisited: worldsCount,
        favoriteWorld: favoriteWorld,
        joinDate: new Date().toISOString(),
        worldStats: worldStats
      };
      
      setStats(stats);
    } catch (error) {
      // Fallback stats for any error
      setStats({
        totalTokensSpent: 0,
        totalTimeSpent: 0,
        worldsVisited: 0,
        favoriteWorld: 'Нет данных',
        joinDate: new Date().toISOString(),
        worldStats: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col" style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
        <div className="flex-1 overflow-y-auto scrollbar-hide flex items-center justify-center">
          <div className="cyberpunk-loading"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className={`w-full mx-auto px-4 max-w-4xl ${isMobile ? 'p-4' : 'p-8'}`}>
        {/* Header */}
        <div className={`${isMobile ? 'mb-6' : 'mb-8'}`}>
          <h1 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-light`} style={{ color: '#deff5e', textShadow: '#deff5e 0px 0px 3px, #000000 0px 0px 6px, #ff00eb 0px 0px 10px' }}>
            ЛИЧНЫЙ КАБИНЕТ
          </h1>
          <p className={`${isMobile ? 'text-sm' : 'text-base'} mt-2`} style={{ color: '#7ed4d9' }}>
            Ваша статистика и достижения
          </p>
        </div>

        {/* User Info Card */}
        <Card className="cyberpunk-card border-accent/30 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3" style={{ color: '#deff5e' }}>
              <User className="w-6 h-6" />
              Информация о пользователе
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="cyberpunk-terminal p-3 rounded-lg border border-accent/20">
                <div className="text-sm text-secondary mb-1">Email</div>
                <div className="text-accent-primary font-medium">{user.email || 'Anonymous User'}</div>
              </div>
              <div className="cyberpunk-terminal p-3 rounded-lg border border-accent/20">
                <div className="text-sm text-secondary mb-1">Дата регистрации</div>
                <div className="text-accent-primary font-medium">
                  {stats ? formatDate(stats.joinDate) : 'Неизвестно'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="cyberpunk-card border-accent/30 hover:border-accent/50 transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Flame className="w-8 h-8" style={{ color: '#1af6ff' }} />
                <div>
                  <div className="text-2xl font-bold" style={{ color: '#1af6ff' }}>
                    {stats?.totalTokensSpent.toLocaleString()}
                  </div>
                  <div className="text-sm text-secondary">Токенов потрачено</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cyberpunk-card border-accent/30 hover:border-accent/50 transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8" style={{ color: '#deff5e' }} />
                <div>
                  <div className="text-2xl font-bold" style={{ color: '#deff5e' }}>
                    {stats ? formatTime(stats.totalTimeSpent) : '0ч 0м'}
                  </div>
                  <div className="text-sm text-secondary">Время в мирах</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cyberpunk-card border-accent/30 hover:border-accent/50 transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Globe className="w-8 h-8" style={{ color: '#7ed4d9' }} />
                <div>
                  <div className="text-2xl font-bold" style={{ color: '#7ed4d9' }}>
                    {stats?.worldsVisited}
                  </div>
                  <div className="text-sm text-secondary">Миров посещено</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cyberpunk-card border-accent/30 hover:border-accent/50 transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-400" />
                <div>
                  <div className="text-lg font-bold text-green-400">
                    {stats?.favoriteWorld || 'Нет данных'}
                  </div>
                  <div className="text-sm text-secondary">Любимый мир</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* World Statistics */}
        <Card className="cyberpunk-card border-accent/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 cyberpunk-text-glow">
              <Globe className="w-6 h-6" />
              Статистика по мирам
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.worldStats.length === 0 ? (
              <div className="text-center py-8">
                <Globe className="w-12 h-12 text-secondary mx-auto mb-4 opacity-50" />
                <p className="text-secondary">Вы еще не посещали миры</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {stats?.worldStats.map((world, index) => (
                  <div key={world.worldId} className="cyberpunk-terminal p-5 rounded-lg border border-accent/20 hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-accent-primary mb-1 cyberpunk-text-glow">
                          {world.worldName}
                        </h3>
                        <div className="text-sm text-secondary flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          Последний визит: {formatDate(world.lastVisit)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-accent-primary cyberpunk-text-glow">
                          {world.tokensSpent.toLocaleString()}
                        </div>
                        <div className="text-xs text-secondary">токенов потрачено</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="cyberpunk-stat-block p-3 rounded border border-accent/10 bg-accent/5">
                        <div className="flex items-center gap-2 mb-1">
                          <Flame className="w-4 h-4 text-accent-primary" />
                          <span className="text-sm font-medium text-accent-primary">Токены</span>
                        </div>
                        <div className="text-lg font-bold text-accent-primary">
                          {world.tokensSpent.toLocaleString()}
                        </div>
                        <div className="text-xs text-secondary">потрачено в этом мире</div>
                      </div>
                      
                      <div className="cyberpunk-stat-block p-3 rounded border border-accent/10 bg-accent/5">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-accent-secondary" />
                          <span className="text-sm font-medium text-accent-secondary">Время</span>
                        </div>
                        <div className="text-lg font-bold text-accent-secondary">
                          {formatTime(world.timeSpent)}
                        </div>
                        <div className="text-xs text-secondary">проведено в мире</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}