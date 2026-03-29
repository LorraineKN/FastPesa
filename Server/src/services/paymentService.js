const walletService = require('./walletService');
const mpesaService = require('./mpesaService');
const transactionService = require('./transactionService');
const { addPaymentJob } = require('../queues/paymentQueue');
const env = require('../config/env');

class PaymentService {
  async sendToPhone(userId, phoneNumber, amount, ipAddress) {
    if (amount > env.MAX_TRANSACTION_AMOUNT) throw new Error('Amount exceeds maximum allowed');
    // First debit from wallet (synchronously)
    const { balance, transaction } = await walletService.updateBalanceAtomic(
      userId,
      -amount,
      'transfer',
      `Send to ${phoneNumber}`,
      ipAddress
    );
    // Queue M-Pesa B2C (async)
    await addPaymentJob({ userId, phoneNumber, amount, transactionId: transaction.id });
    return { success: true, balance, transactionId: transaction.id, message: 'Payment initiated' };
  }

  async initiateRecharge(userId, amount, phoneNumber, ipAddress) {
    if (amount <= 0) throw new Error('Invalid amount');
    // STK Push call (sync with M-Pesa)
    const stkResponse = await mpesaService.stkPush(phoneNumber, amount);
    // Create pending transaction
    const wallet = await walletService.getUserWallet(userId);
    const transaction = await transactionService.createTransaction({
      walletId: wallet.id,
      type: 'deposit',
      amount,
      status: 'pending',
      referenceCode: stkResponse.CheckoutRequestID,
      description: `Recharge via STK Push`,
    });
    return { checkoutRequestId: stkResponse.CheckoutRequestID, transactionId: transaction.id };
  }
}

module.exports = new PaymentService();