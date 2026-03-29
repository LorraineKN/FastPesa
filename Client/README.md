# Emergency Wallet Frontend

React frontend for the Emergency Wallet System - a phone-independent M-Pesa wallet that allows secure access to funds using just a username and PIN.

## Features

- **Authentication**: Secure login/registration with PIN-based authentication
- **Dashboard**: Real-time wallet balance and quick actions
- **Payments**: Send money to phone numbers via M-Pesa
- **Recharge**: Add funds using M-Pesa STK Push
- **Transaction History**: View and filter all transactions
- **Settings**: Manage account and change PIN
- **Responsive Design**: Works on all devices

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Navigation
- **Zustand** - State management
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **React Hot Toast** - Notifications

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open http://localhost:3000 in your browser

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000/api
```

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── UI/             # Basic UI components (Button, Input)
│   └── wallet/         # Wallet-specific components
├── pages/              # Page components
├── services/           # API services
├── stores/             # Zustand state management
├── utils/              # Utility functions
├── routes/             # Route protection
└── styles/             # Global styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Integration

The frontend connects to the backend API at `/api` endpoints:

- Authentication: `/auth/*`
- Wallet: `/wallet/*`
- Payments: `/pay/*`
- Transactions: `/transactions/*`

## Security Features

- JWT token authentication
- Automatic logout on token expiry
- PIN masking and validation
- Input sanitization
- HTTPS only in production

## Contributing

1. Follow the existing code style
2. Use semantic components
3. Test on multiple screen sizes
4. Validate all user inputs

## License

MIT License
