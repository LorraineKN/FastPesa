import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authService, User } from '@/lib/authService';
import { walletService } from '@/lib/walletService';
import { apiClient } from '@/lib/apiClient';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    username: string,
    fullName: string,
    phone: string,
    accountType: 'personal' | 'business'
  ) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const initAuth = async () => {
      const storedToken = apiClient.getToken();
      const storedUser = authService.getCurrentUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);

        try {
          // Verify token is still valid and get wallet
          await walletService.getActiveWallet();
          console.log('[Auth] Session restored');
        } catch (error) {
          console.error('[Auth] Session invalid, logging out', error);
          authService.logout();
          setToken(null);
          setUser(null);
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    username: string,
    fullName: string,
    phone: string,
    accountType: 'personal' | 'business'
  ) => {
    try {
      // Format phone number to match backend validation (254XXXXXXXXX)
      let formattedPhone = phone.trim();
      if (formattedPhone.startsWith('+254')) {
        formattedPhone = formattedPhone.substring(1);
      } else if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('254')) {
        formattedPhone = '254' + formattedPhone;
      }
    
      const normalizedAccountType: 'PERSONAL' | 'BUSINESS' =
      accountType?.toUpperCase() === 'BUSINESS' ? 'BUSINESS' : 'PERSONAL';

      const result = await authService.register({
        email,
        password,
        username,
        fullName,
        phone: formattedPhone,
        accountType: safeAccountType,
      });

      setUser(result.user);
      setToken(result.token);
      authService.saveUser(result.user);

      console.log('[Auth] User registered successfully');
      
      // Initialize wallet
      try {
        await walletService.getActiveWallet();
      } catch (error) {
        console.error('[Auth] Failed to initialize wallet', error);
      }

      return { error: null };
    } catch (error) {
      console.error('[Auth] Registration failed', error);
      return { 
        error: {
          message: error instanceof Error ? error.message : 'Registration failed'
        }
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[Auth] Attempting login', { email });
      
      const result = await authService.login({ email, password });

      setUser(result.user);
      setToken(result.token);
      authService.saveUser(result.user);

      // Get wallet information
      try {
        await walletService.getActiveWallet();
      } catch (error) {
        console.error('[Auth] Failed to load wallet', error);
      }

      console.log('[Auth] Login successful');
      return { error: null };
    } catch (error) {
      console.error('[Auth] Login failed', error);
      return { 
        error: {
          message: error instanceof Error ? error.message : 'Login failed'
        }
      };
    }
  };

  const signOut = async () => {
    console.log('[Auth] Signing out');
    authService.logout();
    setUser(null);
    setToken(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!user && !!token,
      loading,
      signUp,
      signIn,
      signOut,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
