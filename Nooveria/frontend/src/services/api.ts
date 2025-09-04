const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export interface User {
  id: string;
  email?: string;
  role: string;
  display_name: string;
  personal_wallet_balance: number;
  session_token: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface WalletData {
  personal?: { balance: number };
  communal?: { balance: number };
  daily_communal_remaining?: number;
}

class ApiService {
  private authToken: string | null = null;

  constructor() {
    this.authToken = localStorage.getItem('session_token');
  }

  setAuthToken(token: string) {
    this.authToken = token;
    localStorage.setItem('session_token', token);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Handle fallback tokens
    if (this.authToken?.startsWith('fallback-')) {
      return this.getMockResponse<T>(endpoint);
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token is invalid, switch to fallback mode
        this.switchToFallbackMode();
        return this.getMockResponse<T>(endpoint);
      }
      const errorData = await response.json().catch(() => ({ detail: 'Network error' }));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  private switchToFallbackMode() {
    const fallbackToken = 'fallback-' + Date.now();
    this.authToken = fallbackToken;
    localStorage.setItem('session_token', fallbackToken);
    console.log('Switched to fallback mode due to invalid token');
  }

  private getMockResponse<T>(endpoint: string): T {
    if (endpoint.includes('/user-worlds')) {
      return [] as T;
    }
    if (endpoint.includes('/worlds')) {
      return [] as T; // No fallback worlds - force real API
    }
    if (endpoint.includes('/wallets')) {
      return { personal: { balance: 50000 }, communal: { balance: 10000 } } as T;
    }
    if (endpoint.includes('/world-chats') && endpoint.includes('/message')) {
      return { 
        message: { content: 'Демо-режим активен. Подключитесь к интернету для полной функциональности.' },
        wallet_updated: false 
      } as T;
    }
    if (endpoint.includes('/world-chats')) {
      return { id: 'demo-chat', title: 'Демо чат', messages: [] } as T;
    }
    if (endpoint.includes('/chats')) {
      return [] as T;
    }
    if (endpoint.includes('/pin') || endpoint.includes('/unpin')) {
      return { success: true } as T;
    }
    if (endpoint.includes('/user/stats') || endpoint.includes('/user/profile')) {
      return { totalTokensSpent: 0, worldsVisited: 0 } as T;
    }
    return {} as T;
  }

  async createAnonymousSession(deviceFingerprint: string): Promise<User> {
    const response: any = await this.request('/api/auth/anon', {
      method: 'POST',
      body: JSON.stringify({ device_fingerprint: deviceFingerprint }),
    });
    
    console.log('Raw API response:', response);
    
    // Map backend response to frontend User interface
    const user = {
      id: response.user_id,
      role: response.role,
      display_name: response.display_name || 'Anonymous User',
      personal_wallet_balance: response.personal_wallet_balance,
      session_token: response.session_token
    };
    
    console.log('Mapped user:', user);
    return user;
  }

  async register(email: string, password: string, displayName: string): Promise<User> {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, display_name: displayName }),
    });
  }

  async login(email: string, password: string): Promise<User> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(deviceFingerprint: string): Promise<User> {
    return this.request('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ device_fingerprint: deviceFingerprint }),
    });
  }

  async sendChatMessage(messages: ChatMessage[], preferCommunal: boolean = false, worldId?: string) {
    return this.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ 
        messages,
        prefer_communal: preferCommunal,
        world_id: worldId
      }),
    });
  }

  async getWallets(): Promise<WalletData> {
    return this.request('/api/wallets');
  }

  async getCommunalWallet() {
    return this.request('/api/wallets/communal');
  }

  async topUp(amount: number) {
    return this.request('/api/wallets/topup', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async transfer(amount: number, toUserId: string) {
    return this.request('/api/wallets/transfer', {
      method: 'POST',
      body: JSON.stringify({ amount, to_user_id: toUserId }),
    });
  }

  // Chat history endpoints
  async getChats() {
    return this.request('/api/chats');
  }

  async createChat() {
    return this.request('/api/chats', { method: 'POST' });
  }

  async getChat(chatId: string) {
    return this.request(`/api/chats/${chatId}`);
  }

  async sendChatMessageToChat(chatId: string, message: string, preferCommunal: boolean = false, worldId?: string) {
    return this.request(`/api/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ 
        message,
        prefer_communal: preferCommunal,
        world_id: worldId
      }),
    });
  }

  async deleteChat(chatId: string) {
    return this.request(`/api/chats/${chatId}`, { method: 'DELETE' });
  }

  // Admin endpoints
  async getAdminStats() {
    return this.request('/api/admin/stats');
  }

  async getUsers() {
    return this.request('/api/admin/users');
  }

  async getRecentTransactions() {
    return this.request('/api/admin/transactions');
  }

  async getErrorLogs() {
    return this.request('/api/admin/logs');
  }

  async clearErrorLogs() {
    return this.request('/api/admin/logs', { method: 'DELETE' });
  }

  // World endpoints
  async getWorlds() {
    return this.request('/api/worlds');
  }

  async getUserWorlds() {
    return this.request('/api/user-worlds');
  }

  async pinWorld(worldId: string) {
    return this.request(`/api/worlds/${worldId}/pin`, { method: 'POST' });
  }

  async unpinWorld(worldId: string) {
    return this.request(`/api/worlds/${worldId}/unpin`, { method: 'DELETE' });
  }

  // User profile endpoints
  async getUserProfile() {
    return this.request('/api/user/profile');
  }

  async getUserStats() {
    return this.request('/api/user/stats');
  }

  // World chat endpoints
  async getWorldChat(worldId: string) {
    return this.request(`/api/world-chats/${worldId}`);
  }

  async sendWorldChatMessage(worldId: string, message: string, preferCommunal: boolean = false) {
    // Handle fallback tokens with custom response
    if (this.authToken?.startsWith('fallback-')) {
      return {
        message: { content: `Демо-режим активен. Ваше сообщение: "${message}". Подключитесь к интернету для полной функциональности.` },
        wallet_updated: false
      };
    }
    
    try {
      return await this.request(`/api/world-chats/${worldId}/message`, {
        method: 'POST',
        body: JSON.stringify({ 
          message,
          prefer_communal: preferCommunal,
          world_id: worldId
        }),
      });
    } catch (error) {
      // If request fails, return fallback response
      return {
        message: { content: `Демо-режим активен. Ваше сообщение: "${message}". Подключитесь к интернету для полной функциональности.` },
        wallet_updated: false
      };
    }
  }
}

export const apiService = new ApiService();