# Crypto Passive Income Simulator

A professional Binance-style crypto passive income simulator with authentication and real-time BTC prices.

## Features

✅ Binance-style dark theme UI
✅ Real-time BTC price from CoinGecko API
✅ User authentication (signup/login)
✅ User dashboards with investment tracking
✅ MySQL database integration
✅ JWT token-based authentication
✅ Fully responsive design
✅ PBKDF2 password hashing

## Quick Start

### Prerequisites

- Node.js 16+ installed
- MySQL server running locally
- npm or yarn package manager

### Installation

```bash
# 1. Extract the project
tar -xzf crypto-passive-income-simulator.tar.gz
cd crypto-passive-income-simulator

# 2. Install dependencies
npm install

# 3. Build the frontend
npm run build

# 4. Start backend server (Terminal 1)
npm run server

# 5. Start frontend dev server (Terminal 2)
npm run dev

# 6. Open browser
http://localhost:3000
```

## Project Structure

```
crypto-passive-income-simulator/
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/            # Home, Signup, Login, Dashboard
│   │   ├── App.tsx           # Routes
│   │   ├── main.tsx          # Entry point
│   │   └── index.css         # Global styles
│   └── index.html
├── server/
│   └── index.js              # Express backend
├── package.json              # Dependencies
├── vite.config.ts            # Vite config
├── tsconfig.json             # TypeScript config
├── tailwind.config.js        # Tailwind config
└── README.md
```

## Available Scripts

```bash
npm run dev       # Start frontend dev server (port 3000)
npm run build     # Build frontend for production
npm run server    # Start backend server (port 5000)
npm run start     # Build and start server
npm run preview   # Preview production build
```

## Database Setup

The database is automatically initialized on first run. It creates a `users` table with the following fields:

- id (UUID)
- name, email, mobile
- password (hashed)
- investmentAmount, dailyReturnRate
- btcAllocated, dailyEarnings, totalEarnings
- role (user/admin)
- timestamps

## API Endpoints

### Authentication

**POST** `/api/auth/signup`
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "+1234567890",
  "password": "password123"
}
```

**POST** `/api/auth/login`
```json
{
  "email": "john@example.com",
  "mobile": "+1234567890",
  "password": "password123"
}
```

### User

**GET** `/api/user/profile`
- Requires: `Authorization: Bearer <token>`
- Returns: User profile with investment data

## Testing

1. **Sign Up**: Create a new account
2. **Log In**: Use your credentials
3. **Dashboard**: View investment summary
4. **Logout**: Return to home page

## Environment Variables

Create a `.env` file (optional):

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=crypto_simulator
JWT_SECRET=your_secret_key
```

## Deployment

### Railway

1. Push to GitHub
2. Connect to Railway.app
3. Add MySQL plugin
4. Set environment variables
5. Deploy!

See DEPLOYMENT_GUIDE.md for detailed instructions.

## Security Notes

- Passwords are hashed with PBKDF2
- JWT tokens expire after 7 days
- All API endpoints require authentication
- Never commit `.env` files

## Troubleshooting

### Port already in use

```bash
# Change port
PORT=5001 npm run server
```

### Database connection error

```bash
# Ensure MySQL is running
mysql -u root -p

# Check database credentials in .env
```

### Build fails

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

## License

MIT

## Support

For issues or questions, please create an issue on GitHub.
