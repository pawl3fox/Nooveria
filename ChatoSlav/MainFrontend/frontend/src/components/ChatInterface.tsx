import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { Send, Sparkles, MessageSquare, User, Bot } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useIsMobile } from "./ui/use-mobile";
import { apiService, User as UserType } from "../services/api";
import { saveLastChatId, getLastChatId } from "../utils/lastChat";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

interface ChatInterfaceProps {
  user: UserType;
  selectedChatId?: string | null;
  onChatCreated?: (chatId: string) => void;
}

export function ChatInterface({ user, selectedChatId, onChatCreated }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [useSharedTokens, setUseSharedTokens] = useState(false);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>(user.id);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [assistantInfo, setAssistantInfo] = useState<{name: string, description: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const chatIdRef = useRef<string | null>(null);

  // Safe scroll function
  const scrollToBottom = () => {
    try {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    } catch (error) {
      console.warn('Scroll failed:', error);
    }
  };

  // Load or create chat when user changes
  useEffect(() => {
    if (user.id !== currentUserId) {
      setCurrentChat(null);
      setMessage("");
      setIsLoading(false);
      setUseSharedTokens(false);
      setCurrentUserId(user.id);
      chatIdRef.current = null;
      loadOrCreateChat();
    }
  }, [user.id, currentUserId]);

  // Load specific chat when selectedChatId changes
  useEffect(() => {
    if (selectedChatId && selectedChatId !== chatIdRef.current) {
      // Immediately clear assistant info when switching chats
      setAssistantInfo(null);
      loadSpecificChat(selectedChatId);
    } else if (selectedChatId === null && chatIdRef.current) {
      // Reset to latest chat or create new one
      setAssistantInfo(null); // Clear assistant info when creating new chat
      loadOrCreateChat();
    }
  }, [selectedChatId]);

  // Load specific chat by ID
  const loadSpecificChat = async (chatId: string) => {
    try {
      setIsLoadingChat(true);
      // Always clear assistant info first
      setAssistantInfo(null);
      
      const chat = await apiService.getChat(chatId);
      setCurrentChat(chat);
      chatIdRef.current = chat.id;
      saveLastChatId(chat.id);
      
      // Check if this is an assistant chat
      if (chat.title.startsWith('Chat with ')) {
        const assistantName = chat.title.replace('Chat with ', '');
        try {
          const assistants = await apiService.getAssistants();
          const assistant = assistants.find(a => a.name === assistantName);
          if (assistant) {
            setAssistantInfo({ name: assistant.name, description: assistant.description });
          }
        } catch (error) {
          console.error('Failed to load assistant info:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load specific chat:', error);
      setAssistantInfo(null);
      // Fallback to loading or creating a chat
      loadOrCreateChat();
    } finally {
      setIsLoadingChat(false);
    }
  };

  // Load existing chat or create new one
  const loadOrCreateChat = async () => {
    try {
      setIsLoadingChat(true);
      // Always clear assistant info first
      setAssistantInfo(null);
      
      const chats = await apiService.getChats();
      if (chats.length > 0 && !selectedChatId) {
        // Try to load last opened chat first
        const lastChatId = getLastChatId();
        let chatToLoad = null;
        
        if (lastChatId) {
          // Check if last chat still exists
          const lastChatExists = chats.find(chat => chat.id === lastChatId);
          if (lastChatExists) {
            chatToLoad = await apiService.getChat(lastChatId);
          }
        }
        
        // Fallback to most recent chat if last chat doesn't exist
        if (!chatToLoad) {
          chatToLoad = await apiService.getChat(chats[0].id);
          saveLastChatId(chatToLoad.id);
        }
        
        setCurrentChat(chatToLoad);
        chatIdRef.current = chatToLoad.id;
        
        // Check if this is an assistant chat
        if (chatToLoad.title.startsWith('Chat with ')) {
          const assistantName = chatToLoad.title.replace('Chat with ', '');
          try {
            const assistants = await apiService.getAssistants();
            const assistant = assistants.find(a => a.name === assistantName);
            if (assistant) {
              setAssistantInfo({ name: assistant.name, description: assistant.description });
            }
          } catch (error) {
            console.error('Failed to load assistant info:', error);
          }
        }
      } else {
        // Create new chat only if no chats exist
        const newChat = await apiService.createChat();
        setCurrentChat({
          id: newChat.id,
          title: newChat.title,
          messages: []
        });
        chatIdRef.current = newChat.id;
        saveLastChatId(newChat.id);
        
        // Notify that a new chat was created
        if (onChatCreated) {
          onChatCreated(newChat.id);
        }
      }
    } catch (error) {
      console.error('Failed to load or create chat:', error);
      setCurrentChat(null);
      chatIdRef.current = null;
      setAssistantInfo(null);
    } finally {
      setIsLoadingChat(false);
    }
  };

  // Load chat on component mount
  useEffect(() => {
    if (selectedChatId) {
      loadSpecificChat(selectedChatId);
    } else {
      loadOrCreateChat();
    }
  }, []);

  // Safe scroll effect
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [currentChat?.messages?.length]);

  const sendMessage = async (userMessage: string) => {
    setIsLoading(true);
    
    try {
      let chatId = chatIdRef.current;
      
      // Create new chat if none exists
      if (!chatId) {
        const newChat = await apiService.createChat();
        chatId = newChat.id;
        chatIdRef.current = chatId;
        setCurrentChat({
          id: chatId,
          title: newChat.title,
          messages: []
        });
        
        // Notify that a new chat was created
        if (onChatCreated) {
          onChatCreated(newChat.id);
        }
      }
      
      // Send message to chat
      const response = await apiService.sendChatMessageToChat(chatId, userMessage, useSharedTokens);
      console.log('API Response:', response);
      
      // Reload the chat to get updated messages
      const updatedChat = await apiService.getChat(chatId);
      setCurrentChat(updatedChat);
      
      // Check if this is an assistant chat (only if assistant info is not already set)
      if (!assistantInfo && updatedChat.title.startsWith('Chat with ')) {
        const assistantName = updatedChat.title.replace('Chat with ', '');
        // Try to get assistant info from the list
        try {
          const assistants = await apiService.getAssistants();
          const assistant = assistants.find(a => a.name === assistantName);
          if (assistant) {
            setAssistantInfo({ name: assistant.name, description: assistant.description });
          }
        } catch (error) {
          console.error('Failed to load assistant info:', error);
        }
      }
      
    } catch (error: any) {
      console.error('Chat error:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
      
      let errorText = 'Извините, произошла ошибка.';
      
      if (error?.message === 'insufficient_funds') {
        errorText = 'Недостаточно токенов. Пополните баланс.';
      } else if (error?.response?.status === 401) {
        errorText = 'Ошибка авторизации. Перезагрузите страницу.';
      } else if (error?.response?.status === 500) {
        errorText = 'Ошибка сервера. Попробуйте позже.';
      }
      
      // Show error in current chat if available
      if (currentChat) {
        const errorMessage: Message = {
          id: Date.now().toString() + '-error',
          role: 'assistant',
          content: errorText + ' (' + (error?.message || 'Unknown error') + ')',
          created_at: new Date().toISOString()
        };
        setCurrentChat(prev => prev ? {
          ...prev,
          messages: [...prev.messages, errorMessage]
        } : null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (message.trim() && !isLoading) {
      const currentMessage = message.trim();
      setMessage("");
      
      await sendMessage(currentMessage);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExampleClick = (example: string) => {
    setMessage(example);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Show loading state
  if (isLoadingChat) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-site">
        <div className="flex space-x-1">
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#FF8C32' }}></div>
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#FF8C32', animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#FF8C32', animationDelay: '0.2s' }}></div>
        </div>
      </div>
    );
  }

  // Show welcome screen when no messages
  if (!currentChat || currentChat.messages.length === 0) {
    return (
      <div className="absolute inset-0 flex flex-col bg-site">
        <div className={`flex-1 flex flex-col items-center justify-center ${isMobile ? 'p-4' : 'p-8'} relative z-10 overflow-y-auto`}>
          <div className={`text-center ${isMobile ? 'mb-8' : 'mb-16'} max-w-4xl`}>
            <div className="flex items-center justify-center mb-6">
              <div className={`${isMobile ? 'p-3' : 'p-4'} rounded-full shadow-lg btn-outline`}>
                {assistantInfo ? (
                  <Bot className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'}`} />
                ) : (
                  <MessageSquare className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'}`} />
                )}
              </div>
            </div>
            
            <h1 className={`${isMobile ? 'text-3xl' : 'text-5xl md:text-6xl'} font-light text-primary-heading mb-6 tracking-wide`}>
              {assistantInfo ? assistantInfo.name : 'Добро пожаловать'}
            </h1>
            
            <div className="space-y-4">
              <p className={`${isMobile ? 'text-lg' : 'text-xl'} text-primary leading-relaxed max-w-2xl mx-auto`}>
                {assistantInfo ? assistantInfo.description : 'Я - ИИ помощник. Готов ответить на ваши вопросы!'}
              </p>
              
              <div className="flex items-center justify-center space-x-3 text-primary-heading">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-medium">Введите ваш вопрос ниже</span>
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>
          
          <div className={`w-full ${isMobile ? 'max-w-full px-2' : 'max-w-5xl'} space-y-6`}>
            <div 
              className={`backdrop-blur-sm rounded-2xl shadow-xl border border-accent ${isMobile ? 'p-4' : 'p-6'}`}
              style={{ backgroundColor: '#1A1A1D' }}
            >
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    ref={inputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Задайте ваш вопрос.."
                    className={`w-full ${isMobile ? 'pr-12 py-3 text-base' : 'pr-16 py-4 text-base'} border-2 border-accent focus:border-accent focus:ring-4 focus:ring-accent/20 rounded-xl transition-all duration-200 bg-input text-white placeholder-custom`}
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!message.trim() || isLoading}
                    className={`absolute ${isMobile ? 'right-2 p-2' : 'right-3 p-3'} top-1/2 -translate-y-1/2 bg-transparent border-0 text-accent-primary hover:text-accent-secondary hover:bg-accent/10 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                    size="sm"
                  >
                    <Send className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                  </Button>
                </div>
                
                {!isMobile && (
                  <div className="flex justify-end">
                    <div 
                      className="flex items-center space-x-3 px-4 py-2 rounded-lg border border-accent/30"
                      style={{ backgroundColor: '#141414' }}
                    >
                      <Checkbox 
                        id="sharedTokens" 
                        checked={useSharedTokens}
                        onCheckedChange={(checked) => setUseSharedTokens(checked as boolean)}
                        className="border-accent data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                      />
                      <label 
                        htmlFor="sharedTokens" 
                        className="text-sm font-medium text-primary cursor-pointer select-none"
                      >
                        Использовать общие токены
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-center space-y-3">
              <p 
                className={`${isMobile ? 'text-xs' : 'text-sm'} text-primary px-4 py-2 rounded-lg inline-block border border-accent/30`}
                style={{ backgroundColor: '#141414' }}
              >
                Этот чат-бот предоставляет информацию в образовательных целях
              </p>
              
              <div className={`flex flex-wrap justify-center ${isMobile ? 'gap-1' : 'gap-2'} mt-4`}>
                {[
                  "Что такое машинное обучение?",
                  "Как работает нейронная сеть?",
                  "Расскажи про искусственный интеллект",
                  "Какие бывают алгоритмы?"
                ].map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(example)}
                    className={`${isMobile ? 'text-xs px-2 py-1' : 'text-xs px-3 py-1'} text-secondary rounded-full border border-accent/30 hover:border-accent hover:text-hover transition-all duration-200 hover:shadow-sm`}
                    style={{ backgroundColor: '#141414' }}
                  >
                    {isMobile ? example.split('?')[0] + '?' : example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-shrink-0 h-4"></div>
      </div>
    );
  }

  // Chat interface with messages
  return (
    <div className="absolute inset-0 flex flex-col bg-site">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className={`${isMobile ? 'max-w-full mx-auto p-4' : 'max-w-4xl mx-auto p-6'} space-y-6 pb-6`}>
            {currentChat?.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start ${isMobile ? 'space-x-2' : 'space-x-4'} ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className={`flex-shrink-0 ${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full flex items-center justify-center btn-outline`}>
                    <Bot className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  </div>
                )}
                
                <div
                  className={`${isMobile ? 'max-w-[85%] p-3' : 'max-w-2xl p-4'} rounded-2xl ${
                    msg.role === 'user'
                      ? 'btn-outline ml-auto'
                      : 'backdrop-blur-sm border border-accent/30 text-primary'
                  }`}
                  style={msg.role === 'assistant' ? { backgroundColor: '#1A1A1D' } : {}}
                >
                  <p className={`leading-relaxed ${isMobile ? 'text-sm' : ''}`}>{msg.content}</p>
                  <p className={`text-xs mt-2 ${
                    msg.role === 'user' ? 'text-white/80' : 'text-secondary'
                  }`}>
                    {new Date(msg.created_at).toLocaleTimeString('ru-RU', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
                
                {msg.role === 'user' && (
                  <div 
                    className={`flex-shrink-0 ${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full flex items-center justify-center border border-accent`}
                    style={{ backgroundColor: '#1A1A1D' }}
                  >
                    <User className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-primary-heading`} />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className={`flex items-start ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
                <div className={`flex-shrink-0 ${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full flex items-center justify-center btn-outline`}>
                  <Bot className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                </div>
                <div 
                  className={`backdrop-blur-sm border border-accent/30 rounded-2xl ${isMobile ? 'p-3' : 'p-4'}`}
                  style={{ backgroundColor: '#1A1A1D' }}
                >
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#FF8C32' }}></div>
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#FF8C32', animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#FF8C32', animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} className="h-8"></div>
          </div>
        </ScrollArea>
      </div>
      
      <div 
        className={`flex-shrink-0 border-t border-accent/30 backdrop-blur-sm ${isMobile ? 'p-4' : 'p-6'}`}
        style={{ backgroundColor: '#1A1A1D' }}
      >
        <div className={`${isMobile ? 'w-full' : 'max-w-4xl mx-auto'}`}>
          <div className="space-y-4">
            <div className="relative">
              <Input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Задайте ваш вопрос.."
                className={`w-full ${isMobile ? 'pr-12 py-3 text-base' : 'pr-16 py-4 text-base'} border-2 border-accent focus:border-accent focus:ring-4 focus:ring-accent/20 rounded-xl transition-all duration-200 bg-input text-white placeholder-custom`}
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || isLoading}
                className={`absolute ${isMobile ? 'right-2 p-2' : 'right-3 p-2'} top-1/2 -translate-y-1/2 bg-transparent border-0 text-accent-primary hover:text-accent-secondary hover:bg-accent/10 rounded-lg transition-all duration-200 disabled:opacity-50`}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            {!isMobile && (
              <div className="flex justify-end">
                <div 
                  className="flex items-center space-x-3 px-4 py-2 rounded-lg border border-accent/30"
                  style={{ backgroundColor: '#141414' }}
                >
                  <Checkbox 
                    id="sharedTokens" 
                    checked={useSharedTokens}
                    onCheckedChange={(checked) => setUseSharedTokens(checked as boolean)}
                    className="border-accent data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                  />
                  <label 
                    htmlFor="sharedTokens" 
                    className="text-sm font-medium text-primary cursor-pointer select-none"
                  >
                    Использовать общие токены
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}