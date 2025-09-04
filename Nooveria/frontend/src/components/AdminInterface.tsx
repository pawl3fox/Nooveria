import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Users, MessageSquare, Coins, Activity, TrendingUp, Database, Image, Upload, Sword, Crown, Wand2, Scroll, Plus, Globe, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { User as UserType, apiService } from "../services/api";

interface AdminInterfaceProps {
  user: UserType;
}

export function AdminInterface({ user }: AdminInterfaceProps) {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [worlds, setWorlds] = useState<any[]>([]);
  const [newWorld, setNewWorld] = useState({ name: '', description: '', assistant_id: '', image_url: '' });
  const [isCreatingWorld, setIsCreatingWorld] = useState(false);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        setLoading(true);
        const [statsData, usersData, transactionsData] = await Promise.all([
          apiService.getAdminStats(),
          apiService.getUsers(),
          apiService.getRecentTransactions()
        ]);
        
        // Load worlds
        try {
          const worldsData = await apiService.getWorlds();
          setWorlds(worldsData);
        } catch (error) {
          console.error('Failed to load worlds:', error);
          setWorlds([]);
        }
        
        setStats(statsData);
        setUsers(usersData);
        setTransactions(transactionsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load admin data');
        console.error('Admin data loading failed:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user.role === 'admin') {
      loadAdminData();
    }
  }, [user.role]);

  if (user.role !== 'admin') {
    return (
      <div className="flex-1 p-8 min-h-full">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl text-primary-heading mb-4">Доступ запрещен</h1>
          <p className="text-primary">У вас нет прав администратора для доступа к этой панели.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 p-8 min-h-full">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl text-primary-heading mb-4">Загрузка...</h1>
          <div className="animate-pulse w-8 h-8 bg-accent-primary rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8 min-h-full">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl text-primary-heading mb-4">Ошибка</h1>
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="btn-outline">
            Перезагрузить
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto custom-scrollbar" style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
      <div className="max-w-7xl mx-auto space-y-8 p-8 min-h-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl text-primary-heading mb-2">Панель администратора</h1>
          <p className="text-primary">Управление системой и мониторинг активности</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-accent backdrop-blur-sm" style={{ backgroundColor: '#1A1A1D' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary">Всего пользователей</CardTitle>
              <Users className="h-4 w-4 text-accent-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary-heading">{stats?.total_users?.toLocaleString() || 0}</div>
              <p className="text-xs text-secondary">Всего пользователей</p>
            </CardContent>
          </Card>

          <Card className="border-accent backdrop-blur-sm" style={{ backgroundColor: '#1A1A1D' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary">Активные пользователи</CardTitle>
              <Activity className="h-4 w-4 text-accent-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary-heading">{stats?.active_sessions || 0}</div>
              <p className="text-xs text-secondary">Активные сессии</p>
            </CardContent>
          </Card>

          <Card className="border-accent backdrop-blur-sm" style={{ backgroundColor: '#1A1A1D' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary">Всего сообщений</CardTitle>
              <MessageSquare className="h-4 w-4 text-accent-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary-heading">{stats?.total_tokens_used?.toLocaleString() || 0}</div>
              <p className="text-xs text-secondary">Использовано токенов</p>
            </CardContent>
          </Card>

          <Card className="border-accent backdrop-blur-sm" style={{ backgroundColor: '#1A1A1D' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary">Потрачено токенов</CardTitle>
              <Coins className="h-4 w-4 text-accent-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary-heading">${stats?.revenue_usd || 0}</div>
              <p className="text-xs text-secondary">Прибыль (USD)</p>
            </CardContent>
          </Card>

          <Card className="border-accent backdrop-blur-sm" style={{ backgroundColor: '#1A1A1D' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary">Общий фонд</CardTitle>
              <Database className="h-4 w-4 text-accent-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary-heading">{stats?.registered_users || 0}</div>
              <p className="text-xs text-secondary">Зарегистрированные</p>
            </CardContent>
          </Card>

          <Card className="border-accent backdrop-blur-sm" style={{ backgroundColor: '#1A1A1D' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary">Дневная активность</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary-heading">{stats?.anonymous_users || 0}</div>
              <p className="text-xs text-secondary">Анонимные пользователи</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for detailed views */}
        <Tabs defaultValue="activity" className="w-full flex flex-col">
          <TabsList className="w-full flex flex-shrink-0" style={{ backgroundColor: '#141414' }}>
            <TabsTrigger 
              value="activity"
              className="data-[state=active]:bg-accent/30 data-[state=active]:border data-[state=active]:border-accent data-[state=active]:text-white text-secondary"
            >
              Активность
            </TabsTrigger>
            <TabsTrigger 
              value="users"
              className="data-[state=active]:bg-accent/30 data-[state=active]:border data-[state=active]:border-accent data-[state=active]:text-white text-secondary"
            >
              Пользователи
            </TabsTrigger>
            <TabsTrigger 
              value="worlds"
              className="data-[state=active]:bg-accent/30 data-[state=active]:border data-[state=active]:border-accent data-[state=active]:text-white text-secondary"
            >
              Миры
            </TabsTrigger>
            <TabsTrigger 
              value="system"
              className="data-[state=active]:bg-accent/30 data-[state=active]:border data-[state=active]:border-accent data-[state=active]:text-white text-secondary"
            >
              Система
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="mt-6">
            <div className="border border-accent rounded-lg" style={{ backgroundColor: '#1A1A1D', height: '600px' }}>
              <div className="p-4 border-b border-accent">
                <h3 className="text-lg font-medium text-primary-heading">Последняя активность</h3>
              </div>
              <div className="custom-scrollbar" style={{ height: '540px', overflowY: 'scroll', padding: '16px' }}>
                {transactions.map((tx) => (
                  <div key={tx.id} style={{ padding: '12px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ color: '#fff', fontWeight: 'bold' }}>{tx.user_email}</p>
                      <p style={{ color: '#888', fontSize: '14px' }}>{tx.type}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: '#888', fontSize: '12px' }}>{new Date(tx.created_at).toLocaleString('ru-RU')}</p>
                      <p style={{ color: '#4ade80', fontSize: '12px' }}>{tx.amount_tokens} токенов</p>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#888', padding: '32px' }}>Нет транзакций</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <div className="border border-accent rounded-lg" style={{ backgroundColor: '#1A1A1D', height: '600px' }}>
              <div className="p-4 border-b border-accent">
                <h3 className="text-lg font-medium text-primary-heading">Управление пользователями</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                  <div style={{ padding: '16px', border: '1px solid #333', borderRadius: '8px' }}>
                    <h4 style={{ color: '#fff', marginBottom: '8px' }}>Зарегистрированные</h4>
                    <p style={{ color: '#4ade80', fontSize: '24px', fontWeight: 'bold' }}>{stats?.registered_users || 0}</p>
                  </div>
                  <div style={{ padding: '16px', border: '1px solid #333', borderRadius: '8px' }}>
                    <h4 style={{ color: '#fff', marginBottom: '8px' }}>Анонимные</h4>
                    <p style={{ color: '#f59e0b', fontSize: '24px', fontWeight: 'bold' }}>{stats?.anonymous_users || 0}</p>
                  </div>
                </div>
              </div>
              <div className="custom-scrollbar" style={{ height: '440px', overflowY: 'scroll', padding: '16px' }}>
                {users.map((user) => (
                  <div key={user.id} style={{ padding: '12px', border: '1px solid #333', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ color: '#fff', fontWeight: 'bold' }}>{user.display_name}</p>
                      <p style={{ color: '#888', fontSize: '14px' }}>{user.email || 'Анонимный'}</p>
                      <p style={{ color: '#888', fontSize: '12px' }}>{user.role}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: '#4ade80', fontSize: '14px' }}>{user.wallet_balance} токенов</p>
                      <p style={{ color: '#888', fontSize: '12px' }}>{new Date(user.created_at).toLocaleDateString('ru-RU')}</p>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#888', padding: '32px' }}>Нет пользователей</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="worlds" className="mt-6">
            <div className="space-y-6">
              {/* Create World Form */}
              <Card className="border-accent backdrop-blur-sm" style={{ backgroundColor: '#1A1A1D' }}>
                <CardHeader>
                  <CardTitle className="text-primary-heading flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Создать мир
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-primary mb-2 block">Название</label>
                      <Input
                        value={newWorld.name}
                        onChange={(e) => setNewWorld(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Например: Мир фантазий"
                        className="bg-input border-accent text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-primary mb-2 block">OpenAI Assistant ID</label>
                      <Input
                        value={newWorld.assistant_id}
                        onChange={(e) => setNewWorld(prev => ({ ...prev, assistant_id: e.target.value }))}
                        placeholder="asst_xxxxxxxxxxxxxxxxx"
                        className="bg-input border-accent text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-primary mb-2 block">Описание</label>
                    <Textarea
                      value={newWorld.description}
                      onChange={(e) => setNewWorld(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Описание мира и его возможностей..."
                      rows={3}
                      className="bg-input border-accent text-white resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-primary mb-2 block">Ссылка на изображение</label>
                    <Input
                      value={newWorld.image_url}
                      onChange={(e) => setNewWorld(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                      className="bg-input border-accent text-white"
                    />
                  </div>
                  <Button 
                    onClick={async () => {
                      if (!newWorld.name.trim() || !newWorld.assistant_id.trim()) return;
                      setIsCreatingWorld(true);
                      try {
                        const response = await fetch('http://185.163.45.160:8001/api/worlds', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('session_token')}`
                          },
                          body: JSON.stringify(newWorld)
                        });
                        if (response.ok) {
                          const world = await response.json();
                          setWorlds(prev => [...prev, world]);
                          setNewWorld({ name: '', description: '', assistant_id: '', image_url: '' });
                        }
                      } catch (error) {
                        console.error('Failed to create world:', error);
                      } finally {
                        setIsCreatingWorld(false);
                      }
                    }}
                    disabled={isCreatingWorld || !newWorld.name.trim() || !newWorld.assistant_id.trim()}
                    className="btn-gradient"
                  >
                    {isCreatingWorld ? 'Создание...' : 'Создать мир'}
                  </Button>
                </CardContent>
              </Card>

              {/* Worlds List */}
              <Card className="border-accent backdrop-blur-sm" style={{ backgroundColor: '#1A1A1D' }}>
                <CardHeader>
                  <CardTitle className="text-primary-heading flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Активные миры ({worlds.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {worlds.map((world) => (
                      <div key={world.id} className="p-4 border border-accent/30 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {world.image_url ? (
                                <img src={world.image_url} alt={world.name} className="w-12 h-12 rounded-lg object-cover" />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                                  <Globe className="w-6 h-6 text-accent-primary" />
                                </div>
                              )}
                              <div>
                                <h3 className="font-medium text-primary-heading">{world.name}</h3>
                                <p className="text-sm text-secondary">ID: {world.assistant_id}</p>
                              </div>
                            </div>
                            <p className="text-sm text-primary mb-3">{world.description}</p>
                          </div>
                          <Button
                            onClick={async () => {
                              try {
                                const response = await fetch(`http://185.163.45.160:8001/api/worlds/${world.id}`, {
                                  method: 'DELETE',
                                  headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('session_token')}`
                                  }
                                });
                                if (response.ok) {
                                  setWorlds(prev => prev.filter(w => w.id !== world.id));
                                }
                              } catch (error) {
                                console.error('Failed to delete world:', error);
                              }
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-4"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {worlds.length === 0 && (
                      <div className="text-center py-8">
                        <Globe className="w-12 h-12 mx-auto mb-4 text-primary-heading opacity-50" />
                        <p className="text-primary">Нет созданных миров</p>
                        <p className="text-sm text-secondary">Создайте первый мир выше</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system" className="mt-6">
            <Card className="border-accent backdrop-blur-sm" style={{ backgroundColor: '#1A1A1D' }}>
              <CardHeader>
                <CardTitle className="text-primary-heading">Системная информация</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-accent/30 rounded-lg">
                      <h3 className="font-medium text-primary-heading mb-2">Статус сервера</h3>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{stats?.system_status || 'Неизвестно'}</Badge>
                      <p className="text-sm text-secondary mt-2">Статус системы</p>
                    </div>
                    <div className="p-4 border border-accent/30 rounded-lg">
                      <h3 className="font-medium text-primary-heading mb-2">База данных</h3>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Подключена</Badge>
                      <p className="text-sm text-secondary mt-2">PostgreSQL 15.0</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button className="btn-outline">Перезапустить сервис</Button>
                    <Button className="btn-outline">Создать резервную копию</Button>
                    <Button className="btn-outline">Просмотр логов</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}