# 🚀 Quick Setup Guide

## One-Command Setup

### Prerequisites
- Node.js 18+
- Docker & docker-compose
- Git

### 🐳 Docker Setup (Recommended)
```bash
# Clone the repository
git clone https://github.com/your-team/emergency-wallet.git
cd emergency-wallet

# Start everything with one command
docker-compose up -d

# Run database migrations
docker exec -it emergency-wallet_backend_1 npm run migrate

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
```

### 🔧 Manual Setup

#### Backend
```bash
cd Server
npm install
cp .env.example .env
# Edit .env with your credentials
docker-compose up -d postgres redis
npm run migrate
npm run dev
```

#### Frontend
```bash
cd Client
npm install
cp .env.example .env
# Edit .env with API URL
npm run dev
```

## 🧪 Quick Test

1. **Login**: `testuser` / `1234`
2. **View Balance**: Check dashboard
3. **Send Money**: Transfer KES 100 to `+254723456789`
4. **Recharge**: Add KES 500 via STK Push

## 📱 Access URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/health

## 🔧 Troubleshooting

### Port Issues
```bash
# Check what's running on ports
lsof -i :3000
lsof -i :5000

# Kill processes if needed
kill -9 <PID>
```

### Database Issues
```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
docker exec -it emergency-wallet_backend_1 npm run migrate
```

### Redis Issues
```bash
# Reset Redis
docker-compose down redis
docker-compose up -d redis
```

## 🚀 Production Deployment

See main README.md for detailed production deployment instructions.
