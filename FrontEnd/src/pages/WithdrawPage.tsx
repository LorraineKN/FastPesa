import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowUpRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getWalletSnapshot, withdrawFromWallet } from '@/lib/wallet';

const WithdrawPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const refreshWallet = async () => {
    if (!user) return;
    const walletResponse = await getWalletSnapshot(user.id);
    console.log('[Withdraw] Wallet response', walletResponse);
    if (walletResponse?.wallet) setWallet(walletResponse.wallet);
  };

  useEffect(() => {
    if (user) {
      Promise.all([
        getWalletSnapshot(user.id),
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      ]).then(([walletResponse, p]) => {
        if (walletResponse?.wallet) setWallet(walletResponse.wallet);
        if (p.data) setProfile(p.data);
      });
    }
  }, [user]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !profile) return;
    setLoading(true);
    const result = await withdrawFromWallet(user!.id, Number(amount), phone || undefined);
    setLoading(false);
    if (result.status === 'success') {
      toast({ title: 'Withdrawal Successful', description: `KES ${Number(amount).toLocaleString()} withdrawn. Ref: ${result.refId}` });
      setTimeout(() => {
        toast({ title: '📱 SMS Delivered', description: `M-Pesa withdrawal confirmation sent to ${phone || 'your number'} successfully.` });
      }, 1500);
      setAmount('');
      setPhone('');
      await refreshWallet();
    } else {
      toast({ title: 'Withdrawal Failed', description: result.message, variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-primary" />
            Withdraw Funds
          </CardTitle>
          <CardDescription>Withdraw to M-Pesa (Demo - simulated)</CardDescription>
        </CardHeader>
        <CardContent>
          {wallet && (
            <div className="mb-6 p-4 rounded-xl bg-secondary">
              <p className="text-xs text-muted-foreground">Available Balance</p>
              <p className="text-xl font-display font-bold text-foreground">
                KES {Number(wallet.balance).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div className="space-y-2">
              <Label>M-Pesa Phone Number (optional)</Label>
              <Input placeholder="e.g. 0712345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Amount (KES)</Label>
              <Input type="number" placeholder="0.00" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Processing...' : 'Withdraw'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default WithdrawPage;
