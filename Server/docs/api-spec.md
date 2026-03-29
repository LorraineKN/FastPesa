# Emergency Wallet API Documentation

## Base URL
`http://localhost:5000` (development)  
`https://emergency-wallet-api.herokuapp.com` (production)

## Authentication
The API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Response Format
All API responses follow this format:

### Success Response
```json
{
  "data": { ... },
  "message": "Success message"
}
```

### Error Response
```json
{
  "error": "Error message",
  "timestamp": "2024-03-29T10:30:00.000Z",
  "path": "/api/endpoint",
  "details": [ ... ] // Only for validation errors
}
```

## Rate Limiting
- **100 requests per 15 minutes** per IP address
- Rate limit headers are included in responses:
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

---

## Authentication Endpoints

### Register User
**POST** `/api/auth/register`

Creates a new user account with PIN-based authentication.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "username": "johndoe",
  "pin": "1234",
  "phoneNumber": "+254712345678"
}
```

**Response (201):**
```json
{
  "message": "User registered",
  "user": {
    "id": "uuid",
    "full_name": "John Doe",
    "username": "johndoe",
    "phone_number": "+254712345678",
    "status": "active",
    "created_at": "2024-03-29T10:30:00.000Z"
  }
}
```

**Validation Rules:**
- `fullName`: 2-100 characters, required
- `username`: 3-30 alphanumeric characters, required, unique
- `pin`: Exactly 4 digits, required
- `phoneNumber`: Valid international phone format, required

---

### Login
**POST** `/api/auth/login`

Authenticates a user and returns JWT tokens.

**Request Body:**
```json
{
  "username": "johndoe",
  "pin": "1234"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "fullName": "John Doe",
    "username": "johndoe"
  }
}
```

**Security Features:**
- Account locks after 5 failed attempts
- Failed login attempts are logged
- Tokens have expiration times

---

### Refresh Token
**POST** `/api/auth/refresh`

Refreshes an access token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Logout
**POST** `/api/auth/logout`

Invalidates the refresh token and logs out the user.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "message": "Logged out"
}
```

---

## Wallet Endpoints

### Get Wallet Details
**GET** `/api/wallet`

Retrieves wallet information and current balance.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "balance": 2500.00,
  "daily_limit": 5000.00,
  "monthly_limit": 50000.00,
  "is_locked": false,
  "created_at": "2024-03-29T10:30:00.000Z"
}
```

---

### Recharge Wallet
**POST** `/api/wallet/recharge`

Initiates an M-Pesa STK Push to recharge the wallet.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "amount": 1000,
  "phoneNumber": "+254712345678"
}
```

**Response (200):**
```json
{
  "message": "STK Push initiated",
  "transactionId": "uuid",
  "phoneNumber": "+254712345678",
  "amount": 1000
}
```

**Validation Rules:**
- `amount`: Positive number, max 50,000
- `phoneNumber`: Valid international phone format

---

## Payment Endpoints

### Send Money to Phone
**POST** `/api/pay/phone`

Sends money from wallet to a phone number via M-Pesa B2C.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "phoneNumber": "+254723456789",
  "amount": 500
}
```

**Response (200):**
```json
{
  "message": "Payment initiated",
  "transactionId": "uuid",
  "phoneNumber": "+254723456789",
  "amount": 500,
  "status": "pending"
}
```

**Validation Rules:**
- `amount`: Positive number, max 5,000 per transaction
- `phoneNumber`: Valid international phone format
- Daily/monthly limits apply

---

## Transaction Endpoints

### Get Transaction History
**GET** `/api/transactions`

Retrieves paginated transaction history for the authenticated user.

**Headers:** `Authorization: Bearer <access_token>`

**Query Parameters:**
- `limit`: Number of transactions (1-100, default: 10)
- `offset`: Number of transactions to skip (default: 0)

**Example:** `/api/transactions?limit=20&offset=0`

**Response (200):**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "type": "payment",
      "amount": 500.00,
      "phone_number": "+254723456789",
      "status": "completed",
      "reference": "MPESA123456",
      "created_at": "2024-03-29T10:30:00.000Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 25
  }
}
```

**Transaction Types:**
- `recharge`: Wallet recharge via M-Pesa
- `payment`: Money sent to phone number
- `refund`: Failed transaction refund

**Transaction Statuses:**
- `pending`: Transaction initiated, awaiting confirmation
- `completed`: Transaction successful
- `failed`: Transaction failed
- `cancelled`: Transaction cancelled

---

## Utility Endpoints

### Health Check
**GET** `/health`

Returns API health status.

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-03-29T10:30:00.000Z",
  "version": "1.0.0"
}
```

---

## Error Codes

| Status Code | Description | Example |
|-------------|-------------|----------|
| 400 | Bad Request | Validation failed, invalid input |
| 401 | Unauthorized | Invalid or missing token |
| 403 | Forbidden | Account locked, insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate entry, resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error, try again later |

---

## SDK Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

// Login
const login = async (username, pin) => {
  const { data } = await api.post('/auth/login', { username, pin });
  api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
  return data;
};

// Get wallet
const getWallet = async () => {
  const { data } = await api.get('/wallet');
  return data;
};

// Send payment
const sendPayment = async (phoneNumber, amount) => {
  const { data } = await api.post('/pay/phone', { phoneNumber, amount });
  return data;
};
```

### cURL Examples
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","pin":"1234"}'

# Get wallet (replace TOKEN with actual token)
curl -X GET http://localhost:5000/api/wallet \
  -H "Authorization: Bearer TOKEN"

# Send payment
curl -X POST http://localhost:5000/api/pay/phone \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+254723456789","amount":500}'
```

---

## Testing

Use the provided test accounts for development:

| Username | PIN | Phone | Balance |
|----------|-----|-------|---------|
| testuser | 1234 | +254712345678 | KES 5,000 |
| demo | 1234 | +254723456789 | KES 1,000 |
| emergency | 5678 | +254734567890 | KES 2,500 |

---

## Security Considerations

1. **PIN Security**: Always use HTTPS in production
2. **Token Storage**: Store tokens securely on client side
3. **Rate Limiting**: Implement client-side rate limiting
4. **Input Validation**: All inputs are validated server-side
5. **Audit Logging**: All actions are logged for security
6. **Account Lockout**: Accounts lock after 5 failed attempts

---

## Support

For API support and questions:
- Email: emergency-wallet@example.com
- Documentation: https://docs.emergency-wallet.com
- Issues: https://github.com/your-team/emergency-wallet/issues