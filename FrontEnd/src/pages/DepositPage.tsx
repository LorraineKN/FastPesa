import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowDownLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { depositToWallet, getWalletSnapshot } from '@/lib/wallet';

const DepositPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const refreshWallet = async () => {
    if (!user) return;
    const walletResponse = await getWalletSnapshot(user.id);
    console.log('[Deposit] Wallet response', walletResponse);
    if (walletResponse?.wallet) setWallet(walletResponse.wallet);
  };

  useEffect(() => {
    if (user) {
      Promise.all([
        getWalletSnapshot(user.id),
        apiClient.from('profiles').select('*').eq('user_id', user.id).single(),
      ]).then(([walletResponse, p]) => {
        if (walletResponse?.wallet) setWallet(walletResponse.wallet);
        if (p) setProfile(p);
      });
    }
  }, [user]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !profile) return;
    setLoading(true);
    const result = await depositToWallet(user!.id, Number(amount), 'Wallet deposit');
    setLoading(false);
    if (result.status === 'success') {
      toast({ title: 'Deposit Successful', description: `KES ${Number(amount).toLocaleString()} deposited. Ref: ${result.ref}` });
      setTimeout(() => {
        toast({ title: '📱 SMS Delivered', description: 'Deposit confirmation message sent successfully.' });
      }, 1500);
      setAmount('');
      await refreshWallet();
    } else {
      toast({ title: 'Deposit Failed', description: result.message, variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <ArrowDownLeft className="w-5 h-5 text-primary" />
            Deposit Funds
          </CardTitle>
          <CardDescription>Add money to your wallet (Demo Mode - instant credit)</CardDescription>
        </CardHeader>
        <CardContent>
          {wallet && (
            <div className="mb-6 p-4 rounded-xl bg-secondary">
              <p className="text-xs text-muted-foreground">Current Balance</p>
              <p className="text-xl font-display font-bold text-foreground">
                KES {Number(wallet.balance).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Wallet ID: <span className="font-mono text-foreground">{wallet.id}</span></p>
            </div>
          )}
          <form onSubmit={handleDeposit} className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (KES)</Label>
              <Input type="number" placeholder="0.00" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Processing...' : 'Deposit'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepositPage;
