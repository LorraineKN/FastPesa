import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { ensureDemoWallet, getWalletSnapshot } from '@/lib/wallet';

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

  const syncSession = async (nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (nextSession?.user) {
      try {
        const walletResponse = await getWalletSnapshot(nextSession.user.id);
        console.log('[Auth] Wallet restored', walletResponse);
      } catch (error) {
        console.error('[Auth] Failed to restore wallet state', error);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        console.log('[Auth] State changed', event);
        void syncSession(nextSession);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      void syncSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string, fullName: string, accountType: 'personal' | 'business') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, account_type: accountType, username },
      },
    });

    if (!error && data.session) {
      console.log('[Auth] User registered successfully');
      await ensureDemoWallet({
        userId: data.session.user.id,
        fullName,
        email,
        username,
        accountType,
      });
      setSession(data.session);
      setUser(data.session.user);
    }

    return { error, session: data?.session };
  };

  const signIn = async (email: string, password: string) => {
    console.log('[Auth] Attempting login', { email });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (!error && data.session) {
      await getWalletSnapshot(data.session.user.id);
    }

    return { error };
  };

  const signOut = async () => {
    console.log('[Auth] Signing out');
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
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
