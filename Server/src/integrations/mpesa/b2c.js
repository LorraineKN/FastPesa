const axios = require('axios');
const env = require('../../config/env');
const logger = require('../../utils/logger');
const MpesaSecurity = require('../../utils/mpesaSecurity');

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
    
    // Get SecurityCredential
    let securityCredential;
    try {
      if (env.MPESA_ENV === 'sandbox') {
        securityCredential = 'sandbox_mock_security_credential';
      } else {
        // For production, use the provided SecurityCredential
        securityCredential = process.env.MPESA_SECURITY_CREDENTIAL || 'placeholder_encrypted_credential';
        
        // Validate SecurityCredential format
        if (!MpesaSecurity.validateSecurityCredential(securityCredential)) {
          throw new Error('Invalid SecurityCredential format. Please check your MPESA_SECURITY_CREDENTIAL environment variable.');
        }
      }
    } catch (error) {
      logger.error('SecurityCredential validation failed:', error);
      throw new Error('Failed to validate SecurityCredential');
    }
    
    const data = {
      InitiatorName: process.env.MPESA_INITIATOR_NAME || 'testapi',
      SecurityCredential: securityCredential,
      CommandID: 'BusinessPayment',
      Amount: amount,
      PartyA: this.shortcode,
      PartyB: phoneNumber,
      Remarks: `${remarks} ${transactionId}`,
      QueueTimeOutURL: `${process.env.CALLBACK_BASE_URL || 'https://your-domain.com'}/api/mpesa/timeout`,
      ResultURL: `${process.env.CALLBACK_BASE_URL || 'https://your-domain.com'}/api/mpesa/b2c-result`,
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

    try {
      const response = await axios.post(`${this.baseURL}/mpesa/b2c/v1/paymentrequest`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      logger.info('B2C payment initiated', response.data);
      return response.data;
    } catch (error) {
      logger.error('B2C payment request failed:', error.response?.data || error.message);
      throw new Error(`B2C payment failed: ${error.response?.data?.errorMessage || error.message}`);
    }
  }
}

module.exports = new B2C();
