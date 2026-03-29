import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Shield, Wallet } from 'lucide-react';

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('wallets').select('*').eq('user_id', user.id).single(),
      ]).then(([p, w]) => {
        if (p.data) {
          setProfile(p.data);
          setFullName(p.data.full_name);
          setPhone(p.data.phone || '');
        }
        if (w.data) setWallet(w.data);
      });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
      phone,
    }).eq('user_id', user!.id);
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profile Updated', description: 'Your changes have been saved' });
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Profile Settings
          </CardTitle>
          <CardDescription>Manage your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Username</Label>
            <Input value={profile?.username || ''} disabled className="bg-muted font-mono" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input placeholder="e.g. 0712345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Account Type</Label>
            <Input value={profile?.account_type || ''} disabled className="bg-muted capitalize" />
          </div>
          <Button onClick={handleSave} variant="hero" className="w-full" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Wallet Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {wallet && (
            <>
              <div>
                <p className="text-xs text-muted-foreground">Wallet ID</p>
                <p className="font-mono text-sm text-foreground select-all">{wallet.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Balance</p>
                <p className="text-lg font-display font-bold text-foreground">
                  KES {Number(wallet.balance).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Currency</p>
                <p className="text-sm text-foreground">{wallet.currency}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Account verified: <span className={profile?.is_verified ? 'text-success' : 'text-warning'}>{profile?.is_verified ? 'Yes' : 'Pending'}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Wallet status: <span className={wallet?.is_active ? 'text-success' : 'text-destructive'}>{wallet?.is_active ? 'Active' : 'Inactive'}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
