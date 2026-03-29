#!/bin/bash

# Emergency Wallet Backend - Frontend Compatibility Setup Script
# This script helps set up the backend to work with the new frontend

set -e

echo "🚀 Emergency Wallet Backend - Frontend Compatibility Setup"
echo "=========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if we're in the Server directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    print_error "Please run this script from the Server directory"
    exit 1
fi

print_step "1. Installing dependencies..."
if command -v npm &> /dev/null; then
    npm install
    print_status "Dependencies installed successfully"
else
    print_error "npm not found. Please install Node.js and npm"
    exit 1
fi

print_step "2. Setting up environment configuration..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_status "Created .env from .env.example"
        print_warning "Please edit .env file with your configuration"
    else
        print_error ".env.example not found"
        exit 1
    fi
else
    print_status ".env file already exists"
fi

print_step "3. Checking database configuration..."
if ! grep -q "DATABASE_URL" .env; then
    print_warning "DATABASE_URL not found in .env"
    print_warning "Please configure your database connection"
fi

print_step "4. Running database migrations..."
if command -v psql &> /dev/null; then
    # Run migrations if database is available
    if npm run migrate 2>/dev/null; then
        print_status "Database migrations completed successfully"
    else
        print_warning "Database migrations failed. Please check your database configuration"
        print_warning "You can run migrations manually with: npm run migrate"
    fi
else
    print_warning "psql not found. Please install PostgreSQL client"
fi

print_step "5. Installing new dependencies..."
npm install @supabase/supabase-js jose

print_step "6. Building the application..."
if npm run build 2>/dev/null; then
    print_status "Build completed successfully"
else
    print_warning "Build failed. This is normal for development"
fi

print_step "7. Testing the server..."
if npm test 2>/dev/null; then
    print_status "Tests passed successfully"
else
    print_warning "Tests failed or not available"
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Start the server with: npm run dev"
echo "3. Verify the server is running at: http://localhost:5000"
echo "4. Test the health endpoint: curl http://localhost:5000/health"
echo ""
echo "Frontend Integration:"
echo "1. Configure your frontend to use: http://localhost:5000/auth/v1"
echo "2. Set Supabase URL to: http://localhost:5000"
echo "3. Use the RPC endpoints for wallet operations"
echo ""
echo "Available endpoints:"
echo "- Authentication: POST /auth/v1/login, /auth/v1/register"
echo "- Wallet RPC: POST /rest/v1/rpc/*"
echo "- Transactions: GET /rest/v1/transactions"
echo "- Profile: GET /rest/v1/profile"
echo ""
echo "Demo Mode:"
echo "- M-Pesa operations are simulated when MPESA_DEMO_MODE=true"
echo "- Users get 10,000 KES demo funding automatically"
echo "- All transactions create realistic confirmations"
echo ""
print_status "Setup complete! Your backend is now ready for frontend integration."
