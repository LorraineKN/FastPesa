const crypto = require('crypto');
const env = require('../config/env');

class MpesaSecurity {
  /**
   * Encrypt SecurityCredential for M-Pesa B2C API
   * @param {string} initiatorPassword - The initiator password from M-Pesa portal
   * @returns {string} - Encrypted SecurityCredential
   */
  static encryptSecurityCredential(initiatorPassword) {
    try {
      // For sandbox, return a mock encrypted credential
      if (env.MPESA_ENV === 'sandbox') {
        return 'sandbox_mock_security_credential';
      }

      // Production encryption logic
      const encryptionKey = Buffer.from(env.MPESA_SECURITY_CREDENTIAL || '', 'base64');
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
      
      let encrypted = cipher.update(initiatorPassword, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      // Combine IV and encrypted data
      return iv.toString('base64') + ':' + encrypted;
    } catch (error) {
      console.error('Error encrypting SecurityCredential:', error);
      throw new Error('Failed to encrypt SecurityCredential');
    }
  }

  /**
   * Decrypt SecurityCredential (for testing purposes)
   * @param {string} encryptedCredential - The encrypted SecurityCredential
   * @returns {string} - Decrypted credential
   */
  static decryptSecurityCredential(encryptedCredential) {
    try {
      if (env.MPESA_ENV === 'sandbox') {
        return 'sandbox_password';
      }

      const parts = encryptedCredential.split(':');
      const iv = Buffer.from(parts[0], 'base64');
      const encryptedData = parts[1];
      
      const encryptionKey = Buffer.from(env.MPESA_SECURITY_CREDENTIAL || '', 'base64');
      const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
      
      let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Error decrypting SecurityCredential:', error);
      throw new Error('Failed to decrypt SecurityCredential');
    }
  }

  /**
   * Generate password for SecurityCredential encryption
   * This should be done once and stored securely
   * @returns {string} - Base64 encoded encryption key
   */
  static generateEncryptionKey() {
    return crypto.randomBytes(32).toString('base64');
  }

  /**
   * Validate SecurityCredential format
   * @param {string} securityCredential - The SecurityCredential to validate
   * @returns {boolean} - Whether the credential is valid
   */
  static validateSecurityCredential(securityCredential) {
    if (!securityCredential || typeof securityCredential !== 'string') {
      return false;
    }

    // For sandbox, accept the mock credential
    if (env.MPESA_ENV === 'sandbox') {
      return securityCredential === 'sandbox_mock_security_credential';
    }

    // For production, validate format (base64:base64)
    const parts = securityCredential.split(':');
    return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
  }
}

module.exports = MpesaSecurity;
