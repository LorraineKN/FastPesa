import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Send, ShoppingBag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getWalletSnapshot, processMpesaOperation } from '@/lib/wallet';

const MpesaPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [paybillNumber, setPaybillNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [paybillAmount, setPaybillAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [tillNumber, setTillNumber] = useState('');
  const [goodsAmount, setGoodsAmount] = useState('');

  const refreshWallet = async () => {
    if (!user) return;
    const walletResponse = await getWalletSnapshot(user.id);
    console.log('[M-Pesa] Wallet response', walletResponse);
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

  const balance = wallet ? Number(wallet.balance) : 0;

  const handleTransaction = async (type: 'mpesa_paybill' | 'mpesa_send_money' | 'mpesa_buy_goods', amount: number, extra: Record<string, string>) => {
    if (!wallet || !profile) return;
    setLoading(true);
    const result = await processMpesaOperation({
      userId: user!.id,
      amount,
      type,
      phoneNumber: extra.phone_number,
      paybillNumber: extra.paybill_number,
      accountNumber: extra.account_number,
      tillNumber: extra.till_number,
    });
    setLoading(false);

    if (result.status === 'success') {
      toast({ title: 'Transaction Successful', description: `KES ${amount.toLocaleString()} processed. Ref: ${result.refId}` });
      setTimeout(() => {
        toast({ title: '📱 SMS Delivered', description: `M-Pesa confirmation message sent successfully.` });
      }, 1500);
      setPaybillNumber(''); setAccountNumber(''); setPaybillAmount('');
      setPhoneNumber(''); setSendAmount('');
      setTillNumber(''); setGoodsAmount('');
      await refreshWallet();
    } else {
      toast({ title: 'Transaction Failed', description: result.message, variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      {wallet && (
        <div className="mb-6 p-4 rounded-xl gradient-primary">
          <p className="text-primary-foreground/70 text-xs">Available Balance</p>
          <p className="text-2xl font-display font-bold text-primary-foreground">
            KES {balance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </p>
        </div>
      )}

      <Tabs defaultValue="paybill" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="paybill" className="text-xs sm:text-sm">Paybill</TabsTrigger>
          <TabsTrigger value="send" className="text-xs sm:text-sm">Send Money</TabsTrigger>
          <TabsTrigger value="goods" className="text-xs sm:text-sm">Buy Goods</TabsTrigger>
        </TabsList>

        <TabsContent value="paybill">
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" /> Pay Bill
              </CardTitle>
              <CardDescription>Pay using Paybill number and account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleTransaction('mpesa_paybill', Number(paybillAmount), { paybill_number: paybillNumber, account_number: accountNumber }); }} className="space-y-4">
                <div className="space-y-2"><Label>Paybill Number</Label><Input placeholder="e.g. 247247" value={paybillNumber} onChange={(e) => setPaybillNumber(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Account Number</Label><Input placeholder="Enter account number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Amount (KES)</Label><Input type="number" placeholder="0.00" min="1" step="0.01" value={paybillAmount} onChange={(e) => setPaybillAmount(e.target.value)} required /></div>
                <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>{loading ? 'Processing...' : 'Pay Bill'}</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" /> Send Money
              </CardTitle>
              <CardDescription>Send money to a phone number via M-Pesa</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleTransaction('mpesa_send_money', Number(sendAmount), { phone_number: phoneNumber }); }} className="space-y-4">
                <div className="space-y-2"><Label>Phone Number</Label><Input placeholder="e.g. 0712345678" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Amount (KES)</Label><Input type="number" placeholder="0.00" min="1" step="0.01" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} required /></div>
                <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>{loading ? 'Sending...' : 'Send Money'}</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goods">
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" /> Buy Goods
              </CardTitle>
              <CardDescription>Pay a merchant using their Till number</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleTransaction('mpesa_buy_goods', Number(goodsAmount), { till_number: tillNumber }); }} className="space-y-4">
                <div className="space-y-2"><Label>Till Number</Label><Input placeholder="Enter till number" value={tillNumber} onChange={(e) => setTillNumber(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Amount (KES)</Label><Input type="number" placeholder="0.00" min="1" step="0.01" value={goodsAmount} onChange={(e) => setGoodsAmount(e.target.value)} required /></div>
                <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>{loading ? 'Processing...' : 'Buy Goods'}</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MpesaPage;
