import { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import { apiService, User } from '../services/api';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const result = await authService.createAnonymousSession();
        setUser(result);
        apiService.setAuthToken(result.session_token);
      } catch (error) {
        console.error('Auth failed:', error);
        setError(error instanceof Error ? error.message : 'Authentication failed');
        // Create fallback user only if backend fails
        console.error('Auth initialization failed, creating fallback user');
        const fallbackUser: User = {
          id: 'anonymous-' + Date.now(),
          role: 'user',
          display_name: 'Anonymous User',
          personal_wallet_balance: 50000,
          session_token: 'fallback-' + Date.now()
        };
        setUser(fallbackUser);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      setError(null);
      const result = await authService.login(email, password);
      setUser(result);
      apiService.setAuthToken(result.session_token);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const register = async (email: string, password: string, displayName: string): Promise<User> => {
    try {
      setError(null);
      const result = await authService.register(email, password, displayName);
      setUser(result);
      apiService.setAuthToken(result.session_token);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const result = await authService.logout();
      setUser(result);
      apiService.setAuthToken(result.session_token);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user?.email,
    isAdmin: user?.role === 'admin'
  };
};