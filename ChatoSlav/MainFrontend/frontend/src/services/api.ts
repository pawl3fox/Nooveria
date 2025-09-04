const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
      const errorData = await response.json().catch(() => ({ detail: 'Network error' }));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async createAnonymousSession(deviceFingerprint: string): Promise<User> {
    return this.request('/api/auth/anon', {
      method: 'POST',
      body: JSON.stringify({ device_fingerprint: deviceFingerprint }),
    });
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

  async sendChatMessage(messages: ChatMessage[], preferCommunal: boolean = false) {
    return this.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ 
        messages,
        prefer_communal: preferCommunal 
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

  async sendChatMessageToChat(chatId: string, message: string, preferCommunal: boolean = false) {
    return this.request(`/api/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ 
        message,
        prefer_communal: preferCommunal 
      }),
    });
  }

  async deleteChat(chatId: string) {
    return this.request(`/api/chats/${chatId}`, { method: 'DELETE' });
  }

  async renameChat(chatId: string, title: string) {
    return this.request(`/api/chats/${chatId}/rename`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    });
  }

  // Assistant endpoints
  async getAssistants() {
    return this.request('/api/assistants');
  }

  async createAssistantChat(assistantId: string) {
    return this.request('/api/assistants/chat', {
      method: 'POST',
      body: JSON.stringify({ assistant_id: assistantId }),
    });
  }

  // Admin assistant management
  async createAssistant(name: string, description: string, systemPrompt: string) {
    return this.request('/api/assistants', {
      method: 'POST',
      body: JSON.stringify({ 
        name, 
        description, 
        system_prompt: systemPrompt 
      }),
    });
  }

  async deleteAssistant(assistantId: string) {
    return this.request(`/api/assistants/${assistantId}`, { method: 'DELETE' });
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
}

export const apiService = new ApiService();