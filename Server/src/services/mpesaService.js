const axios = require('axios');
const crypto = require('crypto');
const env = require('../config/env');
const logger = require('../utils/logger');
const { Pool } = require('pg');

// Database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/emergency_wallet'
});

// Demo mode flag - set to true for development/testing
const DEMO_MODE = process.env.MPESA_DEMO_MODE !== 'false';

/**
 * Generate M-Pesa transaction reference
 */
const generateMpesaReference = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `MJ${timestamp.toString().slice(-6)}${random}`;
};

/**
 * Simulate C2B (Customer to Business) transaction
 */
const simulateC2B = ({ paybillNumber, accountNumber, amount }) => {
  if (!DEMO_MODE) return;

  const reference = generateMpesaReference();
  logger.info(`[M-Pesa Demo] C2B Simulation:`, {
    paybillNumber,
    accountNumber,
    amount,
    reference
  });

  // Simulate SMS confirmation
  setTimeout(() => {
    logger.info(`[M-Pesa Demo] SMS: KES ${amount} paid to ${paybillNumber} Account ${accountNumber}. Ref: ${reference}`);
  }, 2000);
};

/**
 * Simulate B2C (Business to Customer) transaction
 */
const simulateB2C = ({ tillNumber, amount }) => {
  if (!DEMO_MODE) return;

  const reference = generateMpesaReference();
  logger.info(`[M-Pesa Demo] B2C Simulation:`, {
    tillNumber,
    amount,
    reference
  });

  // Simulate SMS confirmation
  setTimeout(() => {
    logger.info(`[M-Pesa Demo] SMS: KES ${amount} paid to Till ${tillNumber}. Ref: ${reference}`);
  }, 2000);
};

/**
 * Simulate STK Push transaction
 */
const simulateSTKPush = ({ phoneNumber, amount }) => {
  if (!DEMO_MODE) return;

  const reference = generateMpesaReference();
  logger.info(`[M-Pesa Demo] STK Push Simulation:`, {
    phoneNumber,
    amount,
    reference
  });

  // Simulate STK push prompt
  setTimeout(() => {
    logger.info(`[M-Pesa Demo] STK Push: Enter PIN to send KES ${amount} to ${phoneNumber}`);
  }, 1000);

  // Simulate SMS confirmation
  setTimeout(() => {
    logger.info(`[M-Pesa Demo] SMS: KES ${amount} sent to ${phoneNumber}. Ref: ${reference}`);
  }, 3000);
};

class MpesaService {
  constructor() {
    this.consumerKey = env.MPESA_CONSUMER_KEY;
    this.consumerSecret = env.MPESA_CONSUMER_SECRET;
    this.passkey = env.MPESA_PASSKEY;
    this.shortcode = env.MPESA_SHORTCODE;
    this.environment = env.MPESA_ENV;
    this.baseURL = this.environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry > Date.now()) return this.accessToken;
    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
    const response = await axios.get(`${this.baseURL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    this.accessToken = response.data.access_token;
    this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
    return this.accessToken;
  }

  async stkPush(phoneNumber, amount) {
    // Check if we're in test mode (no real credentials)
    if (!this.consumerKey || !this.consumerSecret || this.consumerKey === 'your_consumer_key') {
      logger.info('Using mock STK Push for testing');
      return {
        CheckoutRequestID: `MOCK_${Date.now()}`,
        MerchantRequestID: `MOCK_MERCHANT_${Date.now()}`,
        ResponseCode: '0',
        ResponseDescription: 'Success. Request accepted for processing',
        CustomerMessage: 'Mock STK Push initiated successfully'
      };
    }

    const token = await this.getAccessToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');

    const data = {
      BusinessShortCode: this.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: this.shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: `${env.CALLBACK_BASE_URL || 'https://your-domain.com'}/api/mpesa/callback`,
      AccountReference: 'EmergencyWallet',
      TransactionDesc: 'Wallet recharge',
    };

    const response = await axios.post(`${this.baseURL}/mpesa/stkpush/v1/processrequest`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    logger.info('STK Push response', response.data);
    return response.data;
  }

  async b2c(phoneNumber, amount, transactionId) {
    const token = await this.getAccessToken();
    const data = {
      InitiatorName: 'testapi',
      SecurityCredential: 'placeholder_encrypted_credential', // would require actual encryption
      CommandID: 'BusinessPayment',
      Amount: amount,
      PartyA: this.shortcode,
      PartyB: phoneNumber,
      Remarks: `EmergencyWallet payment ${transactionId}`,
      QueueTimeOutURL: `${env.CALLBACK_BASE_URL}/mpesa/timeout`,
      ResultURL: `${env.CALLBACK_BASE_URL}/mpesa/b2c-result`,
      Occasion: 'Payment',
    };
    // In sandbox you may mock this call
    logger.warn('B2C not fully implemented – mock response');
    return { ConversationID: 'mock', ResponseCode: '0', ResponseDescription: 'Success' };
  }
}

module.exports = new MpesaService();

// Export additional functions for frontend compatibility
module.exports.DEMO_MODE = DEMO_MODE;
module.exports.simulateC2B = simulateC2B;
module.exports.simulateB2C = simulateB2C;
module.exports.simulateSTKPush = simulateSTKPush;
module.exports.generateMpesaReference = generateMpesaReference;