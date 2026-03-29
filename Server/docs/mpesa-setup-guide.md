# M-Pesa Daraja Integration Setup Guide

## Overview
This guide covers the complete setup of M-Pesa Daraja integration for the Emergency Wallet system.

## Prerequisites
- M-Pesa Daraja developer account
- Registered application on [M-Pesa Developer Portal](https://developer.safaricom.co.ke)
- SSL certificate for production (HTTPS required for callbacks)

## Environment Configuration

### 1. Create .env file
Copy `.env.example` to `.env` and update with your actual credentials:

```bash
cp .env.example .env
```

### 2. Sandbox Credentials (for testing)
```env
# M-Pesa Daraja - Sandbox
MPESA_CONSUMER_KEY=your_sandbox_consumer_key
MPESA_CONSUMER_SECRET=your_sandbox_consumer_secret
MPESA_PASSKEY=your_sandbox_passkey
MPESA_SHORTCODE=174379
MPESA_ENV=sandbox

# Callback URL (use ngrok for local testing)
CALLBACK_BASE_URL=https://your-domain.com

# B2C Configuration (sandbox)
MPESA_INITIATOR_NAME=testapi
MPESA_SECURITY_CREDENTIAL=sandbox_mock_security_credential
```

### 3. Production Credentials
```env
# M-Pesa Daraja - Production
MPESA_CONSUMER_KEY=your_production_consumer_key
MPESA_CONSUMER_SECRET=your_production_consumer_secret
MPESA_PASSKEY=your_production_passkey
MPESA_SHORTCODE=your_production_shortcode
MPESA_ENV=production

# Production Callback URL (must be HTTPS)
CALLBACK_BASE_URL=https://your-production-domain.com

# B2C Configuration (production)
MPESA_INITIATOR_NAME=your_initiator_name
MPESA_SECURITY_CREDENTIAL=your_encrypted_security_credential
```

## Getting Your Credentials

### 1. Consumer Key & Secret
1. Login to [M-Pesa Developer Portal](https://developer.safaricom.co.ke)
2. Go to "My Apps" → Create New App
3. Select "M-Pesa API" and add the following APIs:
   - Lipa Na M-Pesa Online Payment (STK Push)
   - B2C API
4. Your Consumer Key and Secret will be generated

### 2. Passkey & Shortcode
**For Sandbox:**
- Passkey: Provided in sandbox documentation
- Shortcode: `174379` (test shortcode)

**For Production:**
- Apply for production shortcode through your Safaricom account manager
- Passkey will be provided with your approved shortcode

### 3. B2C Configuration
**For Production Only:**
1. Apply for B2C API access
2. Create an Initiator in the M-Pesa portal
3. Generate Security Credential using the provided utility:

```javascript
const MpesaSecurity = require('./src/utils/mpesaSecurity');

// Generate encryption key (do this once)
const encryptionKey = MpesaSecurity.generateEncryptionKey();
console.log('Add to .env:', `MPESA_SECURITY_CREDENTIAL=${encryptionKey}`);

// Encrypt your initiator password
const encryptedCredential = MpesaSecurity.encryptSecurityCredential('your_initiator_password');
console.log('Encrypted SecurityCredential:', encryptedCredential);
```

## Callback URLs Configuration

### Required Endpoints
Your server must expose these endpoints:
- `POST /api/mpesa/callback` - STK Push callbacks
- `POST /api/mpesa/b2c-result` - B2C result callbacks  
- `POST /api/mpesa/timeout` - B2C timeout callbacks

### Testing with Ngrok (Local Development)
```bash
# Install ngrok
npm install -g ngrok

# Start your server on port 5000
npm run dev

# In another terminal, expose port 5000
ngrok http 5000

# Use the ngrok URL as your CALLBACK_BASE_URL
# Example: CALLBACK_BASE_URL=https://abc123.ngrok.io
```

### Production Setup
- Ensure your domain has valid SSL certificate
- Configure firewall to allow M-Pesa IP ranges
- Set up proper DNS records

## Security Considerations

### 1. Environment Variables
- Never commit `.env` file to version control
- Use strong, unique credentials
- Rotate credentials regularly

### 2. Security Credential
- Store the encryption key securely
- Use different credentials for sandbox and production
- Monitor for unauthorized access

### 3. Callback Security
- Validate incoming callback requests
- Implement rate limiting
- Log all callback activities

## Testing the Integration

### 1. STK Push Test
```javascript
// Test STK Push
const response = await mpesaService.stkPush('+254712345678', 100);
console.log('STK Push Response:', response);
```

### 2. B2C Test (Sandbox)
```javascript
// Test B2C payment (sandbox mode)
const response = await b2c.send('+254712345678', 100, 'TX123');
console.log('B2C Response:', response);
```

### 3. Callback Testing
- Use the mock callback endpoint: `POST /api/wallet/mock-callback`
- Test with actual M-Pesa callbacks in sandbox
- Verify transaction status updates

## Production Deployment Checklist

- [ ] Use production credentials
- [ ] Configure HTTPS with valid SSL certificate
- [ ] Set production callback URLs
- [ ] Test all API endpoints
- [ ] Monitor error logs
- [ ] Set up alerts for failed transactions
- [ ] Implement proper logging and monitoring

## Troubleshooting

### Common Issues

1. **"Invalid SecurityCredential"**
   - Ensure SecurityCredential is properly encrypted
   - Check environment variables are correctly set

2. **"Callback timeout"**
   - Verify callback URLs are accessible
   - Check firewall settings
   - Ensure HTTPS is working

3. **"Invalid credentials"**
   - Verify Consumer Key and Secret
   - Check if sandbox vs production credentials match

4. **"Transaction failed"**
   - Check phone number format (+254XXXXXXXXX)
   - Verify sufficient funds (for B2C)
   - Check transaction limits

### Debug Mode
Enable debug logging:
```env
LOG_LEVEL=debug
```

### Support
- M-Pesa Developer Documentation: https://developer.safaricom.co.ke/docs
- Support Portal: https://developer.safaricom.co.ke/support

## API Endpoints Reference

### STK Push
- **Endpoint**: `/api/mpesa/stkpush/v1/processrequest`
- **Method**: POST
- **Purpose**: Initiate customer payment

### B2C Payment
- **Endpoint**: `/api/mpesa/b2c/v1/paymentrequest`
- **Method**: POST
- **Purpose**: Send money to customer

### OAuth Token
- **Endpoint**: `/oauth/v1/generate`
- **Method**: GET
- **Purpose**: Get access token

## Rate Limits
- **Sandbox**: 100 requests per minute
- **Production**: Varies by API tier
- **Recommended**: Implement exponential backoff for retries

## Monitoring & Analytics
Monitor these metrics:
- Transaction success rate
- API response times
- Callback processing time
- Error rates by type
- Daily/monthly transaction volumes

## Compliance
- Ensure PCI DSS compliance for payment data
- Follow Kenya Central Bank guidelines
- Implement proper data retention policies
- Maintain audit trails for all transactions
