import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient, type AuthResponse, type LoginResponse } from '@/lib/api';
import { getWalletSnapshot } from '@/lib/wallet';

interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name: string;
    account_type: string;
    username: string;
  };
}

interface Session {
  access_token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  signUp: (email: string, password: string, username: string, fullName: string, accountType: 'personal' | 'business') => Promise<{ error: any; session: Session | null | undefined }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    
    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr);
        
        // Validate user data structure
        if (!userData.id || !userData.email || !userData.user_metadata) {
          console.warn('[Auth] Invalid user data in localStorage, clearing...');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          setLoading(false);
          return;
        }
        
        const sessionData: Session = {
          access_token: token,
          user: userData
        };
        setSession(sessionData);
        setUser(userData);
        apiClient.setToken(token);
        
        // Load wallet data
        getWalletSnapshot(userData.id).catch(console.error);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    setLoading(false);
  }, []);

  const syncSession = (nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (nextSession?.user) {
      localStorage.setItem('auth_token', nextSession.access_token);
      localStorage.setItem('auth_user', JSON.stringify(nextSession.user));
      apiClient.setToken(nextSession.access_token);
      
      try {
        getWalletSnapshot(nextSession.user.id);
      } catch (error) {
        console.error('[Auth] Failed to restore wallet state', error);
      }
    } else {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }

    setLoading(false);
  };

  const signUp = async (email: string, password: string, username: string, fullName: string, accountType: 'personal' | 'business') => {
    try {
      const response: AuthResponse = await apiClient.signUp(email, password, username, fullName, accountType);
      
      if (response.data?.session) {
        console.log('[Auth] User registered successfully');
        syncSession(response.data.session);
      }

      return { error: response.error, session: response.data?.session };
    } catch (error: any) {
      return { error: { message: error.message }, session: null };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('[Auth] Attempting login', { email });
    
    try {
      const response: LoginResponse = await apiClient.signIn(email, password);
      
      if (response.data?.session) {
        const sessionData: Session = {
          access_token: response.data.token,
          user: {
            id: response.data.user.id,
            email: response.data.user.email,
            user_metadata: {
              full_name: response.data.user.fullName,
              account_type: response.data.user.accountType,
              username: response.data.user.username
            }
          }
        };
        syncSession(sessionData);
        
        try {
          await getWalletSnapshot(response.data.user.id);
        } catch (error) {
          console.error('[Auth] Failed to load wallet:', error);
        }
      }

      return { error: response.error };
    } catch (error: any) {
      return { error: { message: error.message } };
    }
  };

  const signOut = async () => {
    console.log('[Auth] Signing out');
    try {
      await apiClient.signOut();
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
    }
    syncSession(null);
  };

  // Function to clear all session data (for debugging)
  const clearSession = () => {
    console.log('[Auth] Clearing all session data');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    setSession(null);
    apiClient.setToken('');
  };

  const value = useMemo(() => ({
    user,
    session,
    token: session?.access_token ?? null,
    isAuthenticated: !!user,
    loading,
    signUp,
    signIn,
    signOut,
  }), [user, session, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
