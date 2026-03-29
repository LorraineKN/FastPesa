# 📡 Emergency Wallet API Documentation

## Base URL
- **Development**: `http://localhost:5000`
- **Production**: `https://emergency-wallet-api.herokuapp.com`

## 🔐 Authentication

All API endpoints (except authentication) require JWT authentication:

```http
Authorization: Bearer <access_token>
```

### Authentication Flow
1. Login with username + PIN → Get access + refresh tokens
2. Use access token for API calls (15 min expiry)
3. Refresh token when expired (7 days expiry)

---

## 📱 API Endpoints

### 🔑 Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "username": "johndoe",
  "pin": "1234",
  "phoneNumber": "+254712345678"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "fullName": "John Doe"
    }
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "pin": "1234"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "fullName": "John Doe"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token"
    }
  }
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

---

### 💳 Wallet Management

#### Get Wallet Details
```http
GET /api/wallet
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "wallet": {
      "id": "uuid",
      "balance": "5000.00",
      "dailyLimit": 5000,
      "monthlyLimit": 50000,
      "currency": "KES"
    }
  }
}
```

#### Get Transaction Limits
```http
GET /api/wallet/limits
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "dailyLimit": 5000,
    "monthlyLimit": 50000,
    "customLimits": null
  }
}
```

#### Recharge Wallet (STK Push)
```http
POST /api/wallet/recharge
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "amount": 1000,
  "phoneNumber": "+254712345678"
}
```

**Response:**
```json
{
  "success": true,
  "message": "STK Push initiated successfully",
  "data": {
    "transaction": {
      "id": "uuid",
      "type": "deposit",
      "amount": "1000.00",
      "status": "pending",
      "referenceCode": "MOCK_1234567890"
    }
  }
}
```

---

### 💸 Payments

#### Send Money to Phone
```http
POST /api/pay/phone
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "phoneNumber": "+254723456789",
  "amount": 500
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment initiated successfully",
  "data": {
    "transaction": {
      "id": "uuid",
      "type": "transfer",
      "amount": "500.00",
      "status": "success",
      "referenceCode": "TXN_1234567890"
    }
  }
}
```

---

### 📊 Transactions

#### Get Transaction History
```http
GET /api/transactions?limit=20&offset=0&type=deposit&status=success
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `limit` (number): Number of transactions (default: 20)
- `offset` (number): Pagination offset (default: 0)
- `type` (string): Filter by type (deposit, transfer, refund)
- `status` (string): Filter by status (pending, success, failed)

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "type": "deposit",
        "amount": "1000.00",
        "status": "success",
        "referenceCode": "MOCK_1234567890",
        "phoneNumber": "+254712345678",
        "description": "Recharge via STK Push",
        "createdAt": "2026-03-29T12:00:00.000Z"
      }
    ]
  }
}
```

---

### 👤 User Management

#### Get User Profile
```http
GET /api/user/profile
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "fullName": "John Doe",
      "phoneNumber": "+254712345678",
      "createdAt": "2026-03-29T12:00:00.000Z"
    }
  }
}
```

#### Update User Profile
```http
PUT /api/user/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "fullName": "John Smith",
  "phoneNumber": "+254723456789"
}
```

#### Get User Preferences
```http
GET /api/user/preferences
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "theme": "light",
      "language": "en",
      "notifications": {
        "email": true,
        "sms": false,
        "push": true
      },
      "security": {
        "twoFactorEnabled": false,
        "sessionTimeout": 24
      }
    }
  }
}
```

---

## 🔧 Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "pin",
        "message": "PIN must be 4 digits"
      }
    ]
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `UNAUTHORIZED` | 401 | Invalid or expired token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `INSUFFICIENT_BALANCE` | 400 | Not enough funds |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 🧪 Testing

### Mock Endpoints
For testing without real M-Pesa API:

```http
POST /api/wallet/mock-callback
Content-Type: application/json

{
  "transactionId": "uuid",
  "status": "success"
}
```

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-29T12:00:00.000Z",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

---

## 📝 Rate Limiting

- **Authentication**: 10 requests per minute
- **Payments**: 5 requests per minute
- **Other endpoints**: 100 requests per 15 minutes

---

## 🔒 Security Notes

- All sensitive data is encrypted in transit (HTTPS)
- PINs are hashed using bcrypt (12 rounds)
- JWT tokens have short expiry (15 minutes)
- All requests are logged for audit purposes
- SQL injection protection with parameterized queries

---

## 📞 Support

For API support, contact: api-support@emergency-wallet.app
