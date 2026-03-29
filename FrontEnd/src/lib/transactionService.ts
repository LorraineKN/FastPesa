import { apiClient } from './apiClient';

export interface TransactionDTO {
  id: string;
  type: string;
  amount: number;
  fee: number;
  status: string;
  description: string;
  reference: string;
  phoneNumber?: string;
  paybillNumber?: string;
  accountNumber?: string;
  tillNumber?: string;
  mpesaReceipt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PageTransactionDTO {
  totalElements: number;
  totalPages: number;
  size: number;
  content: TransactionDTO[];
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

class TransactionService {
  async deposit(amount: number, description?: string): Promise<TransactionDTO> {
    console.log('[Transaction] Processing deposit', { amount, description });

    const response = await apiClient.post<TransactionDTO>('/api/transactions/deposit', {
      amount,
      description: description || 'Wallet deposit',
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Deposit failed');
    }

    console.log('[Transaction] Deposit successful', response.data.reference);
    return response.data;
  }

  async withdraw(amount: number, description?: string): Promise<TransactionDTO> {
    console.log('[Transaction] Processing withdrawal', { amount, description });

    const response = await apiClient.post<TransactionDTO>('/api/transactions/withdraw', {
      amount,
      description: description || 'Wallet withdrawal',
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Withdrawal failed');
    }

    console.log('[Transaction] Withdrawal successful', response.data.reference);
    return response.data;
  }

  async transfer(receiverWalletId: string, amount: number): Promise<TransactionDTO> {
    console.log('[Transaction] Processing transfer', { receiverWalletId, amount });

    const response = await apiClient.post<TransactionDTO>('/api/transactions/transfer', {
      receiverWalletId,
      amount,
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Transfer failed');
    }

    console.log('[Transaction] Transfer successful', response.data.reference);
    return response.data;
  }

  async getTransactions(page: number = 0, size: number = 10): Promise<PageTransactionDTO> {
    console.log('[Transaction] Fetching transactions', { page, size });

    const response = await apiClient.get<PageTransactionDTO>(
      `/api/transactions?page=${page}&size=${size}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch transactions');
    }

    return response.data;
  }

  // M-Pesa Operations
  async initiateStkPush(phoneNumber: string, amount: number): Promise<StkPushResponse> {
    console.log('[M-Pesa] Initiating STK Push', { phoneNumber, amount });

    const response = await apiClient.post<StkPushResponse>(
      `/api/transactions/mpesa/stk-push?phoneNumber=${phoneNumber}&amount=${amount}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'STK Push failed');
    }

    console.log('[M-Pesa] STK Push initiated', response.data.CheckoutRequestID);
    return response.data;
  }

  async processC2B(
    paybillNumber: string,
    accountNumber: string,
    phoneNumber: string,
    amount: number
  ): Promise<Record<string, any>> {
    console.log('[M-Pesa] Processing C2B', { paybillNumber, accountNumber, phoneNumber, amount });

    const response = await apiClient.post<Record<string, any>>(
      `/api/transactions/mpesa/c2b?paybillNumber=${paybillNumber}&accountNumber=${accountNumber}&phoneNumber=${phoneNumber}&amount=${amount}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'C2B transaction failed');
    }

    console.log('[M-Pesa] C2B processed successfully');
    return response.data;
  }

  async simulateC2B(
    paybillNumber: string,
    accountNumber: string,
    amount: number
  ): Promise<Record<string, any>> {
    console.log('[M-Pesa] Simulating C2B', { paybillNumber, accountNumber, amount });

    const response = await apiClient.post<Record<string, any>>(
      `/api/transactions/mpesa/c2b-simulate?paybillNumber=${paybillNumber}&accountNumber=${accountNumber}&amount=${amount}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'C2B simulation failed');
    }

    console.log('[M-Pesa] C2B simulated successfully');
    return response.data;
  }

  async processB2C(
    phoneNumber: string,
    amount: number,
    commandId: string = 'SalaryPayment',
    remarks?: string
  ): Promise<Record<string, any>> {
    console.log('[M-Pesa] Processing B2C', { phoneNumber, amount, commandId, remarks });

    let url = `/api/transactions/mpesa/b2c?phoneNumber=${phoneNumber}&amount=${amount}&commandId=${commandId}`;
    if (remarks) {
      url += `&remarks=${encodeURIComponent(remarks)}`;
    }

    const response = await apiClient.post<Record<string, any>>(url);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'B2C transaction failed');
    }

    console.log('[M-Pesa] B2C processed successfully');
    return response.data;
  }

  async simulateB2C(phoneNumber: string, amount: number): Promise<Record<string, any>> {
    console.log('[M-Pesa] Simulating B2C', { phoneNumber, amount });

    const response = await apiClient.post<Record<string, any>>(
      `/api/transactions/mpesa/b2c-simulate?phoneNumber=${phoneNumber}&amount=${amount}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'B2C simulation failed');
    }

    console.log('[M-Pesa] B2C simulated successfully');
    return response.data;
  }

  async processB2B(
    receiverShortcode: string,
    amount: number,
    accountReference: string
  ): Promise<Record<string, any>> {
    console.log('[M-Pesa] Processing B2B', { receiverShortcode, amount, accountReference });

    const response = await apiClient.post<Record<string, any>>(
      `/api/transactions/mpesa/b2b?receiverShortcode=${receiverShortcode}&amount=${amount}&accountReference=${accountReference}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'B2B transaction failed');
    }

    console.log('[M-Pesa] B2B processed successfully');
    return response.data;
  }

  async simulateB2B(receiverShortcode: string, amount: number): Promise<Record<string, any>> {
    console.log('[M-Pesa] Simulating B2B', { receiverShortcode, amount });

    const response = await apiClient.post<Record<string, any>>(
      `/api/transactions/mpesa/b2b-simulate?receiverShortcode=${receiverShortcode}&amount=${amount}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'B2B simulation failed');
    }

    console.log('[M-Pesa] B2B simulated successfully');
    return response.data;
  }

  formatKES(amount: number): string {
    return `Ksh${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
  }

  formatTimestamp(date: Date = new Date()): string {
    return date.toLocaleString('en-KE', {
      day: 'numeric',
      month: 'numeric',
      year: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
}

export const transactionService = new TransactionService();
