import { apiClient } from './apiClient';

export interface AuthResponse {
  token: string;
  type: string;
  email: string;
  fullName: string;
  userId: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  username: string;
  fullName: string;
  phone: string;
  accountType: 'PERSONAL' | 'BUSINESS';
  businessName?: string;
}

export interface LoginParams {
  email: string;
  password: string;
}

class AuthService {
  async register(params: RegisterParams): Promise<{ user: User; token: string }> {
    console.log('[Auth] Registering user', { email: params.email, username: params.username });

    const response = await apiClient.post<AuthResponse>('/api/auth/register', {
      email: params.email,
      password: params.password,
      username: params.username,
      fullName: params.fullName,
      phone: params.phone,
      accountType: params.accountType,
      businessName: params.businessName || null,
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Registration failed');
    }

    const { token, userId, email, fullName } = response.data;
    
    apiClient.setToken(token);

    return {
      user: {
        id: userId,
        email,
        fullName,
      },
      token,
    };
  }

  async login(params: LoginParams): Promise<{ user: User; token: string }> {
    console.log('[Auth] Logging in', { email: params.email });

    const response = await apiClient.post<AuthResponse>('/api/auth/login', {
      email: params.email,
      password: params.password,
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Login failed');
    }

    const { token, userId, email, fullName } = response.data;
    
    apiClient.setToken(token);

    return {
      user: {
        id: userId,
        email,
        fullName,
      },
      token,
    };
  }

  logout() {
    console.log('[Auth] Logging out');
    apiClient.setToken(null);
    localStorage.removeItem('user');
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await apiClient.get<any>('/api/auth/health');
      return response.success;
    } catch (error) {
      console.error('[Auth] Health check failed', error);
      return false;
    }
  }

  getCurrentUser(): User | null {
    const token = apiClient.getToken();
    if (!token) return null;

    const userJson = localStorage.getItem('user');
    if (!userJson) return null;

    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  saveUser(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
  }
}

export const authService = new AuthService();
