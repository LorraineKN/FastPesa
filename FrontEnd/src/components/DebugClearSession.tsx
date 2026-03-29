import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export const DebugClearSession: React.FC = () => {
  const { clearSession, user } = useAuth();

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <div className="fixed top-4 right-4 z-50 p-4 bg-red-500 text-white rounded-lg shadow-lg">
      <h3 className="font-bold mb-2">Debug Session</h3>
      <p className="text-sm mb-2">Current User ID: {user?.id || 'None'}</p>
      <Button 
        onClick={clearSession}
        variant="secondary"
        size="sm"
        className="bg-white text-red-500 hover:bg-gray-100"
      >
        Clear Session & Reload
      </Button>
    </div>
  );
};
