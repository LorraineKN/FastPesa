import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpRight, ArrowDownLeft, Search } from 'lucide-react';

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    fetchTransactions();
  }, [user]);

  const fetchTransactions = async () => {
    console.log('[Transactions] Fetch request', { userId: user?.id });
    const data = await apiClient
      .from('transactions')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    console.log('[Transactions] Fetch response', data);
    if (data && Array.isArray(data)) setTransactions(data);
    setLoading(false);
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-primary/10 text-primary';
      case 'pending': return 'bg-accent/10 text-accent';
      case 'failed': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filtered = transactions.filter(tx => {
    const matchesSearch = !search || 
      tx.description?.toLowerCase().includes(search.toLowerCase()) ||
      tx.reference?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-secondary animate-pulse rounded-xl" />)}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Transaction History</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by description or Ref ID..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="wallet_transfer">Wallet Transfer</SelectItem>
                <SelectItem value="mpesa_paybill">Paybill</SelectItem>
                <SelectItem value="mpesa_send_money">Send Money</SelectItem>
                <SelectItem value="mpesa_buy_goods">Buy Goods</SelectItem>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="withdrawal">Withdrawal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No transactions found</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary/30 transition-colors">
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
                      <p className="text-xs text-muted-foreground">{tx.description || tx.reference}</p>
                      {tx.reference && (
                        <p className="text-xs text-muted-foreground font-mono">Ref: {tx.reference}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleString('en-KE', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: 'numeric', minute: '2-digit', hour12: true,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      KES {Number(tx.amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </span>
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

export default Transactions;
