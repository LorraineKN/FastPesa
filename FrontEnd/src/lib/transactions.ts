import { apiClient } from '@/lib/api';

// Generate unique reference like TX-09814F3571
export function generateRefId(): string {
  const chars = '0123456789ABCDEF';
  let id = 'TX-';
  for (let i = 0; i < 10; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export function formatTimestamp(date: Date = new Date()): string {
  return date.toLocaleString('en-KE', {
    day: 'numeric', month: 'numeric', year: '2-digit',
    hour: 'numeric', minute: '2-digit',
    hour12: true,
  });
}

export function formatKES(amount: number): string {
  return `Ksh${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
}

// Always fetch fresh wallet balance from DB
export async function getFreshWallet(walletId: string) {
  try {
    const data = await apiClient
      .from('wallets')
      .select('*')
      .eq('id', walletId)
      .single();
    
    if (!data) {
      console.error('Failed to fetch wallet: No data returned');
      return null;
    }
    
    console.log(`[Wallet] Fresh balance for ${walletId}: KES ${data.balance}`);
    return data;
  } catch (error) {
    console.error('Failed to fetch wallet:', error);
    return null;
  }
}

export async function getFreshWalletByUser(userId: string) {
  try {
    const data = await apiClient
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (!data) {
      console.error('Failed to fetch wallet by user: No data returned');
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to fetch wallet by user:', error);
    return null;
  }
}

// Create transaction record
export async function createTransaction(params: {
  user_id: string;
  type: string;
  amount: number;
  status: string;
  description?: string;
  reference?: string;
  recipient_id?: string;
  sender_wallet_id?: string;
  recipient_wallet_id?: string;
  metadata?: Record<string, any>;
}) {
  try {
    const result = await apiClient.from('transactions').insert({
      user_id: params.user_id,
      type: params.type,
      amount: params.amount,
      status: params.status,
      description: params.description,
      reference: params.reference || generateRefId(),
      recipient_id: params.recipient_id,
      sender_wallet_id: params.sender_wallet_id,
      recipient_wallet_id: params.recipient_wallet_id,
      metadata: params.metadata,
    });

    if (!result) {
      throw new Error('Failed to create transaction');
    }

    return result;
  } catch (error) {
    console.error('Create transaction error:', error);
    throw error;
  }
}

// Update transaction status
export async function updateTransactionStatus(transactionId: string, status: string, metadata?: Record<string, any>) {
  try {
    const result = await apiClient
      .from('transactions')
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...(metadata && { metadata }),
      })
      .eq('id', transactionId);

    if (!result) {
      throw new Error('Failed to update transaction');
    }

    return result;
  } catch (error) {
    console.error('Update transaction error:', error);
    throw error;
  }
}

// Get user transactions
export async function getUserTransactions(userId: string, limit = 50, offset = 0) {
  try {
    const data = await apiClient
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data;
  } catch (error) {
    console.error('Get transactions error:', error);
    return [];
  }
}

// Create notification
export async function createNotification(params: {
  user_id: string;
  title: string;
  message: string;
  type: string;
  reference?: string;
  is_read?: boolean;
}) {
  try {
    const result = await apiClient.from('notifications').insert({
      user_id: params.user_id,
      title: params.title,
      message: params.message,
      type: params.type,
      reference: params.reference,
      is_read: params.is_read || false,
    });

    if (!result) {
      throw new Error('Failed to create notification');
    }

    return result;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
}

// Get user notifications
export async function getUserNotifications(userId: string, unreadOnly = false) {
  try {
    let query = apiClient
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const data = await query;

    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data;
  } catch (error) {
    console.error('Get notifications error:', error);
    return [];
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  try {
    const result = await apiClient
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    return result;
  } catch (error) {
    console.error('Mark notification as read error:', error);
    throw error;
  }
}

// Get user profile
export async function getUserProfile(userId: string) {
  try {
    const data = await apiClient
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    return data;
  } catch (error) {
    console.error('Get user profile error:', error);
    return null;
  }
}

// Update user profile
export async function updateUserProfile(userId: string, updates: {
  full_name?: string;
  username?: string;
  phone?: string;
  business_name?: string;
}) {
  try {
    const result = await apiClient
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (!result) {
      throw new Error('Failed to update profile');
    }

    return result;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
}
