# Emergency Wallet - M-Pesa Hackathon Project

## Problem Statement
In many developing regions, access to traditional banking services remains limited, while mobile money platforms like M-Pesa have become ubiquitous. However, current mobile money solutions often require users to have the physical device and SIM card registered to their account, creating barriers for emergency situations where family members or trusted contacts need access to funds when the primary account holder is unavailable.

## Solution Overview
Emergency Wallet is a phone-independent M-Pesa wallet system that allows secure, delegated access to mobile money services. Our solution addresses the **Community Impact** challenge area by enabling:

- **Emergency Fund Access**: Family members can access funds during emergencies without needing the primary account holder's phone
- **Secure Delegation**: Multi-factor authentication with PIN-based security and audit trails
- **Transaction Limits**: Built-in daily and monthly limits to prevent abuse
- **Real-time Monitoring**: Complete audit logs and instant notifications for all transactions

## Key Features
- JWT-based authentication with refresh tokens
- Secure PIN-based wallet access
- Daily/monthly transaction limits (configurable)
- M-Pesa STK Push and B2C integration
- Real-time transaction logging and audit trails
- Async job processing with Redis queues
- Rate limiting and brute-force protection
- RESTful API with comprehensive validation

## Technology Stack
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with raw SQL queries
- **Cache/Queue**: Redis with Bull job queues
- **Authentication**: JWT tokens with refresh mechanism
- **Security**: Helmet, CORS, rate limiting, bcrypt PIN hashing
- **Integration**: M-Pesa Daraja API (sandbox/production ready)
- **Containerization**: Docker & docker-compose
- **Logging**: Winston with file and console outputs

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login with PIN
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Wallet Management
- `GET /api/wallet` - Get wallet details and balance
- `POST /api/wallet/recharge` - Recharge wallet via M-Pesa

### Payments
- `POST /api/pay/phone` - Send money to phone number

### Transactions
- `GET /api/transactions` - Get transaction history with pagination

## Setup & Installation

### Prerequisites
- Node.js 18+
- Docker & docker-compose
- Git

### Quick Start with Docker
1. Clone the repository:
```bash
git clone <repository-url>
cd emergency-wallet/Server
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your M-Pesa API credentials
```

3. Start all services:
```bash
docker-compose up -d
```

4. Run database migrations:
```bash
docker exec -it emergency-wallet_backend_1 npm run migrate
```

5. API is available at `http://localhost:5000`

### Manual Setup
1. Install dependencies:
```bash
npm install
```

2. Set up PostgreSQL and Redis
3. Configure environment variables in `.env`
4. Run migrations: `npm run migrate`
5. Start server: `npm run dev`

## Environment Variables
```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=emergency_user
DB_PASSWORD=securepassword
DB_NAME=emergency_wallet

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# M-Pesa Daraja API
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_PASSKEY=your_passkey
MPESA_SHORTCODE=174379
MPESA_ENV=sandbox

# Transaction Limits
DAILY_LIMIT=5000
MONTHLY_LIMIT=50000
MAX_TRANSACTION_AMOUNT=5000
```

## Live Demo
**Backend API**: https://emergency-wallet-api.herokuapp.com  
**API Documentation**: https://emergency-wallet-api.herokuapp.com/health  

## Test Accounts
- **Username**: testuser
- **PIN**: 1234
- **Phone**: +254712345678

## Security Features
- PIN-based authentication with bcrypt hashing
- JWT tokens with refresh mechanism
- Rate limiting (100 requests per 15 minutes)
- Account lockout after 5 failed attempts
- Comprehensive audit logging
- Input validation with Joi schemas
- SQL injection prevention with parameterized queries

## Team Members
1. **Team Lead** - Backend Architecture & API Design
2. **Backend Developer** - Database & Authentication
3. **Integration Specialist** - M-Pesa API Integration
4. **Security Engineer** - Security Implementation
5. **DevOps Engineer** - Docker & Deployment

## Project Repository
https://github.com/your-team/emergency-wallet

## About This Project
Emergency Wallet was built for the M-Pesa Africa x GOMYCODE Kenya "Money in Motion" Hackathon. Our solution addresses the critical need for emergency fund access in communities where traditional banking is limited but mobile money is prevalent. The system ensures secure, audited access to funds while maintaining strict controls to prevent misuse.

## Future Enhancements
- Mobile application (React Native)
- Web dashboard for administrators
- SMS notifications for transactions
- Multi-currency support
- Advanced fraud detection algorithms
- Biometric authentication options

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
MIT License - see LICENSE file for details

## Contact
For questions or support, please contact our team at emergency-wallet@example.com