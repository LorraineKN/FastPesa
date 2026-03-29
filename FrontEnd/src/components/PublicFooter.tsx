import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';

const PublicFooter: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-border py-8">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          <span className="font-display font-semibold text-foreground">FastPesa</span>
        </div>
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Button variant="link" size="sm" onClick={() => navigate('/')} className="text-muted-foreground">Home</Button>
          <Button variant="link" size="sm" onClick={() => navigate('/about')} className="text-muted-foreground">About</Button>
          <Button variant="link" size="sm" onClick={() => navigate('/terms')} className="text-muted-foreground">Terms</Button>
          <Button variant="link" size="sm" onClick={() => navigate('/privacy')} className="text-muted-foreground">Privacy</Button>
        </div>
        <p className="text-sm text-muted-foreground">© 2026 FastPesa. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default PublicFooter;
