# Emergency Wallet Frontend

React frontend for the Emergency Wallet System - a phone-independent M-Pesa wallet that allows secure access to funds using just a username and PIN.

## 🚀 Features

- **Authentication**: Secure login/registration with PIN-based authentication
- **Dashboard**: Real-time wallet balance and quick actions
- **Payments**: Send money to phone numbers via M-Pesa
- **Recharge**: Add funds using M-Pesa STK Push
- **Transaction History**: View and filter all transactions
- **Settings**: Manage account and change PIN
- **Responsive Design**: Works on all devices

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Navigation
- **Zustand** - State management
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **React Hot Toast** - Notifications

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
npm run dev
```

### Environment Variables
Create a `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

### Access
Open http://localhost:3000 in your browser

## 📁 Project Structure
```
src/
├── components/          # Reusable components
│   ├── UI/             # Basic UI components
│   └── wallet/         # Wallet-specific components
├── pages/              # Page components
├── services/           # API services
├── stores/             # Zustand state management
├── utils/              # Utility functions
├── routes/             # Route protection
└── styles/             # Global styles
```

## 🔐 Security Features
- JWT token authentication
- Automatic logout on token expiry
- PIN masking and validation
- Input sanitization
- HTTPS only in production

## 📱 API Integration
The frontend connects to the backend API at `/api` endpoints:
- Authentication: `/auth/*`
- Wallet: `/wallet/*`
- Payments: `/pay/*`
- Transactions: `/transactions/*`

## 🧪 Testing
```bash
npm run test
npm run lint
```

## 📦 Build
```bash
npm run build
npm run preview
```

## 🏆 Hackathon Submission
Built for the M-Pesa Africa x GOMYCODE Kenya "Money in Motion" Hackathon 2026.

## 📄 License
MIT License
