import { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import { apiService, User } from '../services/api';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      // Force clear all localStorage to start fresh
      localStorage.clear();
      
      console.log('useAuth: Creating fresh session');
      try {
        console.log('Creating anonymous session...');
        const result = await authService.createAnonymousSession();
        console.log('Anonymous session created:', result);
        console.log('personal_wallet_balance:', result.personal_wallet_balance, typeof result.personal_wallet_balance);
        localStorage.setItem('session_token', result.session_token);
        localStorage.setItem('session_expiry', (Date.now() + 1500000).toString()); // 25 minutes
        localStorage.setItem('user_id', result.id);
        localStorage.setItem('display_name', result.display_name);
        localStorage.setItem('wallet_balance', (result.personal_wallet_balance || 50000).toString());
        setUser(result);
        apiService.setAuthToken(result.session_token);
      } catch (error) {
        console.error('Anonymous session creation failed:', error);
        const fallbackUser: User = {
          id: 'anonymous-' + Date.now(),
          role: 'user',
          display_name: 'Anonymous User',
          personal_wallet_balance: 50000,
          session_token: 'fallback-' + Date.now()
        };
        console.log('Using fallback user:', fallbackUser);
        localStorage.setItem('session_token', fallbackUser.session_token);
        apiService.setAuthToken(fallbackUser.session_token);
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
      const deviceFingerprint = navigator.userAgent + Date.now();
      const result = await authService.logout(deviceFingerprint);
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