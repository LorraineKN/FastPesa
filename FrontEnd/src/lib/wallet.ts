import { supabase } from '@/integrations/supabase/client';
import { DEMO_MODE, simulateB2B, simulateC2B, simulateSTKPush } from '@/lib/mpesaService';

type AccountType = 'personal' | 'business';

export interface WalletSnapshot {
  id: string;
  user_id: string;
  wallet_name: string;
  balance: number;
  currency: string;
  is_active: boolean | null;
  is_demo_funded: boolean;
  created_at: string;
  updated_at: string;
}

export interface WalletResponse {
  status: 'success' | 'error';
  message?: string;
  ref?: string;
  newBalance?: number;
  receiverBalance?: number;
  wallet?: WalletSnapshot;
  fundedNow?: boolean;
  createdNow?: boolean;
  demoMode?: boolean;
}

function logRequest(label: string, payload: Record<string, unknown>) {
  console.log(`[Wallet API] ${label} request`, payload);
}

function logResponse(label: string, payload: unknown) {
  console.log(`[Wallet API] ${label} response`, payload);
}

export async function ensureDemoWallet(params: {
  userId: string;
  fullName?: string;
  email?: string;
  username?: string;
  accountType?: AccountType;
}) {
  const payload = {
    p_user_id: params.userId,
    p_full_name: params.fullName ?? null,
    p_email: params.email ?? null,
    p_username: params.username ?? null,
    p_account_type: params.accountType ?? 'personal',
  };

  logRequest('ensure_demo_wallet', payload);
  const { data, error } = await supabase.rpc('ensure_demo_wallet', payload);

  if (error) {
    console.error('[Wallet API] ensure_demo_wallet failed', error);
    throw error;
  }

  logResponse('ensure_demo_wallet', data);
  return data as { wallet: WalletSnapshot; fundedNow: boolean; createdNow: boolean; demoMode: boolean };
}

export async function getWalletSnapshot(userId: string) {
  const payload = { p_user_id: userId };
  logRequest('get_wallet_snapshot', payload);
  const { data, error } = await supabase.rpc('get_wallet_snapshot', payload);

  if (error) {
    console.error('[Wallet API] get_wallet_snapshot failed', error);
    throw error;
  }

  logResponse('get_wallet_snapshot', data);
  return data as WalletResponse;
}

export async function depositToWallet(userId: string, amount: number, description?: string) {
  const payload = {
    p_user_id: userId,
    p_amount: amount,
    p_description: description ?? 'Wallet deposit',
  };

  logRequest('process_deposit', payload);
  const { data, error } = await supabase.rpc('process_deposit', payload);

  if (error) {
    console.error('[Wallet API] process_deposit failed', error);
    throw error;
  }

  logResponse('process_deposit', data);
  return data as WalletResponse;
}

export async function withdrawFromWallet(userId: string, amount: number, phoneNumber?: string) {
  const payload = {
    p_user_id: userId,
    p_amount: amount,
    p_phone_number: phoneNumber ?? null,
    p_description: phoneNumber ? `M-Pesa withdrawal to ${phoneNumber}` : 'Wallet withdrawal',
  };

  logRequest('process_withdrawal', payload);
  const { data, error } = await supabase.rpc('process_withdrawal', payload);

  if (error) {
    console.error('[Wallet API] process_withdrawal failed', error);
    throw error;
  }

  logResponse('process_withdrawal', data);
  return data as WalletResponse;
}

export async function transferBetweenWallets(senderUserId: string, receiverWalletId: string, amount: number) {
  const payload = {
    p_sender_user_id: senderUserId,
    p_receiver_wallet_id: receiverWalletId,
    p_amount: amount,
  };

  logRequest('process_wallet_transfer', payload);
  const { data, error } = await supabase.rpc('process_wallet_transfer', payload);

  if (error) {
    console.error('[Wallet API] process_wallet_transfer failed', error);
    throw error;
  }

  logResponse('process_wallet_transfer', data);
  return data as WalletResponse;
}

export async function resolveWalletByUsername(username: string) {
  const cleanedUsername = username.trim().toLowerCase();
  logRequest('resolve_wallet_by_username', { username: cleanedUsername });

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_id, full_name, username')
    .eq('username', cleanedUsername)
    .single();

  if (profileError || !profile) {
    console.error('[Wallet API] resolve_wallet_by_username profile lookup failed', profileError);
    return null;
  }

  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('id, user_id')
    .eq('user_id', profile.user_id)
    .single();

  if (walletError || !wallet) {
    console.error('[Wallet API] resolve_wallet_by_username wallet lookup failed', walletError);
    return null;
  }

  const response = { walletId: wallet.id, userId: wallet.user_id, fullName: profile.full_name ?? profile.username ?? 'User' };
  logResponse('resolve_wallet_by_username', response);
  return response;
}

export async function processMpesaOperation(params: {
  userId: string;
  amount: number;
  type: 'mpesa_paybill' | 'mpesa_send_money' | 'mpesa_buy_goods';
  phoneNumber?: string;
  paybillNumber?: string;
  accountNumber?: string;
  tillNumber?: string;
}) {
  if (DEMO_MODE) {
    if (params.type === 'mpesa_paybill') {
      simulateC2B({ paybillNumber: params.paybillNumber, accountNumber: params.accountNumber, amount: params.amount });
    } else if (params.type === 'mpesa_send_money') {
      simulateSTKPush({ phoneNumber: params.phoneNumber, amount: params.amount });
    } else {
      simulateB2B({ tillNumber: params.tillNumber, amount: params.amount });
    }
  }

  const payload = {
    p_user_id: params.userId,
    p_amount: params.amount,
    p_type: params.type,
    p_phone_number: params.phoneNumber ?? null,
    p_paybill_number: params.paybillNumber ?? null,
    p_account_number: params.accountNumber ?? null,
    p_till_number: params.tillNumber ?? null,
  };

  logRequest('process_mpesa_transaction', payload);
  const { data, error } = await supabase.rpc('process_mpesa_transaction', payload);

  if (error) {
    console.error('[Wallet API] process_mpesa_transaction failed', error);
    throw error;
  }

  logResponse('process_mpesa_transaction', data);
  return data as WalletResponse;
}