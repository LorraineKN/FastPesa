import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    setLoading(true);

    let email = identifier.trim();

    // If not an email, look up by username
    if (!email.includes('@')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', email.toLowerCase())
        .single();

      if (!profile) {
        setLoading(false);
        toast({ title: 'Login Failed', description: 'Username not found', variant: 'destructive' });
        return;
      }
      email = profile.email;
    }

    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      const msg = error.message.includes('Invalid login')
        ? 'Invalid username or passphrase'
        : error.message;
      toast({ title: 'Login Failed', description: msg, variant: 'destructive' });
    } else {
      console.log('User logged in successfully');
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
            <Wallet className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">InstantAid Pay</h1>
          <p className="text-muted-foreground mt-2">Your Kenyan Digital Wallet</p>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="font-display">Welcome Back</CardTitle>
            <CardDescription>Sign in with your email or username</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">Email or Username</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="you@example.com or your_username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Passphrase</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your passphrase"
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
              <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-medium hover:underline">
                Create Account
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
