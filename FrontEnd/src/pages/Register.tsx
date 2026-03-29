import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Eye, EyeOff, User, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function generateDemoEmail(username: string): string {
  const rand = Math.random().toString(36).substring(2, 8);
  return `${username.toLowerCase()}_${rand}@instantaid.demo`;
}

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState<'personal' | 'business'>('personal');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast({ title: 'Error', description: 'Username is required', variant: 'destructive' });
      return;
    }
    if (username.trim().length < 3) {
      toast({ title: 'Error', description: 'Username must be at least 3 characters', variant: 'destructive' });
      return;
    }
    if (password.length < 8) {
      toast({ title: 'Error', description: 'Passphrase must be at least 8 characters', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Error', description: 'Passphrases do not match', variant: 'destructive' });
      return;
    }

    const displayName = fullName.trim() || username.trim();
    const finalEmail = email.trim() || generateDemoEmail(username.trim());

    setLoading(true);
    const { error, session } = await signUp(finalEmail, password, username.trim().toLowerCase(), displayName, accountType);
    setLoading(false);

    if (error) {
      const msg = error.message.includes('already registered')
        ? 'This email is already in use. Try a different one or sign in.'
        : error.message;
      toast({ title: 'Registration Failed', description: msg, variant: 'destructive' });
    } else if (session) {
      // Update profile with the chosen username and optional phone
      const { supabase } = await import('@/integrations/supabase/client');
      const { error: profileError } = await supabase.from('profiles').update({
        username: username.trim().toLowerCase(),
        full_name: displayName,
        email: finalEmail,
        phone: phone.trim() || null,
      }).eq('user_id', session.user.id);

      if (profileError) {
        console.error('[Register] Profile update failed', profileError);
      }

      console.log('[Register] User registered successfully - auto login');
      toast({
        title: 'Welcome to InstantAid Pay! 🎉',
        description: `Account ready with KES 10,000 demo balance. Username: @${username.trim().toLowerCase()}`,
      });
      navigate('/dashboard');
    } else {
      toast({
        title: 'Account Created! 🎉',
        description: 'Your account is ready. Please sign in.',
      });
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
            <Wallet className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground mt-2">Join InstantAid Pay today</p>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="font-display">Choose Account Type</CardTitle>
            <CardDescription>Select the type of account you need</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setAccountType('personal')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  accountType === 'personal'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <User className={`w-6 h-6 ${accountType === 'personal' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium ${accountType === 'personal' ? 'text-primary' : 'text-muted-foreground'}`}>
                  Personal
                </span>
              </button>
              <button
                type="button"
                onClick={() => setAccountType('business')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  accountType === 'business'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <Building2 className={`w-6 h-6 ${accountType === 'business' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium ${accountType === 'business' ? 'text-primary' : 'text-muted-foreground'}`}>
                  Business
                </span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username <span className="text-destructive">*</span></Label>
                <Input
                  id="username"
                  placeholder="e.g. john_kamau"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  required
                  minLength={3}
                />
                <p className="text-xs text-muted-foreground">Letters, numbers, and underscores only</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  id="fullName"
                  placeholder="John Kamau"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+254 7XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Passphrase</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Passphrase</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat your passphrase"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Sign In
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
