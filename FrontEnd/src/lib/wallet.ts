import { walletService, WalletDTO } from './walletService';
import { transactionService } from './transactionService';

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
    day: 'numeric',
    month: 'numeric',
    year: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatKES(amount: number): string {
  return `Ksh${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
}

// Always fetch fresh wallet balance from backend
export async function getFreshWallet(walletId: string): Promise<WalletDTO | null> {
  try {
    const wallet = await walletService.getWalletById(walletId);
    console.log(`[Wallet] Fresh balance for ${walletId}: KES ${wallet.balance}`);
    return wallet;
  } catch (error) {
    console.error('Failed to fetch wallet:', error);
    return null;
  }
}

export async function getFreshActiveWallet(): Promise<WalletDTO | null> {
  try {
    const wallet = await walletService.getActiveWallet();
    console.log(`[Wallet] Fresh active wallet balance: KES ${wallet.balance}`);
    return wallet;
  } catch (error) {
    console.error('Failed to fetch active wallet:', error);
    return null;
  }
}

// Process a wallet-to-wallet transfer using backend API
export async function processWalletTransfer({
  recipientWalletId,
  amount,
}: {
  recipientWalletId: string;
  amount: number;
}): Promise<{ success: boolean; error?: string; refId?: string }> {
  try {
    if (amount <= 0) {
      return { success: false, error: 'Amount must be greater than zero' };
    }

    const transaction = await transactionService.transfer(recipientWalletId, amount);

    return {
      success: true,
      refId: transaction.reference,
    };
  } catch (error) {
    console.error('[Transfer] Failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transfer failed',
    };
  }
}

// Process deposit using backend API
export async function processDeposit({
  amount,
  description,
}: {
  amount: number;
  description?: string;
}): Promise<{ success: boolean; error?: string; refId?: string }> {
  try {
    if (amount <= 0) {
      return { success: false, error: 'Amount must be greater than zero' };
    }

    const transaction = await transactionService.deposit(amount, description);

    return {
      success: true,
      refId: transaction.reference,
    };
  } catch (error) {
    console.error('[Deposit] Failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Deposit failed',
    };
  }
}

// Process withdrawal using backend API
export async function processWithdrawal({
  amount,
  phoneNumber,
}: {
  amount: number;
  phoneNumber?: string;
}): Promise<{ success: boolean; error?: string; refId?: string }> {
  try {
    if (amount <= 0) {
      return { success: false, error: 'Amount must be greater than zero' };
    }

    const description = phoneNumber
      ? `M-Pesa withdrawal to ${phoneNumber}`
      : 'Wallet withdrawal';

    const transaction = await transactionService.withdraw(amount, description);

    return {
      success: true,
      refId: transaction.reference,
    };
  } catch (error) {
    console.error('[Withdraw] Failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Withdrawal failed',
    };
  }
}

// Process M-Pesa STK Push using backend API
export async function processMpesaStkPush({
  phoneNumber,
  amount,
}: {
  phoneNumber: string;
  amount: number;
}): Promise<{ success: boolean; error?: string; checkoutRequestId?: string }> {
  try {
    if (amount <= 0) {
      return { success: false, error: 'Amount must be greater than zero' };
    }

    const response = await transactionService.initiateStkPush(phoneNumber, amount);

    return {
      success: response.ResponseCode === '0',
      checkoutRequestId: response.CheckoutRequestID,
      error: response.ResponseCode !== '0' ? response.ResponseDescription : undefined,
    };
  } catch (error) {
    console.error('[STK Push] Failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'STK Push failed',
    };
  }
}

// Process M-Pesa C2B using backend API
export async function processMpesaC2B({
  paybillNumber,
  accountNumber,
  phoneNumber,
  amount,
}: {
  paybillNumber: string;
  accountNumber: string;
  phoneNumber: string;
  amount: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (amount <= 0) {
      return { success: false, error: 'Amount must be greater than zero' };
    }

    await transactionService.processC2B(paybillNumber, accountNumber, phoneNumber, amount);

    return { success: true };
  } catch (error) {
    console.error('[C2B] Failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'C2B transaction failed',
    };
  }
}

// Process M-Pesa B2C using backend API
export async function processMpesaB2C({
  phoneNumber,
  amount,
  commandId,
  remarks,
}: {
  phoneNumber: string;
  amount: number;
  commandId?: string;
  remarks?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (amount <= 0) {
      return { success: false, error: 'Amount must be greater than zero' };
    }

    await transactionService.processB2C(
      phoneNumber,
      amount,
      commandId || 'SalaryPayment',
      remarks
    );

    return { success: true };
  } catch (error) {
    console.error('[B2C] Failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'B2C transaction failed',
    };
  }
}

// Process M-Pesa B2B using backend API
export async function processMpesaB2B({
  receiverShortcode,
  amount,
  accountReference,
}: {
  receiverShortcode: string;
  amount: number;
  accountReference: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (amount <= 0) {
      return { success: false, error: 'Amount must be greater than zero' };
    }

    await transactionService.processB2B(receiverShortcode, amount, accountReference);

    return { success: true };
  } catch (error) {
    console.error('[B2B] Failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'B2B transaction failed',
    };
  }
}



// ===== COMPATIBILITY LAYER (fixes your import errors) =====

export async function getWalletSnapshot() {
  const wallet = await getFreshActiveWallet();
  return {
    status: wallet ? 'success' : 'error',
    wallet,
  };
}

export async function depositToWallet(amount: number) {
  return processDeposit({ amount });
}

export async function withdrawFromWallet(amount: number, phoneNumber?: string) {
  return processWithdrawal({ amount, phoneNumber });
}

export async function transferBetweenWallets(
  recipientWalletId: string,
  amount: number
) {
  return processWalletTransfer({ recipientWalletId, amount });
}

export async function resolveWalletByUsername(username: string) {
  try {
    const wallet = await walletService.getWalletByUsername(username);
    return wallet
      ? {
          walletId: wallet.id,
          userId: wallet.userId,
          fullName: wallet.walletName,
        }
      : null;
  } catch (e) {
    console.error('[Resolve Username] Failed:', e);
    return null;
  }
}

export async function processMpesaOperation(params: {
  amount: number;
  type: 'mpesa_paybill' | 'mpesa_send_money' | 'mpesa_buy_goods';
  phoneNumber?: string;
  paybillNumber?: string;
  accountNumber?: string;
  tillNumber?: string;
}) {
  switch (params.type) {
    case 'mpesa_send_money':
      return processMpesaStkPush({
        phoneNumber: params.phoneNumber!,
        amount: params.amount,
      });

    case 'mpesa_paybill':
      return processMpesaC2B({
        paybillNumber: params.paybillNumber!,
        accountNumber: params.accountNumber!,
        phoneNumber: params.phoneNumber!,
        amount: params.amount,
      });

    case 'mpesa_buy_goods':
      return processMpesaB2B({
        receiverShortcode: params.tillNumber!,
        amount: params.amount,
        accountReference: 'Payment',
      });

    default:
      throw new Error('Invalid M-Pesa operation');
  }
}