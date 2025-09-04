import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Search, MessageSquare, Calendar, ArrowUpDown, ArrowDown, Trash2, Plus, Edit2, Bot, Check, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useIsMobile } from "./ui/use-mobile";
import { apiService, User as UserType } from "../services/api";

type SortType = 'recent' | 'name' | 'messages';

interface ChatHistoryItem {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface Assistant {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  is_active: boolean;
}

interface LibraryInterfaceProps {
  user: UserType;
  isAnimating?: boolean;
  animationDirection?: 'up' | 'down';
  onChatSelect?: (chatId: string) => void;
  onNewChat?: () => void;
  onChatCreated?: (chatId: string) => void;
}

export function LibraryInterface({ user, isAnimating = false, animationDirection = 'up', onChatSelect, onNewChat, onChatCreated }: LibraryInterfaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortType, setSortType] = useState<SortType>('recent');
  const [chats, setChats] = useState<ChatHistoryItem[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const isMobile = useIsMobile();

  useEffect(() => {
    loadChats();
    loadAssistants();
  }, []);

  useEffect(() => {
    if (!isAnimating) {
      loadChats();
    }
  }, [isAnimating]);

  // Refresh chats when component becomes visible
  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      setIsLoading(true);
      const chatList = await apiService.getChats();
      setChats(chatList);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAssistants = async () => {
    try {
      const assistantList = await apiService.getAssistants();
      setAssistants(assistantList);
    } catch (error) {
      console.error('Failed to load assistants:', error);
    }
  };

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'вчера';
    if (diffDays < 7) return `${diffDays} дн. назад`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} нед. назад`;
    return `${Math.ceil(diffDays / 30)} мес. назад`;
  };

  const sortedAndFilteredChats = useMemo(() => {
    let filtered = chats.filter(chat =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.sort((a, b) => {
      switch (sortType) {
        case 'recent':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'name':
          return a.title.localeCompare(b.title, 'ru');
        case 'messages':
          return b.message_count - a.message_count;
        default:
          return 0;
      }
    });
  }, [chats, searchQuery, sortType]);

  const handleChatClick = (chatId: string) => {
    if (onChatSelect) {
      onChatSelect(chatId);
    }
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiService.deleteChat(chatId);
      setChats(prev => prev.filter(chat => chat.id !== chatId));
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    try {
      await apiService.renameChat(chatId, newTitle);
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      ));
      setEditingChatId(null);
    } catch (error) {
      console.error('Failed to rename chat:', error);
    }
  };

  const handleAssistantClick = async (assistantId: string) => {
    try {
      const result = await apiService.createAssistantChat(assistantId);
      if (onChatSelect) {
        onChatSelect(result.chat_id);
      }
    } catch (error) {
      console.error('Failed to create assistant chat:', error);
    }
  };

  const startEditing = (chat: ChatHistoryItem) => {
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
  };

  const cancelEditing = () => {
    setEditingChatId(null);
    setEditTitle("");
  };

  const saveEdit = () => {
    if (editingChatId && editTitle.trim()) {
      handleRenameChat(editingChatId, editTitle.trim());
    }
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
    <div className={`absolute inset-0 bg-site ${isMobile ? 'p-4' : 'p-12'} ${getAnimationClasses()}`}>
      <div className={`${isMobile ? 'max-w-full' : 'max-w-6xl'} mx-auto h-full overflow-y-auto`}>
        {/* Header */}
        <div className={`text-center ${isMobile ? 'mb-6' : 'mb-8'}`}>
          <h1 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-light text-primary-heading mb-2`}>Библиотека</h1>
          <p className={`${isMobile ? 'text-sm' : 'text-lg'} text-primary`}>
            Чаты и ИИ помощники
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="history" className="w-full">
          <TabsList className={`grid w-full grid-cols-2 ${isMobile ? 'mb-4' : 'mb-6'}`}>
            <TabsTrigger value="history">История чатов</TabsTrigger>
            <TabsTrigger value="assistants">Помощники</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            {/* Search and Sort Controls */}
            <div className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-row items-center justify-between'} ${isMobile ? 'mb-6' : 'mb-8'}`}>
              <div className={`relative ${isMobile ? 'w-full' : 'flex-1 max-w-md'}`}>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-heading" />
                <Input
                  placeholder="Поиск по чатам..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-12 ${isMobile ? 'py-2' : 'py-3'} text-base border-2 border-accent focus:border-accent focus:ring-4 focus:ring-accent/20 rounded-xl bg-input backdrop-blur-sm transition-all duration-200 text-white placeholder-custom`}
                />
              </div>
              <div className={`flex gap-2 ${isMobile ? 'w-full' : 'flex-shrink-0'}`}>
                <Button
                  variant={sortType === 'recent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortType('recent')}
                  className={`${isMobile ? 'flex-1' : ''} ${sortType === 'recent' ? 'btn-gradient' : 'btn-outline'} transition-all duration-200`}
                >
                  <ArrowDown className="w-4 h-4 mr-2" />
                  {isMobile ? 'Дата' : 'По дате'}
                </Button>
                <Button
                  variant={sortType === 'name' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortType('name')}
                  className={`${isMobile ? 'flex-1' : ''} ${sortType === 'name' ? 'btn-gradient' : 'btn-outline'} transition-all duration-200`}
                >
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  {isMobile ? 'А-Я' : 'По алфавиту'}
                </Button>
              </div>
            </div>

            {/* Chats List */}
            {!isLoading && (
              <div className="space-y-4">
                {sortedAndFilteredChats.map((chat) => (
                  <Card
                    key={chat.id}
                    className="group cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-accent/30 backdrop-blur-sm hover:border-accent"
                    style={{ backgroundColor: '#1A1A1D' }}
                    onClick={() => editingChatId !== chat.id && handleChatClick(chat.id)}
                  >
                    <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center btn-outline">
                              <MessageSquare className="w-4 h-4" />
                            </div>
                            {editingChatId === chat.id ? (
                              <div className="flex items-center gap-2 flex-1">
                                <Input
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="flex-1 text-sm"
                                  onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                                  autoFocus
                                />
                                <Button size="sm" variant="ghost" onClick={saveEdit}>
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={cancelEditing}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-primary-heading group-hover:text-hover transition-colors duration-200 truncate`}>
                                {chat.title}
                              </h3>
                            )}
                          </div>
                          
                          <div className={`flex items-center gap-4 ${isMobile ? 'text-xs' : 'text-sm'} text-secondary`}>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              <span>{chat.message_count} сообщ.</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{getRelativeTime(chat.updated_at)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); startEditing(chat); }}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteChat(chat.id, e)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!isLoading && sortedAndFilteredChats.length === 0 && (
              <div className={`text-center ${isMobile ? 'py-8' : 'py-16'}`}>
                <MessageSquare className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} mx-auto mb-4 text-primary-heading`} />
                <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-medium text-primary-heading mb-2`}>
                  {searchQuery ? 'Ничего не найдено' : 'Нет чатов'}
                </h3>
                <p className={`text-primary ${isMobile ? 'text-sm' : ''} mb-4`}>
                  {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Начните новый разговор с ИИ помощником'}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="assistants" className="space-y-4">
            <div className="grid gap-4">
              {assistants.map((assistant) => (
                <Card
                  key={assistant.id}
                  className="group cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-accent/30 backdrop-blur-sm hover:border-accent"
                  style={{ backgroundColor: '#1A1A1D' }}
                  onClick={() => handleAssistantClick(assistant.id)}
                >
                  <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center btn-outline">
                        <Bot className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-primary-heading group-hover:text-hover transition-colors duration-200 mb-2`}>
                          {assistant.name}
                        </h3>
                        <p className={`text-primary ${isMobile ? 'text-sm' : ''} leading-relaxed`}>
                          {assistant.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {assistants.length === 0 && (
              <div className={`text-center ${isMobile ? 'py-8' : 'py-16'}`}>
                <Bot className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} mx-auto mb-4 text-primary-heading`} />
                <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-medium text-primary-heading mb-2`}>
                  Нет помощников
                </h3>
                <p className={`text-primary ${isMobile ? 'text-sm' : ''}`}>
                  ИИ помощники будут добавлены администратором
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}