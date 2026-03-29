// Custom API client for backend integration
const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_SUPABASE_URL || 'http://localhost:5000';

export interface AuthResponse {
  data?: {
    user: {
      id: string;
      email: string;
      user_metadata: {
        full_name: string;
        account_type: string;
        username: string;
      };
    };
    session: {
      access_token: string;
      user: {
        id: string;
        email: string;
        user_metadata: {
          full_name: string;
          account_type: string;
          username: string;
        };
      };
    };
  };
  error?: {
    message: string;
  };
}

export interface LoginResponse {
  data?: {
    user: {
      id: string;
      email: string;
      fullName: string;
      username: string;
      accountType: string;
    };
    token: string;
    session: any;
  };
  error?: {
    message: string;
  };
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || data.message || 'Request failed');
    }

    return data;
  }

  async signUp(email: string, password: string, username: string, fullName: string, accountType: 'personal' | 'business'): Promise<AuthResponse> {
    return this.request('/auth/v1/signup', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        options: {
          data: { full_name: fullName, account_type: accountType, username },
        },
      }),
    });
  }

  async signIn(email: string, password: string): Promise<LoginResponse> {
    const response = await this.request('/auth/v1/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.data?.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  async signOut(): Promise<void> {
    if (this.token) {
      await this.request('/auth/v1/logout', {
        method: 'POST',
      });
    }
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // RPC methods
  async rpc(functionName: string, params: any) {
    return this.request(`/rest/v1/rpc/${functionName}`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Table operations - simplified interface
  from(table: string) {
    return new SupabaseStyleTableClient(this.baseURL, table, this.token);
  }
}

class SupabaseStyleTableClient {
  private baseURL: string;
  private table: string;
  private token: string | null;
  private query: string = '';

  constructor(baseURL: string, table: string, token: string | null) {
    this.baseURL = baseURL;
    this.table = table;
    this.token = token;
  }

  private async executeRequest() {
    const url = `${this.baseURL}/rest/v1/${this.table}${this.query}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
    };

    const response = await fetch(url, { headers });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || data.message || 'Request failed');
    }

    return data;
  }

  private async executeRequestPatch(updateData: any) {
    const url = `${this.baseURL}/rest/v1/${this.table}${this.query}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
    };

    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updateData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || data.message || 'Request failed');
    }

    return data;
  }

  private async executeRequestPost(insertData: any) {
    const url = `${this.baseURL}/rest/v1/${this.table}${this.query}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(insertData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || data.message || 'Request failed');
    }

    return data;
  }

  select(columns = '*') {
    this.query = this.query ? `${this.query}&select=${columns}` : `?select=${columns}`;
    return this;
  }

  eq(column: string, value: any) {
    this.query = this.query ? `${this.query}&${column}=eq.${value}` : `?${column}=eq.${value}`;
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}) {
    this.query = this.query ? `${this.query}&order=${column}.${options.ascending ? 'asc' : 'desc'}` : `?order=${column}.${options.ascending ? 'asc' : 'desc'}`;
    return this;
  }

  limit(limit: number) {
    this.query = this.query ? `${this.query}&limit=${limit}` : `?limit=${limit}`;
    return this;
  }

  single() {
    return this.executeRequest().then(data => data.data?.[0] || null);
  }

  then(resolve: any, reject?: any) {
    return this.executeRequest().then(resolve, reject);
  }

  update(updateData: any) {
    return {
      eq: (column: string, value: any) => {
        this.query = this.query ? `${this.query}&${column}=eq.${value}` : `?${column}=eq.${value}`;
        return this.executeRequestPatch(updateData);
      }
    };
  }

  insert(insertData: any) {
    return this.executeRequestPost(insertData);
  }
}

export const apiClient = new ApiClient(API_URL);
