import { supabase } from '@/integrations/supabase/client';

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
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('id', walletId)
    .single();
  if (error || !data) {
    console.error('Failed to fetch wallet:', error);
    return null;
  }
  console.log(`[Wallet] Fresh balance for ${walletId}: KES ${data.balance}`);
  return data;
}

export async function getFreshWalletByUser(userId: string) {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error || !data) {
    console.error('Failed to fetch wallet by user:', error);
    return null;
  }
  console.log(`[Wallet] Fresh balance for user ${userId}: KES ${data.balance}`);
  return data;
}

// Create M-Pesa-style notification messages branded for InstantAid Pay
export async function createTransactionNotifications({
  refId,
  senderUserId,
  senderName,
  receiverUserId,
  receiverName,
  amount,
  senderNewBalance,
  receiverNewBalance,
  type,
  fee = 0,
}: {
  refId: string;
  senderUserId: string;
  senderName: string;
  receiverUserId?: string;
  receiverName?: string;
  amount: number;
  senderNewBalance: number;
  receiverNewBalance?: number;
  type: string;
  fee?: number;
}) {
  const ts = formatTimestamp();
  const notifications: any[] = [];

  const typeLabel = type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Sender notification — M-Pesa style
  let senderMsg: string;
  if (type === 'deposit') {
    senderMsg = `${refId} Confirmed. You have deposited ${formatKES(amount)} to your InstantAid wallet on ${ts}. New InstantAid balance is ${formatKES(senderNewBalance)}.`;
  } else if (type === 'withdrawal') {
    senderMsg = `${refId} Confirmed. ${formatKES(amount)} withdrawn from your InstantAid wallet on ${ts}. New InstantAid balance is ${formatKES(senderNewBalance)}. Transaction cost, ${formatKES(fee)}.`;
  } else if (receiverName) {
    senderMsg = `${refId} Confirmed. ${formatKES(amount)} sent to ${receiverName.toUpperCase()} on ${ts}. New InstantAid balance is ${formatKES(senderNewBalance)}. Transaction cost, ${formatKES(fee)}.`;
  } else {
    senderMsg = `${refId} Confirmed. ${formatKES(amount)} ${typeLabel.toLowerCase()} on ${ts}. New InstantAid balance is ${formatKES(senderNewBalance)}. Transaction cost, ${formatKES(fee)}.`;
  }

  notifications.push({
    user_id: senderUserId,
    type: 'transaction',
    title: `${typeLabel} - Sent`,
    message: senderMsg,
    reference: refId,
  });

  // Receiver notification — M-Pesa style
  if (receiverUserId && receiverNewBalance !== undefined) {
    const receiverMsg = `${refId} Confirmed. You have received ${formatKES(amount)} from ${senderName.toUpperCase()} on ${ts}. New InstantAid balance is ${formatKES(receiverNewBalance)}.`;
    notifications.push({
      user_id: receiverUserId,
      type: 'transaction',
      title: `${typeLabel} - Received`,
      message: receiverMsg,
      reference: refId,
    });
  }

  const { error } = await supabase.from('notifications').insert(notifications);
  if (error) {
    console.error('[Notifications] Insert failed:', error);
  } else {
    console.log(`[Notifications] ${notifications.length} notification(s) created for ${refId}`);
  }
}

