# Emergency Wallet System

A secure, phone-independent digital wallet that allows users to access and transact money via M-Pesa using only a username + PIN, even when they do not have access to their mobile phone.

## Project Structure

```
emergency-wallet/
├── Server/           # Backend API (Node.js + Express)
├── Client/           # Frontend (React + Vite)
└── docker-compose.yml # Full system deployment
```

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & docker-compose

### 1. Start Backend Services
```bash
cd Server
docker-compose up -d
npm run migrate
```

### 2. Start Frontend
```bash
cd Client
npm install
npm run dev
```

### 3. Access Applications
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/health

## Features

### Authentication
- Username + PIN login
- JWT token authentication
- Account lockout protection
- Session management

### Wallet Operations
- Check balance
- Send money to phone numbers
- Recharge wallet via M-Pesa STK Push
- Transaction history with filtering

### Security
- PIN hashing with bcrypt
- Rate limiting
- Input validation
- Audit logging
- HTTPS ready

## Technology Stack

### Backend (Server/)
- **Node.js** + Express.js
- **PostgreSQL** (primary database)
- **Redis** (caching + queues)
- **Bull** (job processing)
- **JWT** (authentication)
- **Winston** (logging)

### Frontend (Client/)
- **React 18** + Vite
- **React Router** (navigation)
- **Zustand** (state management)
- **Axios** (HTTP client)
- **Tailwind CSS** (styling)
- **React Hot Toast** (notifications)

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout

### Wallet
- `GET /api/wallet` - Get wallet details
- `POST /api/wallet/recharge` - Recharge wallet

### Payments
- `POST /api/pay/phone` - Send money to phone

### Transactions
- `GET /api/transactions` - Get transaction history

## Environment Configuration

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
DB_HOST=postgres
DB_PORT=5432
DB_USER=emergency_user
DB_PASSWORD=securepassword
DB_NAME=emergency_wallet
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=super-secret-jwt-key
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_PASSKEY=your_passkey
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## Database Schema

- **users** - User accounts and authentication
- **wallets** - Wallet balances and limits
- **transactions** - All financial transactions
- **audit_logs** - Security audit trail
- **sessions** - User session management

## Deployment

### Docker Deployment
```bash
docker-compose up -d
```

### Manual Backend Setup
```bash
cd Server
npm install
npm run migrate
npm run dev
```

### Manual Frontend Setup
```bash
cd Client
npm install
npm run dev
```

## Test Accounts

| Username | PIN | Phone | Balance |
|----------|-----|-------|---------|
| testuser | 1234 | +254712345678 | KES 5,000 |
| demo | 1234 | +254723456789 | KES 1,000 |

## Security Features

- PIN-based authentication with bcrypt hashing
- JWT tokens with refresh mechanism
- Rate limiting (100 requests per 15 minutes)
- Account lockout after 5 failed attempts
- Comprehensive audit logging
- SQL injection prevention
- CORS protection

## M-Pesa Integration

- STK Push for wallet recharges
- B2C API for sending money
- Callback handling for transaction updates
- Sandbox and production ready

## Monitoring & Logging

- Structured logging with Winston
- Request/response logging
- Error tracking
- Performance metrics
- Health check endpoints

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Test on multiple screen sizes

## License

MIT License
