import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Mail, Lock, User } from "lucide-react";
import { useState } from "react";

interface AuthInterfaceProps {
  onLogin: (email: string, password: string) => Promise<any>;
  onRegister: (email: string, password: string, displayName: string) => Promise<any>;
}

export function AuthInterface({ onLogin, onRegister }: AuthInterfaceProps) {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    confirmPassword: "" 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) return;
    setLoading(true);
    setError(null);
    try {
      const user = await onLogin(loginData.email, loginData.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerData.name || !registerData.email || !registerData.password) return;
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await onRegister(registerData.email, registerData.password, registerData.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-md mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl text-primary-heading mb-2">Добро пожаловать</h1>
          <p className="text-primary">Присоединяйтесь к сообществу путешественников по Экспам</p>
        </div>

        <Card 
          className="border-accent backdrop-blur-sm overflow-hidden"
          style={{ backgroundColor: '#1A1A1D' }}
        >
          <Tabs defaultValue="login" className="w-full">
            <CardHeader className="pb-4">
              <TabsList 
                className="grid w-full grid-cols-2 p-1 rounded-xl"
                style={{ backgroundColor: '#141414' }}
              >
                <TabsTrigger 
                  value="login" 
                  className="data-[state=active]:bg-accent/30 data-[state=active]:border data-[state=active]:border-accent data-[state=active]:text-white data-[state=active]:shadow-sm text-secondary transition-all duration-300 ease-in-out rounded-lg"
                >
                  Вход
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="data-[state=active]:bg-accent/30 data-[state=active]:border data-[state=active]:border-accent data-[state=active]:text-white data-[state=active]:shadow-sm text-secondary transition-all duration-300 ease-in-out rounded-lg"
                >
                  Регистрация
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="relative">
              <TabsContent 
                value="login" 
                className="space-y-4 animate-in fade-in-50 slide-in-from-left-2 duration-300"
              >
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-primary">Электронная почта</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-heading" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="ваша.почта@пример.ру"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="pl-10 border-accent focus:border-accent transition-colors duration-200 bg-input text-white placeholder-custom"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-primary">Пароль</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-heading" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="pl-10 border-accent focus:border-accent transition-colors duration-200 bg-input text-white placeholder-custom"
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-red-400 text-sm text-center">{error}</div>
                )}
                
                <Button 
                  onClick={handleLogin}
                  disabled={loading || !loginData.email || !loginData.password}
                  className="w-full btn-outline transition-colors duration-200"
                >
                  {loading ? 'Вход...' : 'Войти'}
                </Button>

                <div className="text-center">
                  <Button variant="link" className="text-primary-heading hover:text-hover">
                    Забыли пароль?
                  </Button>
                </div>
              </TabsContent>

              <TabsContent 
                value="register" 
                className="space-y-4 animate-in fade-in-50 slide-in-from-right-2 duration-300"
              >
                <div className="space-y-2">
                  <Label htmlFor="register-name" className="text-primary">Полное имя</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-heading" />
                    <Input
                      id="register-name"
                      placeholder="Ваше полное имя"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      className="pl-10 border-accent focus:border-accent transition-colors duration-200 bg-input text-white placeholder-custom"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-primary">Электронная почта</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-heading" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="ваша.почта@пример.ру"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      className="pl-10 border-accent focus:border-accent transition-colors duration-200 bg-input text-white placeholder-custom"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-primary">Пароль</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-heading" />
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      className="pl-10 border-accent focus:border-accent transition-colors duration-200 bg-input text-white placeholder-custom"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-primary">Подтвердите пароль</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-heading" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      className="pl-10 border-accent focus:border-accent transition-colors duration-200 bg-input text-white placeholder-custom"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleRegister}
                  disabled={loading || !registerData.name || !registerData.email || !registerData.password || registerData.password !== registerData.confirmPassword}
                  className="w-full btn-outline transition-colors duration-200"
                >
                  {loading ? 'Создание...' : 'Создать аккаунт'}
                </Button>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Additional Info */}
        <Card 
          className="mt-6 border-accent backdrop-blur-sm"
          style={{ backgroundColor: '#141414' }}
        >
          <CardContent className="p-4">
            <div className="text-center text-primary">
              <h3 className="font-medium mb-2 text-primary-heading">Мечтали когда-либо побывать главным героем фильма?</h3>
              <p className="text-sm leading-relaxed">
                У вас появилась отличная возможность пережить разнообразный опыт в сотнях различных Экспов со своими правилами и возможностями.
                Стройте свою судьбу сами, в сгенерированных сообществом мирах, либо станьте автором своего собственного!
              </p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}