import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Coins, Plus, ArrowUpRight, ArrowDownLeft, Gift, ChevronDown, History, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { apiService, User as UserType } from "../services/api";

interface WalletInterfaceProps {
  user: UserType;
}

export function WalletInterface({ user }: WalletInterfaceProps) {
  const [walletData, setWalletData] = useState<any>(null);
  const [topupAmount, setTopupAmount] = useState("");
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const loadWalletData = async () => {
      try {
        const [walletData, communalData] = await Promise.all([
          apiService.getWallets(),
          apiService.getCommunalWallet()
        ]);
        setWalletData({ ...walletData, communal: communalData });
        setTransactions([]); // Mock empty transactions for fallback
      } catch (error) {
        // Fallback wallet data
        setWalletData({ 
          personal: { balance: user.personal_wallet_balance || 50000 }, 
          communal: { balance: 1000000 } 
        });
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    loadWalletData();
  }, [user.personal_wallet_balance]);



  return (
    <div className="h-full flex flex-col" style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-6xl mx-auto space-y-8 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl text-primary-heading mb-2">Ваш кошелёк</h1>
          <p className="text-primary">Управляйте токенами и поддерживайте сообщество</p>
        </div>

        {/* Main Balance Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Dominant Personal Balance */}
          <div className="lg:col-span-2">
            <Card 
              className="border-accent backdrop-blur-sm shadow-xl"
              style={{ backgroundColor: '#1A1A1D' }}
            >
              <CardHeader className="text-center pb-4">
                <CardTitle className="flex items-center justify-center space-x-3 text-primary-heading text-2xl">
                  <div className="p-2 rounded-full btn-outline">
                    <Coins className="w-8 h-8" />
                  </div>
                  <span>Личный баланс</span>
                </CardTitle>
                <CardDescription className="text-base text-secondary">Ваши доступные токены</CardDescription>
              </CardHeader>
              <CardContent className="text-center pb-8">
                <div className="mb-8">
                  <div className="text-7xl font-light text-primary-heading mb-2">{loading ? '...' : (walletData?.personal?.balance || user?.personal_wallet_balance || 0).toLocaleString()}</div>
                  <p className="text-lg text-primary mb-6">Токенов в наличии</p>
                  
                  <div className="flex items-center justify-center space-x-2 text-sm text-secondary mb-6">
                    <TrendingUp className="w-4 h-4" />
                    <span>+12% за последний месяц</span>
                  </div>
                </div>
                
                {/* Enhanced Top-up Section */}
                <div className="max-w-md mx-auto space-y-4">
                  <Input
                    placeholder="Введите количество токенов"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    className="border-accent focus:border-accent text-center text-lg py-3 bg-input text-white placeholder-custom"
                  />
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[50, 100, 200].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setTopupAmount(amount.toString())}
                        className="btn-outline"
                      >
                        {amount}
                      </Button>
                    ))}
                  </div>
                  <Button className="w-full btn-outline py-3 text-lg shadow-lg">
                    <Plus className="w-5 h-5 mr-2" />
                    Пополнить баланс
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Tabs for Common Fund and Stats */}
          <div className="space-y-6">
            <Tabs defaultValue="fund" className="w-full">
              <TabsList 
                className="grid w-full grid-cols-2"
                style={{ backgroundColor: '#141414' }}
              >
                <TabsTrigger 
                  value="fund"
                  className="data-[state=active]:bg-accent/30 data-[state=active]:border data-[state=active]:border-accent data-[state=active]:text-white transition-all duration-200 text-secondary"
                >
                  Общак
                </TabsTrigger>
                <TabsTrigger 
                  value="stats"
                  className="data-[state=active]:bg-accent/30 data-[state=active]:border data-[state=active]:border-accent data-[state=active]:text-white transition-all duration-200 text-secondary"
                >
                  Статистика
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="fund" className="mt-4">
                <Card 
                  className="border-accent backdrop-blur-sm"
                  style={{ backgroundColor: '#1A1A1D' }}
                >
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center space-x-2 text-primary-heading">
                      <Gift className="w-5 h-5" />
                      <span>Общак</span>
                    </CardTitle>
                    <CardDescription className="text-secondary">Токены сообщества</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-3xl font-bold text-primary-heading mb-2">{loading ? '...' : (walletData?.communal?.balance || 1000000).toLocaleString()}</div>
                    <p className="text-sm text-primary mb-4">Доступно для всех</p>
                    
                    <Button variant="outline" className="w-full btn-outline mb-3">
                      <Gift className="w-4 h-4 mr-2" />
                      Внести в фонд
                    </Button>
                    
                    <p className="text-xs text-secondary">
                      Поддерживайте сообщество и пользуйтесь общими токенами, вместе с другими
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="stats" className="mt-4">
                <Card 
                  className="border-accent backdrop-blur-sm"
                  style={{ backgroundColor: '#1A1A1D' }}
                >
                  <CardHeader>
                    <CardTitle className="text-primary-heading text-center">Ваша активность</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-primary">Всего потрачено</span>
                      <span className="font-medium text-primary-heading">245 токенов</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-primary">Разговоров</span>
                      <span className="font-medium text-primary-heading">18</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-primary">Пополнений</span>
                      <span className="font-medium text-primary-heading">3</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Collapsible Transactions */}
        <Collapsible open={isTransactionsOpen} onOpenChange={setIsTransactionsOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between btn-outline py-4"
            >
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5" />
                <span className="text-lg">История транзакций</span>
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isTransactionsOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-2 mt-4">
            <Card 
              className="border-accent backdrop-blur-sm"
              style={{ backgroundColor: '#1A1A1D' }}
            >
              <CardContent className="p-6">
                <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
                  {!Array.isArray(transactions) || transactions.length === 0 ? (
                    <div className="text-center py-8 text-secondary">
                      <p>История транзакций пуста</p>
                    </div>
                  ) : (
                    transactions.map((transaction, index) => {
                      const isExpense = transaction.type.includes('expense') || transaction.amount < 0;
                      const displayAmount = Math.abs(transaction.amount);
                      return (
                        <div key={index} className="flex items-center justify-between py-3 border-b border-accent/30 last:border-b-0">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${
                              !isExpense
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {!isExpense
                                ? <ArrowDownLeft className="w-4 h-4" />
                                : <ArrowUpRight className="w-4 h-4" />
                              }
                            </div>
                            <div>
                              <p className="font-medium text-primary">{transaction.description}</p>
                              <p className="text-sm text-secondary">{new Date(transaction.created_at).toLocaleDateString('ru-RU')}</p>
                            </div>
                          </div>
                          <Badge 
                            variant={!isExpense ? 'default' : 'secondary'}
                            className={!isExpense
                              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                            }
                          >
                            {!isExpense ? '+' : '-'}{displayAmount}
                          </Badge>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Info Card */}
        <Card 
          className="border-accent backdrop-blur-sm"
          style={{ backgroundColor: '#141414' }}
        >
          <CardContent className="p-6">
            <div className="text-center text-primary">
              <h3 className="font-medium mb-2 text-primary-heading">О токенах</h3>
              <p className="text-sm leading-relaxed">
                Токены используются для доступа к услугам наших сервисов. Вы можете использовать личные токены, или 
                поплнять общий фонд и пользоваться ими вместе с другими. Каждый разговор стоит небольшое количество 
                токенов для поддержания сервиса.
              </p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}