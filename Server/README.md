# Emergency Wallet - Backend System

Production-ready backend for phone-independent M-Pesa wallet.

## Features
- JWT authentication with refresh tokens
- Wallet management, daily/monthly limits
- Transaction logging & audit trails
- M-Pesa STK Push & B2C (sandbox ready)
- Async job queues (Bull + Redis)
- Rate limiting, brute-force protection
- Docker & docker-compose

## Quick start
1. Copy `.env.example` to `.env` and fill credentials.
2. Run `docker-compose up -d`
3. Run database migrations: `docker exec -it emergency-wallet_backend_1 npm run migrate`
4. API runs at `http://localhost:5000`

## API Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/wallet`
- `POST /api/wallet/recharge`
- `POST /api/pay/phone`
- `GET /api/transactions`

See `docs/api-spec.md` for full details.