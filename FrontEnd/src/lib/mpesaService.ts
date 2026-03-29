import { transactionService } from './transactionService';

// Set to false to use real backend API calls
export const DEMO_MODE = false;

type SimulationPayload = Record<string, unknown>;

// Real STK Push using backend API
export async function initiateSTKPush(params: {
  phoneNumber: string;
  amount: number;
}): Promise<any> {
  console.log('[M-Pesa] Initiating real STK Push', params);

  try {
    const response = await transactionService.initiateStkPush(
      params.phoneNumber,
      params.amount
    );

    console.log('[M-Pesa] STK Push response:', response);
    return response;
  } catch (error) {
    console.error('[M-Pesa] STK Push failed:', error);
    throw error;
  }
}

// Real C2B using backend API
export async function processC2B(params: {
  paybillNumber: string;
  accountNumber: string;
  phoneNumber: string;
  amount: number;
}): Promise<any> {
  console.log('[M-Pesa] Processing real C2B', params);

  try {
    const response = await transactionService.processC2B(
      params.paybillNumber,
      params.accountNumber,
      params.phoneNumber,
      params.amount
    );

    console.log('[M-Pesa] C2B response:', response);
    return response;
  } catch (error) {
    console.error('[M-Pesa] C2B failed:', error);
    throw error;
  }
}

// Real B2C using backend API
export async function processB2C(params: {
  phoneNumber: string;
  amount: number;
  commandId?: string;
  remarks?: string;
}): Promise<any> {
  console.log('[M-Pesa] Processing real B2C', params);

  try {
    const response = await transactionService.processB2C(
      params.phoneNumber,
      params.amount,
      params.commandId || 'SalaryPayment',
      params.remarks
    );

    console.log('[M-Pesa] B2C response:', response);
    return response;
  } catch (error) {
    console.error('[M-Pesa] B2C failed:', error);
    throw error;
  }
}

// Real B2B using backend API
export async function processB2B(params: {
  receiverShortcode: string;
  amount: number;
  accountReference: string;
}): Promise<any> {
  console.log('[M-Pesa] Processing real B2B', params);

  try {
    const response = await transactionService.processB2B(
      params.receiverShortcode,
      params.amount,
      params.accountReference
    );

    console.log('[M-Pesa] B2B response:', response);
    return response;
  } catch (error) {
    console.error('[M-Pesa] B2B failed:', error);
    throw error;
  }
}

// Simulate functions (for testing/demo purposes)
export function simulateSTKPush(payload: SimulationPayload) {
  const response = {
    CheckoutRequestID: `ws_CO_${Date.now()}`,
    MerchantRequestID: `mr_${Date.now()}`,
    ResponseCode: '0',
    ResponseDescription: 'Demo STK push accepted',
    CustomerMessage: 'Success. Request accepted for processing.',
    payload,
  };

  console.log('[M-Pesa Demo] simulateSTKPush', response);
  return response;
}

export function simulateC2B(payload: SimulationPayload) {
  const response = {
    ConversationID: `c2b_${Date.now()}`,
    OriginatorConversationID: `oc2b_${Date.now()}`,
    ResponseCode: '0',
    ResponseDescription: 'Demo C2B request processed successfully',
    payload,
  };

  console.log('[M-Pesa Demo] simulateC2B', response);
  return response;
}

export function simulateB2B(payload: SimulationPayload) {
  const response = {
    ConversationID: `b2b_${Date.now()}`,
    OriginatorConversationID: `ob2b_${Date.now()}`,
    ResponseCode: '0',
    ResponseDescription: 'Demo B2B request processed successfully',
    payload,
  };

  console.log('[M-Pesa Demo] simulateB2B', response);
  return response;
}
