# API Endpoints

## Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh

## Wallet
- GET /api/wallet (requires auth)
- POST /api/wallet/recharge (body: { amount, phoneNumber })

## Payments
- POST /api/pay/phone (body: { phoneNumber, amount })

## Transactions
- GET /api/transactions?limit=10&offset=0