// Process a wallet-to-wallet transfer with balance updates and notifications
export async function processWalletTransfer({
  senderUserId,
  senderWalletId,
  senderName,
  recipientWalletId,
  amount,
}: {
  senderUserId: string;
  senderWalletId: string;
  senderName: string;
  recipientWalletId: string;
  amount: number;
}): Promise<{ success: boolean; error?: string; refId?: string }> {
  if (amount <= 0) return { success: false, error: 'Amount must be greater than zero' };
  if (senderWalletId === recipientWalletId) return { success: false, error: 'Cannot transfer to the same wallet' };

  const senderWallet = await getFreshWallet(senderWalletId);
  if (!senderWallet) return { success: false, error: 'Failed to load your wallet' };

  const senderBalance = Number(senderWallet.balance);
  if (amount > senderBalance) return { success: false, error: 'Insufficient balance' };

  const { data: recipientWallet, error: rErr } = await supabase
    .from('wallets')
    .select('*')
    .eq('id', recipientWalletId)
    .single();

  if (rErr || !recipientWallet) return { success: false, error: 'Recipient wallet not found' };

  const refId = generateRefId();
  const newSenderBalance = senderBalance - amount;
  const newReceiverBalance = Number(recipientWallet.balance) + amount;

  const { data: receiverProfile } = await supabase
    .from('profiles')
    .select('full_name, user_id')
    .eq('user_id', recipientWallet.user_id)
    .single();

  const receiverName = receiverProfile?.full_name || 'Unknown';
  const receiverUserId = recipientWallet.user_id;

  // Update both wallets
  const [senderUpdate, receiverUpdate] = await Promise.all([
    supabase.from('wallets').update({ balance: newSenderBalance } as any).eq('id', senderWalletId),
    supabase.from('wallets').update({ balance: newReceiverBalance } as any).eq('id', recipientWalletId),
  ]);

  if (senderUpdate.error || receiverUpdate.error) {
    console.error('[Transfer] Wallet update failed:', senderUpdate.error, receiverUpdate.error);
    return { success: false, error: 'Failed to update wallets' };
  }

  console.log(`[Transfer] Wallet after: sender KES ${newSenderBalance}, receiver KES ${newReceiverBalance}`);

  // Create transaction records for both users
  const { error: txErr } = await supabase.from('transactions').insert([
    {
      user_id: senderUserId,
      sender_wallet_id: senderWalletId,
      receiver_wallet_id: recipientWalletId,
      type: 'wallet_transfer' as const,
      amount,
      status: 'completed' as const,
      description: `Transfer to ${receiverName}`,
      reference: refId,
    },
    {
      user_id: receiverUserId,
      sender_wallet_id: senderWalletId,
      receiver_wallet_id: recipientWalletId,
      type: 'wallet_transfer' as const,
      amount,
      status: 'completed' as const,
      description: `Received from ${senderName}`,
      reference: refId,
    },
  ] as any);

  if (txErr) console.error('[Transfer] Transaction insert failed:', txErr);

  // Create M-Pesa style notifications
  await createTransactionNotifications({
    refId,
    senderUserId,
    senderName,
    receiverUserId,
    receiverName,
    amount,
    senderNewBalance: newSenderBalance,
    receiverNewBalance: newReceiverBalance,
    type: 'wallet_transfer',
  });

  return { success: true, refId };
}

// Process deposit (demo mode - instant credit)
export async function processDeposit({
  userId,
  walletId,
  amount,
  userName,
}: {
  userId: string;
  walletId: string;
  amount: number;
  userName: string;
}): Promise<{ success: boolean; error?: string; refId?: string }> {
  if (amount <= 0) return { success: false, error: 'Amount must be greater than zero' };

  const wallet = await getFreshWallet(walletId);
  if (!wallet) return { success: false, error: 'Failed to load wallet' };

  const currentBalance = Number(wallet.balance);
  const refId = generateRefId();
  const newBalance = currentBalance + amount;

  const { error } = await supabase.from('wallets').update({ balance: newBalance } as any).eq('id', walletId);
  if (error) {
    console.error('[Deposit] Wallet update failed:', error);
    return { success: false, error: 'Failed to update wallet' };
  }

  await supabase.from('transactions').insert({
    user_id: userId,
    receiver_wallet_id: walletId,
    type: 'deposit' as const,
    amount,
    status: 'completed' as const,
    description: 'Wallet deposit',
    reference: refId,
  } as any);

  await createTransactionNotifications({
    refId,
    senderUserId: userId,
    senderName: userName,
    amount,
    senderNewBalance: newBalance,
    type: 'deposit',
  });

  return { success: true, refId };
}

