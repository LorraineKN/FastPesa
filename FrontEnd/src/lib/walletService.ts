import { apiClient } from './apiClient';

export interface WalletDTO {
  id: string;
  userId: string;
  walletName: string;
  balance: number;
  currency: string;
  isActive: boolean;
  isDemoFunded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WalletResponse {
  status: 'success' | 'error';
  message?: string;
  ref?: string;
  newBalance?: number;
  receiverBalance?: number;
  wallet?: WalletDTO;
}

class WalletService {
  async getActiveWallet(): Promise<WalletDTO> {
    console.log('[Wallet] Fetching active wallet');

    const response = await apiClient.get<WalletDTO>('/wallets/active');

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch active wallet');
    }

    console.log('[Wallet] Active wallet balance:', response.data.balance);
    return response.data;
  }

  async getWalletById(walletId: string): Promise<WalletDTO> {
    console.log('[Wallet] Fetching wallet by ID', { walletId });

    const response = await apiClient.get<WalletDTO>(`/wallets/${walletId}`);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch wallet');
    }

    return response.data;
  }

  async getUserWallets(): Promise<WalletDTO[]> {
    console.log('[Wallet] Fetching all user wallets');

    const response = await apiClient.get<WalletDTO[]>('/wallets/list');

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch wallets');
    }

    return response.data;
  }

  async fundDemoWallet(amount: number): Promise<WalletDTO> {
    console.log('[Wallet] Funding demo wallet', { amount });

    const response = await apiClient.post<WalletDTO>(`/wallets/demo-fund?amount=${amount}`);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fund demo wallet');
    }

    console.log('[Wallet] Demo wallet funded, new balance:', response.data.balance);
    return response.data;
  }

  async getWalletSnapshot(userId: string): Promise<WalletResponse> {
    try {
      const wallet = await this.getActiveWallet();
      return {
        status: 'success',
        wallet: wallet,
        newBalance: wallet.balance,
      };
    } catch (error) {
      console.error('[Wallet] Failed to get wallet snapshot', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch wallet',
      };
    }
  }

  formatKES(amount: number): string {
    return `Ksh${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
  }
}

export const walletService = new WalletService();