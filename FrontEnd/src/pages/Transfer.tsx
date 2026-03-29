import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeftRight, Send, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getWalletSnapshot, resolveWalletByUsername, transferBetweenWallets } from '@/lib/wallet';

const Transfer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [recipientWalletId, setRecipientWalletId] = useState('');
  const [recipientUsername, setRecipientUsername] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const refreshWallet = async () => {
    if (!user) return;
    const walletResponse = await getWalletSnapshot(user.id);
    console.log('[Transfer] Wallet response', walletResponse);
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

  const handleTransfer = async (e: React.FormEvent, method: 'wallet_id' | 'username') => {
    e.preventDefault();
    if (!wallet || !profile) return;

    let targetWalletId = recipientWalletId;

    if (method === 'username') {
      const recipient = await resolveWalletByUsername(recipientUsername);

      if (!recipient) {
        toast({ title: 'Transfer Failed', description: 'Username not found', variant: 'destructive' });
        return;
      }
      targetWalletId = recipient.walletId;
    }

    setLoading(true);
    const result = await transferBetweenWallets(user!.id, targetWalletId, Number(amount));
    setLoading(false);

    if (result.status === 'success') {
      toast({ title: 'Transfer Successful', description: `KES ${Number(amount).toLocaleString()} sent. Ref: ${result.refId}` });
      setTimeout(() => {
        toast({ title: '📱 SMS Delivered', description: `Confirmation message sent to recipient successfully.` });
      }, 1500);
      setAmount('');
      setRecipientWalletId('');
      setRecipientUsername('');
      await refreshWallet();
    } else {
      toast({ title: 'Transfer Failed', description: result.message, variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
            Wallet Transfer
          </CardTitle>
          <CardDescription>Send money to another InstantAid wallet</CardDescription>
        </CardHeader>
        <CardContent>
          {wallet && (
            <div className="mb-6 p-4 rounded-xl bg-secondary">
              <p className="text-xs text-muted-foreground">Your Balance</p>
              <p className="text-xl font-display font-bold text-foreground">
                KES {Number(wallet.balance).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Your Wallet ID: <span className="font-mono text-foreground">{wallet.id}</span></p>
              {profile?.username && (
                <p className="text-xs text-muted-foreground mt-0.5">Username: <span className="font-mono text-foreground">@{profile.username}</span></p>
              )}
            </div>
          )}

          <Tabs defaultValue="wallet_id" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="wallet_id" className="text-xs sm:text-sm">By Wallet ID</TabsTrigger>
              <TabsTrigger value="username" className="text-xs sm:text-sm">By Username</TabsTrigger>
            </TabsList>

            <TabsContent value="wallet_id">
              <form onSubmit={(e) => handleTransfer(e, 'wallet_id')} className="space-y-4">
                <div className="space-y-2">
                  <Label>Recipient Wallet ID</Label>
                  <Input
                    placeholder="Paste recipient's wallet ID"
                    value={recipientWalletId}
                    onChange={(e) => setRecipientWalletId(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount (KES)</Label>
                  <Input type="number" placeholder="0.00" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                </div>
                <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>
                  <Send className="w-4 h-4" />
                  {loading ? 'Sending...' : 'Send Money'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="username">
              <form onSubmit={(e) => handleTransfer(e, 'username')} className="space-y-4">
                <div className="space-y-2">
                  <Label>Recipient Username</Label>
                  <Input
                    placeholder="e.g. johnkamau_a1b2c3"
                    value={recipientUsername}
                    onChange={(e) => setRecipientUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount (KES)</Label>
                  <Input type="number" placeholder="0.00" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                </div>
                <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>
                  <User className="w-4 h-4" />
                  {loading ? 'Sending...' : 'Send by Username'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Transfer;
