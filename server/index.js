import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration with support for MYSQL_URL or individual variables
let pool;

async function createDatabasePool() {
  if (!process.env.MYSQL_URL) {
    throw new Error("MYSQL_URL is not set");
  }

  console.log("Using MYSQL_URL");

  pool = mysql.createPool(process.env.MYSQL_URL);
};

    // Log database configuration (excluding password) for debugging
    console.log('Database Configuration:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port,
    });

    if (!dbConfig.host || !dbConfig.user || !dbConfig.database) {
      console.error('CRITICAL ERROR: Missing required database environment variables.');
      console.error('Please ensure MYSQL_URL or (DB_HOST, DB_USER, DB_NAME) are set in your Railway App Service variables.');
    }
    pool = mysql.createPool(dbConfig);
  }
}

// Initialize database
async function initDatabase() {
  try {
    await createDatabasePool();
    console.log('Attempting to connect to the database...');
    const connection = await pool.getConnection();
    console.log('Successfully connected to the database.');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        mobile VARCHAR(20) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        investmentAmount DECIMAL(10, 2) DEFAULT 0,
        dailyReturnRate DECIMAL(5, 2) DEFAULT 0.05,
        btcAllocated DECIMAL(16, 8) DEFAULT 0,
        dailyEarnings DECIMAL(10, 2) DEFAULT 0,
        totalEarnings DECIMAL(10, 2) DEFAULT 0,
        role ENUM('user', 'admin') DEFAULT 'user',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    connection.release();
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('DATABASE INITIALIZATION ERROR:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused. Please check if your database host and port are correct.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Access denied. Please check your database user and password.');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('Database does not exist. Please check your database name.');
    }
  }
}

// Hash password
function hashPassword(password) {
  return crypto
    .pbkdf2Sync(password, 'salt', 1000, 64, 'sha512')
    .toString('hex');
}

// Verify password
function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

// Generate JWT token
function generateToken(userId) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    })
  ).toString('base64');
  const signature = crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'secret')
    .update(`${header}.${payload}`)
    .digest('base64');
  return `${header}.${payload}.${signature}`;
}

// Verify JWT token
function verifyToken(token) {
  try {
    const [header, payload, signature] = token.split('.');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'secret')
      .update(`${header}.${payload}`)
      .digest('base64');

    if (signature !== expectedSignature) return null;

    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    if (decoded.exp < Math.floor(Date.now() / 1000)) return null;

    return { userId: decoded.userId };
  } catch {
    return null;
  }
}

// Auth middleware
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  req.userId = decoded.userId;
  next();
}

// Admin Middleware
async function adminMiddleware(req, res, next) {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.execute('SELECT role FROM users WHERE id = ?', [req.userId]);
    connection.release();

    if (users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Routes

// Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const connection = await pool.getConnection();

    const [existing] = await connection.execute('SELECT id FROM users WHERE email = ? OR mobile = ?', [
      email,
      mobile,
    ]);

    if (existing.length > 0) {
      connection.release();
      return res.status(400).json({ message: 'User already exists' });
    }

    const userId = crypto.randomUUID();
    const hashedPassword = hashPassword(password);

    await connection.execute(
      'INSERT INTO users (id, name, email, mobile, password) VALUES (?, ?, ?, ?, ?)',
      [userId, name, email, mobile, hashedPassword]
    );

    connection.release();
    res.json({ message: 'Signup successful' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: `Signup failed: ${error.message}` });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, mobile, password } = req.body;

    if (!email || !mobile || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const connection = await pool.getConnection();

    const [users] = await connection.execute('SELECT * FROM users WHERE email = ? AND mobile = ?', [
      email,
      mobile,
    ]);

    connection.release();

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    if (!verifyPassword(password, user.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user.id);
    res.json({ token, userId: user.id });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get user profile
app.get('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [users] = await connection.execute('SELECT * FROM users WHERE id = ?', [req.userId]);

    connection.release();

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      investmentAmount: user.investmentAmount,
      dailyReturnRate: user.dailyReturnRate,
      btcAllocated: user.btcAllocated,
      dailyEarnings: user.dailyEarnings,
      totalEarnings: user.totalEarnings,
      role: user.role,
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Admin: Get all users
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.execute('SELECT id, name, email, mobile, investmentAmount, dailyReturnRate, btcAllocated, dailyEarnings, totalEarnings, role, createdAt FROM users');
    connection.release();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Admin: Update user investment/return rate
app.put('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { investmentAmount, dailyReturnRate, btcAllocated } = req.body;
    const dailyEarnings = (investmentAmount * dailyReturnRate) / 100;
    
    const connection = await pool.getConnection();
    await connection.execute(
      'UPDATE users SET investmentAmount = ?, dailyReturnRate = ?, btcAllocated = ?, dailyEarnings = ? WHERE id = ?',
      [investmentAmount, dailyReturnRate, btcAllocated, dailyEarnings, req.params.id]
    );
    connection.release();
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Admin: Delete user
app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    connection.release();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, '../dist/public')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/public/index.html'));
});

// Start server
async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch(console.error);
