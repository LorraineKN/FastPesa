// Custom API client for backend integration
const API_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:5000';

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

  // Table operations
  from(table: string) {
    return new TableClient(this.baseURL, table, this.token);
  }
}

class TableClient {
  private baseURL: string;
  private table: string;
  private token: string | null;

  constructor(baseURL: string, table: string, token: string | null) {
    this.baseURL = baseURL;
    this.table = table;
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}/rest/v1/${this.table}${endpoint}`;
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

  select(columns = '*') {
    return {
      eq: async (column: string, value: any) => {
        const data = await this.request(`?select=${columns}&${column}=eq.${value}`);
        return data;
      },
      single: async () => {
        const data = await this.request('?select=*');
        return data.data?.[0] || null;
      },
      order: async (column: string, options: { ascending?: boolean } = {}) => {
        const data = await this.request(`?order=${column}.${options.ascending ? 'asc' : 'desc'}`);
        return data;
      },
      limit: async (limit: number) => {
        const data = await this.request(`?limit=${limit}`);
        return data;
      },
    };
  }

  insert(data: any) {
    return this.request('', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  update(data: any) {
    return {
      eq: async (column: string, value: any) => {
        const result = await this.request(`?${column}=eq.${value}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
        return result;
      },
      in: async (column: string, values: any[]) => {
        const result = await this.request(`?${column}=in.(${values.join(',')})`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
        return result;
      },
    };
  }

  delete() {
    return {
      eq: (column: string, value: any) => this.request(`?${column}=eq.${value}`, {
        method: 'DELETE',
      }),
    };
  }
}

export const apiClient = new ApiClient(API_URL);
