import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, MailOpen, Bell } from 'lucide-react';

const InboxPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    const data = await apiClient
      .from('notifications')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (data && Array.isArray(data)) setNotifications(data);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await apiClient.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    // Note: Custom API doesn't support 'in' operator, so we'll mark them individually
    for (const id of unreadIds) {
      await apiClient.from('notifications').update({ is_read: true }).eq('id', id);
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-secondary animate-pulse rounded-xl" />)}</div>;
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="font-display flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Inbox
            </CardTitle>
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No messages yet. Your transaction confirmations will appear here.</p>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markAsRead(n.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                    n.is_read
                      ? 'border-border bg-card'
                      : 'border-primary/30 bg-primary/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      n.is_read ? 'bg-muted' : 'bg-primary/10'
                    }`}>
                      {n.is_read ? <MailOpen className="w-4 h-4 text-muted-foreground" /> : <Mail className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-medium ${n.is_read ? 'text-foreground' : 'text-primary'}`}>
                          {n.title}
                        </p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(n.created_at).toLocaleString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 font-mono leading-relaxed">
                        {n.message}
                      </p>
                      {n.reference && (
                        <span className="inline-block text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded mt-2 font-mono">
                          {n.reference}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InboxPage;
