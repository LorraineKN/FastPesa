# Emergency Wallet Backend - M-Pesa Hackathon Project

## 🚀 Money in Motion Hackathon 2026

## 📱 Problem Statement
In Kenya and across Africa, M-Pesa has revolutionized financial access, but users face critical barriers during emergencies when they don't have access to their registered phone or SIM card.

## 💡 Solution
Emergency Wallet provides phone-independent access to M-Pesa funds using only a username and PIN, enabling secure financial access anytime, anywhere.

## 🌟 Key Features
- JWT-based authentication with refresh tokens
- Secure PIN-based wallet access
- Daily/monthly transaction limits (configurable)
- M-Pesa STK Push and B2C integration
- Real-time transaction logging and audit trails
- Async job processing with Redis queues
- Rate limiting and brute-force protection
- RESTful API with comprehensive validation

## 🛠️ Technology Stack
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with raw SQL queries
- **Cache/Queue**: Redis with Bull job queues
- **Authentication**: JWT tokens with refresh mechanism
- **Security**: Helmet, CORS, rate limiting, bcrypt PIN hashing
- **Integration**: M-Pesa Daraja API (sandbox/production ready)
- **Containerization**: Docker & docker-compose
- **Logging**: Winston with file and console outputs

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & docker-compose
- Git

### Docker Setup (Recommended)
```bash
# Clone and setup
git clone <repository-url>
cd emergency-wallet/Server

# Environment setup
cp .env.example .env
# Edit .env with your M-Pesa API credentials

# Start services
docker-compose up -d

# Run migrations
docker exec -it emergency-wallet_backend_1 npm run migrate

# API available at http://localhost:5000
```

### Manual Setup
```bash
npm install
# Setup PostgreSQL and Redis
# Configure .env
npm run migrate
npm run dev
```

## 📋 Environment Variables
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

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login with PIN
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Wallet Management
- `GET /api/wallet` - Get wallet details and balance
- `POST /api/wallet/recharge` - Recharge wallet via M-Pesa
- `GET /api/wallet/limits` - Get transaction limits

### Payments
- `POST /api/pay/phone` - Send money to phone number

### Transactions
- `GET /api/transactions` - Get transaction history with pagination

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/preferences` - Get user preferences

## 🔒 Security Features
- PIN-based authentication with bcrypt hashing
- JWT tokens with refresh mechanism
- Rate limiting (100 requests per 15 minutes)
- Account lockout after 5 failed attempts
- Comprehensive audit logging
- Input validation with Joi schemas
- SQL injection prevention with parameterized queries

## 🧪 Testing
```bash
npm test
npm run test:watch
npm run test:coverage
```

## 📊 Database Schema
- **users**: User accounts and authentication
- **wallets**: Wallet balances and limits
- **transactions**: Complete financial audit trail
- **audit_logs**: Security and access logging
- **sessions**: User session management

## 🔌 M-Pesa Integration
- **STK Push**: For wallet recharges (CustomerPayBillOnline)
- **B2C API**: For sending money to phone numbers
- **Callback Handling**: Secure transaction status updates
- **Mock Mode**: Testing without real API credentials

## 📈 Performance & Monitoring
- Structured logging with Winston
- Request/response logging
- Error tracking
- Performance metrics
- Health check endpoints

## 🏆 Hackathon Submission
Built for the M-Pesa Africa x GOMYCODE Kenya "Money in Motion" Hackathon 2026.

**Challenge Area**: Community Impact

## 👥 Team Members
1. **Backend Lead** - Backend Architecture & API Design
2. **Backend Developer** - Database & Authentication
3. **Integration Specialist** - M-Pesa API Integration
4. **Security Engineer** - Security Implementation
5. **DevOps Engineer** - Docker & Deployment

## 📄 License
MIT License

## 📞 Contact
For questions or support, please contact our team at emergency-wallet-hackathon@example.com