import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut } from 'lucide-react';

const PublicHeader: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container flex items-center justify-between py-4">
        <button onClick={() => navigate('/')} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl text-foreground">InstantAid Pay</span>
        </button>
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-10 w-24 bg-muted animate-pulse rounded-lg" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Welcome, {user.user_metadata?.full_name?.split(' ')[0] || 'User'}
              </span>
              <Button variant="hero" onClick={() => navigate('/dashboard')}>Dashboard</Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/login')}>Sign In</Button>
              <Button variant="hero" onClick={() => navigate('/register')}>Get Started</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;
