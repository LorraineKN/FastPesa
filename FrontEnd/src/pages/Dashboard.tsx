import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownLeft, Send, CreditCard, Plus, Minus, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getWalletSnapshot } from '@/lib/wallet';

interface WalletData {
  id: string;
  wallet_name: string;
  balance: number;
  currency: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  reference: string | null;
  created_at: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const [walletRes, txRes, profileRes] = await Promise.all([
      getWalletSnapshot(user!.id),
      supabase.from('transactions').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('profiles').select('*').eq('user_id', user!.id).single(),
    ]);

    console.log('[Dashboard] Wallet response', walletRes);
    if (walletRes?.wallet) setWallets([walletRes.wallet]);
    if (txRes.data) setTransactions(txRes.data);
    if (profileRes.data) setProfile(profileRes.data);
    setLoading(false);
  };

  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);

  const quickActions = [
    { label: 'Send', icon: Send, path: '/dashboard/transfer', color: 'bg-primary/10 text-primary' },
    { label: 'Deposit', icon: Plus, path: '/dashboard/deposit', color: 'bg-primary/10 text-primary' },
    { label: 'Withdraw', icon: Minus, path: '/dashboard/withdraw', color: 'bg-accent/10 text-accent' },
    { label: 'M-Pesa', icon: CreditCard, path: '/dashboard/mpesa', color: 'bg-accent/10 text-accent' },
  ];

  const formatAmount = (amount: number) => `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      wallet_transfer: 'Wallet Transfer',
      mpesa_paybill: 'Paybill',
      mpesa_send_money: 'Send Money',
      mpesa_buy_goods: 'Buy Goods',
      deposit: 'Deposit',
      withdrawal: 'Withdrawal',
      payment_request: 'Payment Request',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 rounded-2xl bg-secondary animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Welcome */}
      {profile && (
        <p className="text-muted-foreground">Welcome back, <span className="text-foreground font-semibold">{profile.full_name}</span></p>
      )}

      {/* Demo Mode Banner */}
      <div className="flex items-center gap-3 p-4 rounded-2xl border border-primary/20 bg-primary/5">
        <Info className="w-5 h-5 text-primary flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Demo Mode Active</p>
          <p className="text-xs text-muted-foreground">You have been credited with KES 10,000 for testing. All transactions are simulated with M-Pesa style confirmations.</p>
        </div>
      </div>

      {/* Wallet Balance Card */}
      <Card className="gradient-hero text-primary-foreground border-0 overflow-hidden relative">
        <CardContent className="p-6 lg:p-8">
          <p className="text-primary-foreground/70 text-sm mb-1">Total Balance</p>
          <h2 className="text-3xl lg:text-4xl font-display font-bold mb-2">
            {formatAmount(totalBalance)}
          </h2>
          {wallets[0] && (
            <p className="text-primary-foreground/60 text-xs font-mono">
              Wallet ID: {wallets[0].id}
            </p>
          )}
          {profile?.username && (
            <p className="text-primary-foreground/60 text-xs mt-1">
              @{profile.username}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:shadow-md transition-all"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.color}`}>
              <action.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-foreground">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display text-lg">Recent Transactions</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/transactions')}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions yet. Try a deposit or transfer!</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      ['deposit', 'payment_request'].includes(tx.type) ? 'bg-primary/10' : 'bg-destructive/10'
                    }`}>
                      {['deposit', 'payment_request'].includes(tx.type) ? (
                        <ArrowDownLeft className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{getTypeLabel(tx.type)}</p>
                      <p className="text-xs text-muted-foreground">{tx.description || 'No description'}</p>
                      {tx.reference && <p className="text-xs text-muted-foreground font-mono">Ref: {tx.reference}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${
                      ['deposit', 'payment_request'].includes(tx.type) ? 'text-primary' : 'text-foreground'
                    }`}>
                      {['deposit', 'payment_request'].includes(tx.type) ? '+' : '-'}{formatAmount(Number(tx.amount))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