// Process withdrawal (demo mode - instant debit)
export async function processWithdrawal({
  userId,
  walletId,
  amount,
  userName,
  phoneNumber,
}: {
  userId: string;
  walletId: string;
  amount: number;
  userName: string;
  phoneNumber?: string;
}): Promise<{ success: boolean; error?: string; refId?: string }> {
  if (amount <= 0) return { success: false, error: 'Amount must be greater than zero' };

  const wallet = await getFreshWallet(walletId);
  if (!wallet) return { success: false, error: 'Failed to load wallet' };

  const currentBalance = Number(wallet.balance);
  if (amount > currentBalance) return { success: false, error: 'Insufficient balance' };

  const refId = generateRefId();
  const newBalance = currentBalance - amount;

  const { error } = await supabase.from('wallets').update({ balance: newBalance } as any).eq('id', walletId);
  if (error) {
    console.error('[Withdraw] Wallet update failed:', error);
    return { success: false, error: 'Failed to update wallet' };
  }

  await supabase.from('transactions').insert({
    user_id: userId,
    sender_wallet_id: walletId,
    type: 'withdrawal' as const,
    amount,
    status: 'completed' as const,
    description: phoneNumber ? `M-Pesa withdrawal to ${phoneNumber}` : 'Wallet withdrawal',
    reference: refId,
    phone_number: phoneNumber || null,
  } as any);

  await createTransactionNotifications({
    refId,
    senderUserId: userId,
    senderName: userName,
    amount,
    senderNewBalance: newBalance,
    type: 'withdrawal',
  });

  return { success: true, refId };
}

// Process M-Pesa-style transactions (paybill, send money, buy goods) in demo mode
export async function processMpesaTransaction({
  userId,
  walletId,
  amount,
  userName,
  type,
  extra,
}: {
  userId: string;
  walletId: string;
  amount: number;
  userName: string;
  type: 'mpesa_paybill' | 'mpesa_send_money' | 'mpesa_buy_goods';
  extra: Record<string, string>;
}): Promise<{ success: boolean; error?: string; refId?: string }> {
  if (amount <= 0) return { success: false, error: 'Amount must be greater than zero' };

  const wallet = await getFreshWallet(walletId);
  if (!wallet) return { success: false, error: 'Failed to load wallet' };

  const currentBalance = Number(wallet.balance);
  if (amount > currentBalance) return { success: false, error: 'Insufficient balance' };

  const refId = generateRefId();
  const newBalance = currentBalance - amount;

  const { error } = await supabase.from('wallets').update({ balance: newBalance } as any).eq('id', walletId);
  if (error) {
    console.error(`[M-Pesa ${type}] Wallet update failed:`, error);
    return { success: false, error: 'Failed to update wallet' };
  }

  const desc = type === 'mpesa_paybill'
    ? `Paybill to ${extra.paybill_number} A/C ${extra.account_number}`
    : type === 'mpesa_send_money'
    ? `M-Pesa to ${extra.phone_number}`
    : `Buy Goods at Till ${extra.till_number}`;

  await supabase.from('transactions').insert({
    user_id: userId,
    sender_wallet_id: walletId,
    type,
    amount,
    status: 'completed' as const,
    description: desc,
    reference: refId,
    ...extra,
  } as any);

  // Simulate Daraja API response
  console.log(`[Daraja Simulation] STK Push: { ResultCode: 0, ResultDesc: "Success", MpesaReceiptNumber: "${refId}", TransactionDate: "${new Date().toISOString()}" }`);

  await createTransactionNotifications({
    refId,
    senderUserId: userId,
    senderName: userName,
    amount,
    senderNewBalance: newBalance,
    type,
  });

  return { success: true, refId };
}
