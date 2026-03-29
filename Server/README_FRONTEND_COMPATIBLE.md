# Emergency Wallet Backend - Frontend Compatible

This backend has been updated to be fully compatible with the new React frontend. It provides Supabase-compatible API endpoints and maintains backward compatibility with the existing legacy API.

## New Features

### Supabase Compatibility
- **Authentication**: JWT tokens compatible with Supabase auth
- **RPC Functions**: Database functions that match frontend expectations
- **API Endpoints**: RESTful endpoints that mimic Supabase structure
- **Database Schema**: Updated to match frontend type definitions

### Frontend Integration
- **Wallet Operations**: All wallet operations the frontend expects
- **M-Pesa Services**: Complete M-Pesa simulation and real integration
- **Profile Management**: User profiles with roles and permissions
- **Transaction Types**: Support for all transaction types used by frontend

## API Endpoints

### Authentication (Supabase Compatible)
```
POST /auth/v1/register    - Register new user
POST /auth/v1/login       - User login
POST /auth/v1/logout      - User logout
POST /auth/v1/refresh     - Refresh JWT token
GET  /auth/v1/me         - Get current user info
```

### RPC Functions (Supabase Compatible)
```
POST /rest/v1/rpc/get_wallet_snapshot        - Get wallet info
POST /rest/v1/rpc/ensure_demo_wallet        - Create/demo fund wallet
POST /rest/v1/rpc/process_deposit           - Process deposit
POST /rest/v1/rpc/process_withdrawal        - Process withdrawal
POST /rest/v1/rpc/process_wallet_transfer   - Transfer between wallets
POST /rest/v1/rpc/process_mpesa_transaction - Process M-Pesa transaction
```

### REST Endpoints
```
GET  /rest/v1/transactions - Get user transactions
GET  /rest/v1/profile     - Get user profile
PUT  /rest/v1/profile     - Update user profile
```

### Legacy API (Backward Compatible)
```
/api/auth/*     - Legacy authentication
/api/wallet/*   - Legacy wallet operations
/api/mpesa/*    - Legacy M-Pesa operations
```

## Database Schema

### New Tables
- **profiles**: User profiles with extended information
- **user_roles**: Role-based access control
- **notifications**: User notifications system
- **payment_requests**: Payment request functionality

### Updated Tables
- **wallets**: Added currency, wallet_name, is_active, is_demo_funded
- **transactions**: Added M-Pesa fields, user relationships
- **users**: Renamed to legacy_users for compatibility

### RPC Functions
- **get_wallet_snapshot**: Get complete wallet information
- **ensure_demo_wallet**: Create and fund demo wallet
- **process_deposit**: Handle deposit operations
- **process_withdrawal**: Handle withdrawal operations
- **process_wallet_transfer**: Handle wallet transfers
- **process_mpesa_transaction**: Handle M-Pesa operations

## Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Supabase Compatibility
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=your-service-key
SUPABASE_JWT_SECRET=your-jwt-secret

# M-Pesa
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_DEMO_MODE=true

# Server
PORT=5000
NODE_ENV=development
```

## Setup Instructions

### 1. Install Dependencies
```bash
cd Server
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Run Database Migrations
```bash
npm run migrate
```

### 4. Start the Server
```bash
# Development
npm run dev

# Production
npm start
```

## Frontend Integration

### 1. Configure Frontend
Update frontend environment variables to point to the backend:
```bash
VITE_SUPABASE_URL=http://localhost:5000/auth/v1
VITE_SUPABASE_PUBLISHABLE_KEY=your-key
```

### 2. Authentication Flow
The frontend will use the standard Supabase auth flow:
1. Register/Login via `/auth/v1/register` or `/auth/v1/login`
2. Receive JWT token compatible with Supabase
3. Use token for authenticated requests
4. Token automatically includes user metadata

### 3. Wallet Operations
All wallet operations work through RPC functions:
- `getWalletSnapshot()` → `/rest/v1/rpc/get_wallet_snapshot`
- `processDeposit()` → `/rest/v1/rpc/process_deposit`
- `processMpesaOperation()` → `/rest/v1/rpc/process_mpesa_transaction`

### 4. M-Pesa Integration
The backend provides both demo and real M-Pesa integration:
- **Demo Mode**: Simulated transactions with SMS confirmations
- **Production Mode**: Real Safaricom Daraja API integration

## Testing

### 1. Test Authentication
```bash
curl -X POST http://localhost:5000/auth/v1/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User","username":"testuser"}'
```

### 2. Test Wallet Operations
```bash
curl -X POST http://localhost:5000/rest/v1/rpc/ensure_demo_wallet \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"p_user_id":"USER_ID","p_full_name":"Test User","p_email":"test@example.com","p_username":"testuser"}'
```

### 3. Test M-Pesa Operations
```bash
curl -X POST http://localhost:5000/rest/v1/rpc/process_mpesa_transaction \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"p_user_id":"USER_ID","p_amount":100,"p_type":"mpesa_send_money","p_phone_number":"254712345678"}'
```

## Development Notes

### Demo Mode
When `MPESA_DEMO_MODE=true`, all M-Pesa operations are simulated:
- Transactions are logged but don't call real APIs
- SMS confirmations are simulated in logs
- Perfect for development and testing

### Database Compatibility
The backend supports both old and new database schemas:
- New installations use the updated schema
- Existing installations can migrate gradually
- Legacy API endpoints continue to work

### Security
- JWT tokens with proper expiration
- Rate limiting on all endpoints
- Input validation and sanitization
- SQL injection protection with parameterized queries

## Deployment

### Docker Deployment
```bash
docker-compose up -d
```

### Manual Deployment
1. Set up PostgreSQL database
2. Run migrations: `npm run migrate`
3. Set environment variables
4. Start server: `npm start`

## Monitoring

### Health Check
```bash
curl http://localhost:5000/health
```

### Logs
```bash
# View logs
tail -f logs/app.log

# Change log level
LOG_LEVEL=debug npm start
```

## Troubleshooting

### Common Issues
1. **Database Connection**: Check DATABASE_URL and database status
2. **JWT Tokens**: Verify SUPABASE_JWT_SECRET configuration
3. **M-Pesa Demo**: Ensure MPESA_DEMO_MODE=true for development
4. **CORS**: Check frontend origin in CORS configuration

### Debug Mode
```bash
DEBUG=* npm run dev
```

## API Documentation

Detailed API documentation is available at:
- Swagger UI: `http://localhost:5000/api-docs` (if enabled)
- Postman collection: `docs/postman.json`

## Support

For issues and questions:
1. Check the logs for error details
2. Verify environment configuration
3. Test with demo mode enabled
4. Review frontend integration steps
