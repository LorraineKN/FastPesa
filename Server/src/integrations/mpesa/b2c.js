const axios = require('axios');
const env = require('../../config/env');
const logger = require('../../utils/logger');

class B2C {
  constructor() {
    this.consumerKey = env.MPESA_CONSUMER_KEY;
    this.consumerSecret = env.MPESA_CONSUMER_SECRET;
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

  async send(phoneNumber, amount, transactionId, remarks = 'EmergencyWallet payment') {
    const token = await this.getAccessToken();
    
    const data = {
      InitiatorName: process.env.MPESA_INITIATOR_NAME || 'testapi',
      SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL || 'placeholder_encrypted_credential',
      CommandID: 'BusinessPayment',
      Amount: amount,
      PartyA: this.shortcode,
      PartyB: phoneNumber,
      Remarks: `${remarks} ${transactionId}`,
      QueueTimeOutURL: `${process.env.CALLBACK_BASE_URL}/mpesa/timeout`,
      ResultURL: `${process.env.CALLBACK_BASE_URL}/mpesa/b2c-result`,
      Occasion: 'Payment',
    };

    if (this.environment === 'sandbox') {
      logger.warn('B2C in sandbox mode - returning mock response');
      return { 
        ConversationID: `mock_${Date.now()}`, 
        ResponseCode: '0', 
        ResponseDescription: 'Success - Mock Response' 
      };
    }

    const response = await axios.post(`${this.baseURL}/mpesa/b2c/v1/paymentrequest`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    logger.info('B2C payment initiated', response.data);
    return response.data;
  }
}

module.exports = new B2C();
