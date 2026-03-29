import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Calendar, Shield, Wallet, Edit2, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  username: string | null;
  phone: string | null;
  account_type: 'personal' | 'business';
  business_name: string | null;
  is_verified: boolean | null;
  created_at: string;
  updated_at: string;
}

interface WalletData {
  id: string;
  wallet_name: string;
  balance: number;
  currency: string;
  is_demo_funded: boolean;
}

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    username: '',
    phone: ''
  });

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // Get profile
      const profileData = await apiClient
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      // Get wallet
      const walletData = await apiClient.rpc('get_wallet_snapshot', {
        p_user_id: user!.id
      });

      if (profileData) {
        setProfile(profileData);
        setEditForm({
          full_name: profileData.full_name,
          username: profileData.username || '',
          phone: profileData.phone || ''
        });
      }

      if (walletData?.wallet) {
        setWallet(walletData.wallet);
      }

    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const error = await apiClient
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          username: editForm.username || null,
          phone: editForm.phone || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user!.id);

      if (error) {
        console.error('Update error:', error);
        return;
      }

      setEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const formatAmount = (amount: number) => `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-display">Profile</h1>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>

      {profile && (
        <>
          {/* Profile Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              {!editing ? (
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                  {editing ? (
                    <Input
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.full_name}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{profile.email}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Username</Label>
                  {editing ? (
                    <Input
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      placeholder="@username"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">@</span>
                      <span>{profile.username || 'Not set'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                  {editing ? (
                    <Input
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="+254 XXX XXX XXX"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.phone || 'Not set'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Account Type</Label>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <Badge variant={profile.account_type === 'business' ? 'default' : 'secondary'}>
                      {profile.account_type.charAt(0).toUpperCase() + profile.account_type.slice(1)}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{new Date(profile.created_at).toLocaleDateString('en-KE', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                </div>
              </div>

              {profile.business_name && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Business Name</Label>
                  <div className="flex items-center gap-2">
                    <span>{profile.business_name}</span>
                  </div>
                </div>
              )}

              {profile.is_verified !== null && (
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <Badge variant={profile.is_verified ? 'default' : 'secondary'}>
                    {profile.is_verified ? 'Verified' : 'Not Verified'}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Wallet Card */}
          {wallet && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Wallet Information
                </CardTitle>
                <Badge variant={wallet.is_demo_funded ? 'default' : 'secondary'}>
                  {wallet.is_demo_funded ? 'Demo Mode' : 'Live'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Wallet ID</Label>
                    <div className="font-mono text-sm bg-secondary p-2 rounded">
                      {wallet.id}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Wallet Name</Label>
                    <div>{wallet.wallet_name}</div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Balance</Label>
                    <div className="text-2xl font-bold text-primary">
                      {formatAmount(wallet.balance)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Currency</Label>
                    <div>{wallet.currency}</div>
                  </div>
                </div>

                {wallet.is_demo_funded && (
                  <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5">
                    <p className="text-sm font-medium text-foreground">Demo Mode Active</p>
                    <p className="text-xs text-muted-foreground">
                      This wallet is funded with demo money for testing purposes.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default ProfilePage;
