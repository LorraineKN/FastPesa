const axios = require('axios');
const crypto = require('crypto');
const env = require('../config/env');
const logger = require('../utils/logger');

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