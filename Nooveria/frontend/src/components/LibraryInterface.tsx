import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Search, Sword, Shield, Crown, Wand2, Users, Sparkles, Flame, ArrowUpDown, TrendingUp, Coins, Info } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useIsMobile } from "./ui/use-mobile";
import { apiService, User as UserType } from "../services/api";
import { ImageWithFallback } from "./ImageWithFallback";

type SortType = 'popularity' | 'name';

interface World {
  id: number;
  name: string;
  description: string;
  assistant_id: string;
  image_url?: string;
  tokens_spent: number;
  is_active: boolean;
}

interface LibraryInterfaceProps {
  user: UserType;
  isAnimating?: boolean;
  animationDirection?: 'up' | 'down';
  onWorldSelect?: (worldId: string) => void;
  onNewChat?: () => void;
}

interface LibraryInterfaceProps {
  isAnimating?: boolean;
  animationDirection?: 'up' | 'down';
}

export function LibraryInterface({ user, isAnimating = false, animationDirection = 'up', onWorldSelect, onNewChat }: LibraryInterfaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortType, setSortType] = useState<SortType>('popularity');
  const [worlds, setWorlds] = useState<World[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const isMobile = useIsMobile();

  const sortedAndFilteredExps = useMemo(() => {
    let filtered = worlds.filter(world =>
      world.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.sort((a, b) => {
      if (sortType === 'name') {
        return a.name.localeCompare(b.name, 'ru');
      }
      return b.tokens_spent - a.tokens_spent; // popularity
    });
  }, [worlds, searchQuery, sortType]);

  useEffect(() => {
    loadWorlds();
  }, []);

  useEffect(() => {
    if (!isAnimating) {
      loadWorlds();
    }
  }, [isAnimating]);

  const loadWorlds = async () => {
    try {
      setIsLoading(true);
      console.log('LibraryInterface: Loading worlds...');
      const worldList = await apiService.getWorlds();
      console.log('LibraryInterface: Worlds loaded:', worldList);
      setWorlds(worldList);
    } catch (error) {
      console.error('LibraryInterface: Failed to load worlds:', error);
      // Fallback to empty worlds list
      setWorlds([]);
    } finally {
      setIsLoading(false);
    }
  };





  const handleWorldClick = async (worldId: number) => {
    try {
      await apiService.pinWorld(worldId.toString());
    } catch (error) {
      // Continue even if pin fails
    }
    if (onWorldSelect) {
      onWorldSelect(worldId.toString());
    }
  };

  const handleNewChat = () => {
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };





  const getAnimationClasses = () => {
    if (!isAnimating) return "opacity-100 transform translate-y-0";
    
    if (animationDirection === 'up') {
      return "animate-in slide-in-from-bottom duration-300 ease-out";
    } else {
      return "animate-out slide-out-to-bottom duration-300 ease-in";
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
      <div className={`flex-1 overflow-y-auto scrollbar-hide ${isMobile ? 'p-4' : 'p-8'}`}>
        {/* Notification */}
        {showNotification && (
          <div className="fixed top-4 right-4 z-50 bg-accent/20 border border-accent/50 rounded-lg p-4 backdrop-blur-md animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-accent-primary" />
              <div>
                <p className="text-sm font-medium text-accent-primary">В разработке</p>
                <p className="text-xs text-secondary flex items-center gap-1">
                  <Coins className="w-3 h-3" />
                  Нужно больше золота...
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className={`${isMobile ? 'mb-6' : 'mb-8'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-light`} style={{ color: '#deff5e', textShadow: '#deff5e 0px 0px 3px, #000000 0px 0px 6px, #ff00eb 0px 0px 10px' }}>EXPS</h1>
              <p className={`${isMobile ? 'text-sm' : 'text-base'} mt-2`} style={{ color: '#7ed4d9' }}>Больше, чем игра Почти реальность</p>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} mt-1 ml-4`} style={{ color: '#deff5e' }}>Добро пожаловать в коллекцию миров где ВЫ — главный герой</p>
            </div>
            <Button
              onClick={handleNewChat}
              className="btn-gradient flex items-center gap-2"
              size={isMobile ? "sm" : "default"}
            >
              <Sparkles className="w-4 h-4" />
              {!isMobile && 'Создать Эксп'}
            </Button>
          </div>
          
          {/* About Exps - Moved to top */}
          <Card className="border-accent/30 backdrop-blur-sm mb-6" style={{ backgroundColor: '#1A1A1D' }}>
            <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
              <p className={`text-primary ${isMobile ? 'text-sm' : ''} text-right`}>
                Каждый Exp — это живой механизм с уникальным набором правил и возможностей
              </p>
              <p className={`text-primary ${isMobile ? 'text-sm' : ''} text-right`}>
                Выберите свой Exp и начните эксперимент. Каждое ваше решение тестирует границы этого мира, раскрывая его секреты, создавая ваш неповторимый опыт
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Sort */}
        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-row justify-between items-center'} ${isMobile ? 'mb-6' : 'mb-8'}`}>
          <Select value={sortType} onValueChange={(value: SortType) => setSortType(value)}>
            <SelectTrigger className={`${isMobile ? 'w-full' : 'w-48'} border-accent bg-input`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  По популярности
                </div>
              </SelectItem>
              <SelectItem value="name">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  По алфавиту
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <div className={`relative ${isMobile ? 'w-full' : 'max-w-md'}`}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-heading" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 border-accent focus:border-accent bg-input text-white"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className={`text-center ${isMobile ? 'py-8' : 'py-16'}`}>
            <div className="flex space-x-1 justify-center">
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#FF8C32' }}></div>
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#FF8C32', animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#FF8C32', animationDelay: '0.2s' }}></div>
            </div>
            <p className={`text-primary mt-4 ${isMobile ? 'text-sm' : ''}`}>Загрузка Экспов...</p>
          </div>
        )}

        {/* Worlds Grid */}
        {!isLoading && (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${isMobile ? 'gap-3' : 'gap-6'} ${isMobile ? 'mb-8' : 'mb-16'} max-w-6xl mx-auto`}>
            {sortedAndFilteredExps.map((world, index) => {
              const expIcons = [Sword, Shield, Crown, Wand2];
              const ExpIcon = expIcons[index % expIcons.length];
              
              return (
                <Card
                  key={world.id}
                  className="group cursor-pointer cyberpunk-card cyberpunk-menu-item border-accent/30 backdrop-blur-sm hover:border-accent transition-all duration-300 overflow-hidden"
                  style={{ backgroundColor: 'rgba(26, 26, 29, 0.8)', maxWidth: '350px', margin: '0 auto' }}
                  onClick={() => handleWorldClick(world.id)}
                >
                  <div className="relative h-40 overflow-hidden">
                    <ImageWithFallback
                      src={world.image_url || `https://images.unsplash.com/1080x720/?fantasy,${world.name}`}
                      alt={world.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      fallbackIcon={<ExpIcon className="w-8 h-8 text-accent-primary" />}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-white text-glow truncate`}>
                        {world.name}
                      </h3>
                    </div>
                  </div>
                  <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-secondary line-clamp-2 mb-3`}>
                      {world.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* No Results */}
        {!isLoading && sortedAndFilteredExps.length === 0 && (
          <div className={`text-center ${isMobile ? 'py-8' : 'py-16'}`}>
            <div 
              className={`p-4 rounded-full ${isMobile ? 'w-12 h-12' : 'w-16 h-16'} flex items-center justify-center mx-auto mb-4 border border-accent gpu-accelerated`}
              style={{ backgroundColor: '#141414' }}
            >
              <Crown className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-primary-heading text-glow`} />
            </div>
            <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-medium text-primary-heading mb-2`}>
              {searchQuery ? 'Ничего не найдено' : 'Нет Экспов'}
            </h3>
            <p className={`text-primary ${isMobile ? 'text-sm' : ''} mb-4`}>
              {searchQuery 
                ? 'Попробуйте изменить поисковый запрос'
                : 'Исследуйте Экспы других пользователей для незабываемых приключений'
              }
            </p>
            {searchQuery ? (
              <Button
                variant="outline"
                onClick={() => setSearchQuery("")}
                className={`border-accent text-primary-heading hover:text-hover ${isMobile ? 'text-sm' : ''}`}
              >
                Очистить поиск
              </Button>
            ) : (
              <Button
                onClick={handleNewChat}
                className="btn-gradient gpu-accelerated"
                size={isMobile ? "sm" : "default"}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Создать Эксп
              </Button>
            )}
          </div>
        )}


      </div>
    </div>
  );
}