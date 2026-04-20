import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import crypto from 'crypto';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration with support for MYSQL_URL or individual variables
let pool;

async function createDatabasePool() {
  if (process.env.MYSQL_URL) {
    console.log('Using MYSQL_URL for database connection.');
    pool = mysql.createPool(process.env.MYSQL_URL);
  } else {
    console.log('Using individual DB_ environment variables for database connection.');
    const dbConfig = {
      host: process.env.DB_HOST || process.env.MYSQLHOST,
      user: process.env.DB_USER || process.env.MYSQLUSER,
      password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
      database: process.env.DB_NAME || process.env.MYSQLDATABASE,
      port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
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
    
    // Create users table with chain and level support
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          mobile VARCHAR(20) NOT NULL,
          password VARCHAR(255) NOT NULL,
          investmentAmount DECIMAL(10, 2) DEFAULT 0,
          dailyReturnRate DECIMAL(5, 2) DEFAULT 0.05,
          btcAllocated DECIMAL(16, 8) DEFAULT 0,
          dailyEarnings DECIMAL(10, 2) DEFAULT 0,
          totalEarnings DECIMAL(10, 2) DEFAULT 0,
          level0_amount DECIMAL(10, 2) DEFAULT 0,
          level1_amount DECIMAL(10, 2) DEFAULT 0,
          level2_amount DECIMAL(10, 2) DEFAULT 0,
          level3_amount DECIMAL(10, 2) DEFAULT 0,
          level4_amount DECIMAL(10, 2) DEFAULT 0,
          level5_amount DECIMAL(10, 2) DEFAULT 0,
          role ENUM('user', 'admin', 'co-admin', 'master-admin') DEFAULT 'user',
          chain INT DEFAULT 1,
          unlockedLevel INT DEFAULT 0,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_per_chain (email, chain),
          UNIQUE KEY unique_mobile_per_chain (mobile, chain)
        )
      `);

    // Migrate existing role column to support master-admin if it doesn't already
    try {
      await connection.execute(`
        ALTER TABLE users MODIFY role ENUM('user', 'admin', 'co-admin', 'master-admin') DEFAULT 'user'
      `);
      console.log('Role column updated to support master-admin');
    } catch (migrationError) {
      console.log('Role column already supports master-admin or migration skipped');
    }

    // Add chain and unlockedLevel columns if they don't exist
    try {
      await connection.execute(`ALTER TABLE users ADD COLUMN chain INT DEFAULT 1`);
      console.log('Chain column added to users table');
    } catch (e) {
      console.log('Chain column already exists');
    }

    // Remove old unique constraints if they exist to allow same email/mobile on different chains
    try {
      await connection.execute(`ALTER TABLE users DROP INDEX email`);
      console.log('Old email unique index dropped');
    } catch (e) {}
    try {
      await connection.execute(`ALTER TABLE users DROP INDEX mobile`);
      console.log('Old mobile unique index dropped');
    } catch (e) {}

    // Add new composite unique constraints
    try {
      await connection.execute(`ALTER TABLE users ADD UNIQUE KEY unique_user_per_chain (email, chain)`);
      console.log('Composite unique index (email, chain) added');
    } catch (e) {}
    try {
      await connection.execute(`ALTER TABLE users ADD UNIQUE KEY unique_mobile_per_chain (mobile, chain)`);
      console.log('Composite unique index (mobile, chain) added');
    } catch (e) {}

    try {
      await connection.execute(`ALTER TABLE users ADD COLUMN unlockedLevel INT DEFAULT 0`);
      console.log('UnlockedLevel column added to users table');
    } catch (e) {
      console.log('UnlockedLevel column already exists');
    }

    // Add level amount columns if they don't exist
    for (let i = 0; i <= 5; i++) {
      try {
        await connection.execute(`ALTER TABLE users ADD COLUMN level${i}_amount DECIMAL(10, 2) DEFAULT 0`);
        console.log(`level${i}_amount column added to users table`);
      } catch (e) {}
    }

    // Add VIP amount column
    try {
      await connection.execute(`ALTER TABLE users ADD COLUMN vip_amount DECIMAL(10, 2) DEFAULT 0`);
      console.log('vip_amount column added to users table');
    } catch (e) {}

    // MIGRATION: For existing users who have investmentAmount but level0_amount is 0
    // We move their investmentAmount into level0_amount (BASIC level)
    try {
      await connection.execute(`
        UPDATE users 
        SET level0_amount = investmentAmount 
        WHERE investmentAmount > 0 AND level0_amount = 0
      `);
      console.log('Migration: level0_amount populated for existing users');
    } catch (migrationError) {
      console.log('Migration skipped or failed:', migrationError.message);
    }

    // Create settings table for storing TRC20 address and level rates per chain
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        chain INT DEFAULT 1,
        trc20_address VARCHAR(255),
        level1_rate DECIMAL(5, 2) DEFAULT 0.05,
        level2_rate DECIMAL(5, 2) DEFAULT 0.10,
        level3_rate DECIMAL(5, 2) DEFAULT 0.15,
        level4_rate DECIMAL(5, 2) DEFAULT 0.20,
        level5_rate DECIMAL(5, 2) DEFAULT 0.25,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_chain (chain)
      )
    `);

    // Migrate settings table to ensure chain column exists
    try {
      await connection.execute(`ALTER TABLE settings ADD COLUMN chain INT DEFAULT 1`);
      console.log('Chain column added to settings table');
    } catch (e) {
      // Column already exists
    }

    try {
      await connection.execute(`ALTER TABLE settings ADD UNIQUE KEY unique_chain (chain)`);
      console.log('Unique key added to settings table');
    } catch (e) {
      // Key already exists
    }

    // Add level rate columns to settings if they don't exist
    const levelRates = ['level1_rate', 'level2_rate', 'level3_rate', 'level4_rate', 'level5_rate'];
    const defaultRates = [0.05, 0.10, 0.15, 0.20, 0.25];
    for (let i = 0; i < levelRates.length; i++) {
      try {
        await connection.execute(`ALTER TABLE settings ADD COLUMN ${levelRates[i]} DECIMAL(5, 2) DEFAULT ${defaultRates[i]}`);
        console.log(`${levelRates[i]} column added to settings table`);
      } catch (e) {}
    }

    // Create deposits table for tracking user deposits with level support
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS deposits (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        chain INT DEFAULT 1,
        amount DECIMAL(10, 2) DEFAULT 0,
        transactionId VARCHAR(255) NOT NULL,
        level INT DEFAULT 0,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Add level column to deposits if it doesn't exist
    try {
      await connection.execute(`ALTER TABLE deposits ADD COLUMN level INT DEFAULT 0`);
      console.log('Level column added to deposits table');
    } catch (e) {
      console.log('Level column already exists in deposits table');
    }

    // Add chain column to deposits if it doesn't exist
    try {
      await connection.execute(`ALTER TABLE deposits ADD COLUMN chain INT DEFAULT 1`);
      console.log('Chain column added to deposits table');
    } catch (e) {
      console.log('Chain column already exists in deposits table');
    }

    try {
      await connection.execute(`ALTER TABLE deposits ADD COLUMN amount DECIMAL(10, 2) DEFAULT 0`);
      console.log('Amount column added to deposits table');
    } catch (e) {}

    // Create withdrawals table for tracking user withdrawals
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        chain INT DEFAULT 1,
        amount DECIMAL(10, 2) NOT NULL,
        trc20_address VARCHAR(255) NOT NULL,
        status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Add chain column to withdrawals if it doesn't exist
    try {
      await connection.execute(`ALTER TABLE withdrawals ADD COLUMN chain INT DEFAULT 1`);
      console.log('Chain column added to withdrawals table');
    } catch (e) {
      console.log('Chain column already exists in withdrawals table');
    }

    // Create messages table for customer service chat
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        coAdminId VARCHAR(36),
        chain INT DEFAULT 1,
        message TEXT NOT NULL,
        senderRole ENUM('user', 'co-admin') NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (coAdminId) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Add VIP trading columns to users table
    try {
      await connection.execute(`ALTER TABLE users ADD COLUMN tradingIncome DECIMAL(10, 2) DEFAULT 0`);
      console.log('tradingIncome column added to users table');
    } catch (e) {
      console.log('tradingIncome column already exists or error:', e.message);
    }
    try {
      await connection.execute(`ALTER TABLE users ADD COLUMN vipUnlocked TINYINT(1) DEFAULT 0`);
      console.log('vipUnlocked column added to users table');
    } catch (e) {
      console.log('vipUnlocked column already exists or error:', e.message);
    }
    try {
      await connection.execute(`ALTER TABLE users ADD COLUMN vipProfitRate INT DEFAULT 20`);
      console.log('vipProfitRate column added to users table');
    } catch (e) {
      console.log('vipProfitRate column already exists or error:', e.message);
    }

    // Add VIP profit rate to settings table
    try {
      await connection.execute(`ALTER TABLE settings ADD COLUMN vip_profit_rate INT DEFAULT 20`);
      console.log('VIP profit rate column added to settings table');
    } catch (e) {
      console.log('vip_profit_rate column already exists or error:', e.message);
    }

    // Add chain column to messages if it doesn't exist
    try {
      await connection.execute(`ALTER TABLE messages ADD COLUMN chain INT DEFAULT 1`);
      console.log('Chain column added to messages table');
    } catch (e) {
      console.log('Chain column already exists in messages table');
    }

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
    process.exit(1);
  }
}

// Hash password
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Verify password
function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

// Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin middleware (admin or master-admin only)
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'master-admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Co-Admin middleware (co-admin or master-admin only)
const coAdminMiddleware = (req, res, next) => {
  if (req.user.role !== 'co-admin' && req.user.role !== 'master-admin') {
    return res.status(403).json({ message: 'Co-Admin access required' });
  }
  next();
};

// Master Admin middleware
const masterAdminMiddleware = (req, res, next) => {
  if (req.user.role !== 'master-admin') {
    return res.status(403).json({ message: 'Master Admin access required' });
  }
  next();
};

// Routes

// Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, mobile, password, chain } = req.body;

    if (!name || !email || !mobile || !password || !chain) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (chain < 1 || chain > 10) {
      return res.status(400).json({ message: 'Chain must be between 1 and 10' });
    }

    const connection = await pool.getConnection();

    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE (email = ? OR mobile = ?) AND chain = ?',
      [email, mobile, chain]
    );
    if (existingUsers.length > 0) {
      connection.release();
      return res.status(400).json({ message: 'Email or mobile already exists on this chain' });
    }

    const userId = crypto.randomUUID();
    const hashedPassword = hashPassword(password);

    await connection.execute(
      'INSERT INTO users (id, name, email, mobile, password, chain, unlockedLevel) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, name, email, mobile, hashedPassword, chain, 0]
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
    const { email, mobile, password, chain } = req.body;

    if (!email || !mobile || !password || !chain) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const connection = await pool.getConnection();

    // First, try to find the user on the specific chain
    let [users] = await connection.execute('SELECT * FROM users WHERE email = ? AND mobile = ? AND chain = ?', [
      email,
      mobile,
      chain
    ]);

    // If not found on that chain, check if they are a Master Admin on ANY chain
    if (users.length === 0) {
      const [masterAdmins] = await connection.execute('SELECT * FROM users WHERE email = ? AND mobile = ? AND role = ?', [
        email,
        mobile,
        'master-admin'
      ]);
      if (masterAdmins.length > 0) {
        users = masterAdmins;
      }
    }

    if (users.length === 0 || !verifyPassword(password, users[0].password)) {
      connection.release();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify chain (Master Admin can log into any chain, others must match their assigned chain)
    if (user.role !== 'master-admin' && user.chain !== parseInt(chain)) {
      connection.release();
      return res.status(401).json({ message: `This account is assigned to Chain ${user.chain}. Please select the correct chain.` });
    }

    // If Master Admin logs in, update their session chain to the selected one
    const sessionChain = user.role === 'master-admin' ? parseInt(chain) : user.chain;
    const token = Buffer.from(JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      chain: sessionChain,
    })).toString('base64');

    connection.release();
    res.json({ 
      token, 
      userId: user.id,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, chain: sessionChain } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: `Login failed: ${error.message}` });
  }
});

// Get user profile
app.get('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    // Use a more robust query that handles potential missing columns by providing defaults
    const [users] = await connection.execute(`
      SELECT 
        id, name, email, mobile, investmentAmount, dailyReturnRate, btcAllocated, 
        dailyEarnings, totalEarnings, level0_amount, level1_amount, level2_amount, 
        level3_amount, level4_amount, level5_amount, role, chain, unlockedLevel,
        COALESCE(tradingIncome, 0) as tradingIncome,
        COALESCE(vipUnlocked, 0) as vipUnlocked,
        COALESCE(vipProfitRate, 20) as vipProfitRate
      FROM users WHERE id = ?
    `, [req.user.id]);
    connection.release();

    if (users.length === 0) {
      console.log('User profile not found for ID:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Profile fetch error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({ message: `Failed to fetch user profile: ${error.message}` });
  }
});

// Admin: Get all users in their chain
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    let query = `
      SELECT 
        id, name, email, mobile, investmentAmount, dailyReturnRate, btcAllocated, 
        dailyEarnings, totalEarnings, level0_amount, level1_amount, level2_amount, 
        level3_amount, level4_amount, level5_amount, role, chain, unlockedLevel, 
        COALESCE(tradingIncome, 0) as tradingIncome, 
        COALESCE(vipUnlocked, 0) as vipUnlocked, 
        createdAt 
      FROM users
    `;
    let params = [];

    // If not master-admin, only show users from their chain and hide master-admins
    if (req.user.role !== 'master-admin') {
      query += " WHERE chain = ? AND role != 'master-admin'";
      params.push(req.user.chain);
    }

    const [users] = await connection.execute(query, params);
    connection.release();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Admin: Update user investment/return rate and role
app.put('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { investmentAmount, dailyReturnRate, btcAllocated, role, chain } = req.body;
    const dailyEarnings = (investmentAmount * dailyReturnRate) / 100;

    // Role-based restrictions:
    // 1. Only Admin and Master Admin can change roles.
    // 2. Co-Admin cannot change roles.
    if (role && req.user.role === 'co-admin') {
      return res.status(403).json({ message: 'Co-Admins are not allowed to change user roles' });
    }

    // 3. Only Master Admin can assign 'master-admin' role.
    if (role === 'master-admin' && req.user.role !== 'master-admin') {
      return res.status(403).json({ message: 'Only Master Admin can assign Master Admin role' });
    }

    // Validate role if provided
    const validRoles = ['user', 'admin', 'co-admin', 'master-admin'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    const connection = await pool.getConnection();

    // Check if target user is a master-admin (only master-admin can edit another master-admin)
    const [targetUser] = await connection.execute('SELECT role FROM users WHERE id = ?', [req.params.id]);
    if (targetUser.length > 0 && targetUser[0].role === 'master-admin' && req.user.role !== 'master-admin') {
      connection.release();
      return res.status(403).json({ message: 'You do not have permission to edit a Master Admin' });
    }

    // If role is provided, update it; otherwise just update the financial fields
    if (role || chain) {
      let updateQuery = 'UPDATE users SET investmentAmount = ?, dailyReturnRate = ?, btcAllocated = ?, dailyEarnings = ?';
      let params = [investmentAmount, dailyReturnRate, btcAllocated, dailyEarnings];

      if (role) {
        updateQuery += ', role = ?';
        params.push(role);
      }

      if (chain && req.user.role === 'master-admin') {
        updateQuery += ', chain = ?';
        params.push(chain);
      }

      updateQuery += ' WHERE id = ?';
      params.push(req.params.id);

      await connection.execute(updateQuery, params);
    } else {
      await connection.execute(
        'UPDATE users SET investmentAmount = ?, dailyReturnRate = ?, btcAllocated = ?, dailyEarnings = ? WHERE id = ?',
        [investmentAmount, dailyReturnRate, btcAllocated, dailyEarnings, req.params.id]
      );
    }

    connection.release();
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('User update error:', error.message);
    res.status(500).json({ message: `Failed to update user: ${error.message}` });
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

// Get settings (TRC20 and level rates) for a chain
app.get('/api/settings/all', authMiddleware, async (req, res) => {
  try {
    const { chain } = req.query;
    const connection = await pool.getConnection();
    
    const targetChain = (req.user.role === 'master-admin' && chain) ? parseInt(chain) : req.user.chain;
    
    const [settings] = await connection.execute(
      'SELECT trc20_address, level1_rate, level2_rate, level3_rate, level4_rate, level5_rate FROM settings WHERE chain = ?',
      [targetChain]
    );
    connection.release();

    if (settings.length === 0) {
      return res.json({
        trc20_address: '',
        level1_rate: 0.05,
        level2_rate: 0.10,
        level3_rate: 0.15,
        level4_rate: 0.20,
        level5_rate: 0.25
      });
    }

    res.json(settings[0]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

// Legacy endpoint for backward compatibility
app.get('/api/settings/trc20', authMiddleware, async (req, res) => {
  try {
    const { chain } = req.query;
    const connection = await pool.getConnection();
    const targetChain = (req.user.role === 'master-admin' && chain) ? parseInt(chain) : req.user.chain;
    const [settings] = await connection.execute('SELECT trc20_address FROM settings WHERE chain = ?', [targetChain]);
    connection.release();
    res.json({ trc20_address: settings.length > 0 ? settings[0].trc20_address : '' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch TRC20 address' });
  }
});

// Admin: Update settings (TRC20 and level rates) for their chain
app.post('/api/admin/settings/update', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { trc20_address, level1_rate, level2_rate, level3_rate, level4_rate, level5_rate, chain } = req.body;

    const targetChain = (req.user.role === 'master-admin' && chain) ? chain : req.user.chain;
    const connection = await pool.getConnection();

    // Use ON DUPLICATE KEY UPDATE to handle both insert and update
    await connection.execute(`
      INSERT INTO settings (
        chain, trc20_address, level1_rate, level2_rate, level3_rate, level4_rate, level5_rate
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        trc20_address = VALUES(trc20_address),
        level1_rate = VALUES(level1_rate),
        level2_rate = VALUES(level2_rate),
        level3_rate = VALUES(level3_rate),
        level4_rate = VALUES(level4_rate),
        level5_rate = VALUES(level5_rate)
    `, [
      targetChain,
      trc20_address || '',
      level1_rate || 0.05,
      level2_rate || 0.10,
      level3_rate || 0.15,
      level4_rate || 0.20,
      level5_rate || 0.25
    ]);

    connection.release();
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Settings update error:', error.message);
    res.status(500).json({ message: `Failed to update settings: ${error.message}` });
  }
});

// Legacy endpoint for backward compatibility
app.post('/api/admin/settings/trc20', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { trc20_address, chain } = req.body;
    const targetChain = (req.user.role === 'master-admin' && chain) ? chain : req.user.chain;
    const connection = await pool.getConnection();
    await connection.execute(
      'INSERT INTO settings (chain, trc20_address) VALUES (?, ?) ON DUPLICATE KEY UPDATE trc20_address = ?',
      [targetChain, trc20_address, trc20_address]
    );
    connection.release();
    res.json({ message: 'TRC20 address updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update TRC20 address' });
  }
});

// User: Submit deposit with level
app.post('/api/deposits/submit', authMiddleware, async (req, res) => {
  try {
    const { transactionId, level, amount } = req.body;

    if (!transactionId || level === undefined || !amount) {
      return res.status(400).json({ message: 'Amount, Transaction ID and level are required' });
    }

    if (transactionId.length < 5 || transactionId.length > 30 || !/^[a-zA-Z0-9]+$/.test(transactionId)) {
      return res.status(400).json({ message: 'Transaction ID must be 5-30 alphanumeric characters' });
    }

    if (level < 0 || level > 5) {
      return res.status(400).json({ message: 'Level must be between 0 (Basic) and 5' });
    }

    const connection = await pool.getConnection();

    const depositId = crypto.randomUUID();
    await connection.execute(
      'INSERT INTO deposits (id, userId, chain, amount, transactionId, level, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [depositId, req.user.id, req.user.chain, amount, transactionId, level, 'pending']
    );

    connection.release();
    res.json({ message: 'Deposit submitted successfully' });
  } catch (error) {
    console.error('Deposit submission error:', error.message);
    res.status(500).json({ message: `Failed to submit deposit: ${error.message}` });
  }
});

// Admin: Get deposits for their chain
app.get('/api/admin/deposits', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    let query = `
      SELECT d.id, d.userId, u.name, u.email, d.amount, d.transactionId, d.level, d.status, d.createdAt, d.chain
      FROM deposits d
      JOIN users u ON d.userId = u.id
    `;
    let params = [];

    if (req.user.role !== 'master-admin') {
      query += ' WHERE d.chain = ?';
      params.push(req.user.chain);
    }

    query += ' ORDER BY d.createdAt DESC';

    const [deposits] = await connection.execute(query, params);
    connection.release();
    res.json(deposits);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch deposits' });
  }
});

// Helper to get BTC price
async function getBtcPrice() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    return response.data.bitcoin.usd;
  } catch (error) {
    console.error('Failed to fetch BTC price:', error);
    return 65000; // Fallback
  }
}

// Admin: Approve deposit
app.post('/api/admin/deposits/:id/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // Get deposit details
    const [deposits] = await connection.execute('SELECT * FROM deposits WHERE id = ?', [req.params.id]);
    if (deposits.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Deposit not found' });
    }

    const deposit = deposits[0];
    if (deposit.status !== 'pending') {
      connection.release();
      return res.status(400).json({ message: 'Deposit is already processed' });
    }

    // Update deposit status
    await connection.execute('UPDATE deposits SET status = ? WHERE id = ?', ['approved', req.params.id]);

    // Get the rate for this level from settings
    const [settings] = await connection.execute('SELECT * FROM settings WHERE chain = ?', [deposit.chain]);
    let newRate = 0.05; // Default basic rate
    if (deposit.level === 6) {
      newRate = 80.00; // Fixed VIP Trading rate
    } else if (settings.length > 0 && deposit.level > 0) {
      newRate = settings[0][`level${deposit.level}_rate`] || 0.05;
    }

    // Get current user data
    const [users] = await connection.execute('SELECT * FROM users WHERE id = ?', [deposit.userId]);
    const user = users[0];

    const newInvestmentAmount = parseFloat(user.investmentAmount) + parseFloat(deposit.amount);
    const btcPrice = await getBtcPrice();
    const newBtcAllocated = newInvestmentAmount / btcPrice;
    const levelCol = deposit.level === 6 ? 'vip_amount' : `level${deposit.level}_amount`;
    const newLevelAmount = parseFloat(user[levelCol] || 0) + parseFloat(deposit.amount);

    // Update user's unlocked level, daily return rate, investment amounts, and BTC allocation
    await connection.execute(
      `UPDATE users SET 
        unlockedLevel = GREATEST(unlockedLevel, ?), 
        dailyReturnRate = GREATEST(dailyReturnRate, ?),
        investmentAmount = ?,
        btcAllocated = ?,
        ${levelCol} = ?
      WHERE id = ?`,
      [deposit.level, newRate, newInvestmentAmount, newBtcAllocated, newLevelAmount, deposit.userId]
    );

    connection.release();
    res.json({ message: 'Deposit approved successfully' });
  } catch (error) {
    console.error('Deposit approval error:', error.message);
    res.status(500).json({ message: `Failed to approve deposit: ${error.message}` });
  }
});

// Admin: Reject deposit
app.post('/api/admin/deposits/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.execute('UPDATE deposits SET status = ? WHERE id = ?', ['rejected', req.params.id]);
    connection.release();
    res.json({ message: 'Deposit rejected successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject deposit' });
  }
});

// User: Submit withdrawal
app.post('/api/withdrawals/submit', authMiddleware, async (req, res) => {
  try {
    const { amount, trc20_address } = req.body;

    if (!amount || !trc20_address) {
      return res.status(400).json({ message: 'Amount and TRC20 address are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const connection = await pool.getConnection();

    const withdrawalId = crypto.randomUUID();
    await connection.execute(
      'INSERT INTO withdrawals (id, userId, chain, amount, trc20_address, status) VALUES (?, ?, ?, ?, ?, ?)',
      [withdrawalId, req.user.id, req.user.chain, amount, trc20_address, 'pending']
    );

    connection.release();
    res.json({ message: 'Withdrawal submitted successfully' });
  } catch (error) {
    console.error('Withdrawal submission error:', error.message);
    res.status(500).json({ message: `Failed to submit withdrawal: ${error.message}` });
  }
});

// Admin: Get withdrawals for their chain
app.get('/api/admin/withdrawals', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    let query = `
      SELECT w.id, w.userId, u.name, u.email, w.amount, w.trc20_address, w.status, w.createdAt, w.chain
      FROM withdrawals w
      JOIN users u ON w.userId = u.id
    `;
    let params = [];

    if (req.user.role !== 'master-admin') {
      query += ' WHERE w.chain = ?';
      params.push(req.user.chain);
    }

    query += ' ORDER BY w.createdAt DESC';

    const [withdrawals] = await connection.execute(query, params);
    connection.release();
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch withdrawals' });
  }
});

// Admin: Approve withdrawal
app.post('/api/admin/withdrawals/:id/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.execute('UPDATE withdrawals SET status = ? WHERE id = ?', ['approved', req.params.id]);
    connection.release();
    res.json({ message: 'Withdrawal approved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to approve withdrawal' });
  }
});

// Admin: Reject withdrawal
app.post('/api/admin/withdrawals/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.execute('UPDATE withdrawals SET status = ? WHERE id = ?', ['rejected', req.params.id]);
    connection.release();
    res.json({ message: 'Withdrawal rejected successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject withdrawal' });
  }
});

// User: Submit chat message
app.post('/api/chat/send', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const connection = await pool.getConnection();

    const messageId = crypto.randomUUID();
    await connection.execute(
      'INSERT INTO messages (id, userId, chain, message, senderRole) VALUES (?, ?, ?, ?, ?)',
      [messageId, req.user.id, req.user.chain, message, 'user']
    );

    connection.release();
    res.json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Chat message error:', error.message);
    res.status(500).json({ message: `Failed to send message: ${error.message}` });
  }
});

// Co-Admin: Get chat messages for their chain
app.get('/api/admin/chat', authMiddleware, coAdminMiddleware, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    let query = `
      SELECT m.id, m.userId, u.name, u.email, m.message, m.senderRole, m.createdAt, m.chain
      FROM messages m
      JOIN users u ON m.userId = u.id
    `;
    let params = [];

    if (req.user.role !== 'master-admin') {
      query += ' WHERE m.chain = ?';
      params.push(req.user.chain);
    }

    query += ' ORDER BY m.createdAt ASC';

    const [messages] = await connection.execute(query, params);
    connection.release();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch chat messages' });
  }
});

// User: Get their own chat messages
app.get('/api/chat/messages', authMiddleware, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [messages] = await connection.execute(
      'SELECT id, userId, message, senderRole, createdAt FROM messages WHERE userId = ? AND chain = ? ORDER BY createdAt ASC',
      [req.user.id, req.user.chain]
    );
    connection.release();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Co-Admin: Send chat reply
app.post('/api/admin/chat/reply', authMiddleware, coAdminMiddleware, async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ message: 'User ID and message are required' });
    }

    const connection = await pool.getConnection();

    // Get the user's chain to ensure the reply is sent to the correct chain
    const [users] = await connection.execute('SELECT chain FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'User not found' });
    }
    const userChain = users[0].chain;

    const messageId = crypto.randomUUID();
    await connection.execute(
      'INSERT INTO messages (id, userId, coAdminId, chain, message, senderRole) VALUES (?, ?, ?, ?, ?, ?)',
      [messageId, userId, req.user.id, userChain, message, 'co-admin']
    );

    connection.release();
    res.json({ message: 'Reply sent successfully' });
  } catch (error) {
    console.error('Chat reply error:', error.message);
    res.status(500).json({ message: `Failed to send reply: ${error.message}` });
  }
});

// Co-Admin: Send mass message to all users in a specific chain
app.post('/api/admin/chat/mass-message', authMiddleware, coAdminMiddleware, async (req, res) => {
  try {
    const { chain, message } = req.body;

    if (!chain || !message) {
      return res.status(400).json({ message: 'Chain and message are required' });
    }

    const targetChain = parseInt(chain);
    const connection = await pool.getConnection();

    // Get all users in the target chain
    const [users] = await connection.execute('SELECT id FROM users WHERE chain = ? AND role = "user"', [targetChain]);
    
    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'No users found in this chain' });
    }

    // Insert a message for each user
    const queries = users.map(user => {
      const messageId = crypto.randomUUID();
      return connection.execute(
        'INSERT INTO messages (id, userId, coAdminId, chain, message, senderRole) VALUES (?, ?, ?, ?, ?, ?)',
        [messageId, user.id, req.user.id, targetChain, message, 'co-admin']
      );
    });

    await Promise.all(queries);

    connection.release();
    res.json({ message: `Mass message sent to ${users.length} users in Chain ${targetChain}` });
  } catch (error) {
    console.error('Mass message error:', error.message);
    res.status(500).json({ message: `Failed to send mass message: ${error.message}` });
  }
});

// VIP Trading: Execute trade
app.post('/api/trading/execute', authMiddleware, async (req, res) => {
  const { amount } = req.body;
  const userId = req.user.id;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid trade amount' });
  }

  try {
    const connection = await pool.getConnection();
    
    // Check if user has VIP unlocked
    const [userRows] = await connection.execute('SELECT vipUnlocked, chain FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0 || !userRows[0].vipUnlocked) {
      connection.release();
      return res.status(403).json({ message: 'VIP Trading is locked for your account' });
    }

    // Get profit rate from user record
    const [userRecord] = await connection.execute('SELECT vipProfitRate FROM users WHERE id = ?', [userId]);
    const profitRate = userRecord.length > 0 ? userRecord[0].vipProfitRate : 20;
    
    const profit = (amount * profitRate) / 100;
    
    // Update user's trading income
    await connection.execute(
      'UPDATE users SET tradingIncome = tradingIncome + ? WHERE id = ?',
      [profit, userId]
    );
    
    connection.release();
    res.json({ 
      message: 'Trade executed successfully',
      profit: profit,
      profitRate: profitRate
    });
  } catch (error) {
    console.error('Trading execution error:', error);
    res.status(500).json({ message: 'Failed to execute trade' });
  }
});

// Admin: Update VIP status and individual profit rate
app.put('/api/admin/users/:id/vip', authMiddleware, adminMiddleware, async (req, res) => {
  const { vipUnlocked, vipProfitRate } = req.body;
  const userId = req.params.id;

  try {
    const connection = await pool.getConnection();
    if (vipProfitRate !== undefined) {
      await connection.execute('UPDATE users SET vipUnlocked = ?, vipProfitRate = ? WHERE id = ?', [vipUnlocked, vipProfitRate, userId]);
    } else {
      await connection.execute('UPDATE users SET vipUnlocked = ? WHERE id = ?', [vipUnlocked, userId]);
    }
    connection.release();
    res.json({ message: 'VIP settings updated successfully' });
  } catch (error) {
    console.error('Update VIP status error:', error);
    res.status(500).json({ message: 'Failed to update VIP status' });
  }
});

app.post('/api/admin/settings/vip-rate', authMiddleware, adminMiddleware, async (req, res) => {
  const { chain, profitRate } = req.body;
  
  try {
    const connection = await pool.getConnection();
    await connection.execute(
      'INSERT INTO settings (chain, vip_profit_rate) VALUES (?, ?) ON DUPLICATE KEY UPDATE vip_profit_rate = ?',
      [chain, profitRate, profitRate]
    );
    connection.release();
    res.json({ message: 'VIP profit rate updated successfully' });
  } catch (error) {
    console.error('Update VIP rate error:', error);
    res.status(500).json({ message: 'Failed to update VIP profit rate' });
  }
});

// Static files configuration
const rootDistPath = path.resolve(process.cwd(), 'dist/public');
const clientDistPath = path.resolve(process.cwd(), 'client/dist/public');

console.log('\n=== STATIC FILES DIAGNOSTIC ===');
console.log('CWD:', process.cwd());
console.log('Root Dist Path:', rootDistPath, fs.existsSync(rootDistPath) ? '(Exists)' : '(Missing)');
console.log('Client Dist Path:', clientDistPath, fs.existsSync(clientDistPath) ? '(Exists)' : '(Missing)');

// Serve static files from both potential locations to be safe
if (fs.existsSync(rootDistPath)) {
  console.log('Serving static files from Root Dist Path');
  app.use(express.static(rootDistPath));
  app.use('/assets', express.static(path.join(rootDistPath, 'assets')));
}
if (fs.existsSync(clientDistPath)) {
  console.log('Serving static files from Client Dist Path');
  app.use(express.static(clientDistPath));
  app.use('/assets', express.static(path.join(clientDistPath, 'assets')));
}

// Set the primary distPath for the SPA fallback
const distPath = fs.existsSync(rootDistPath) ? rootDistPath : clientDistPath;
console.log('Primary SPA Dist Path:', distPath);
console.log('=== END DIAGNOSTIC ===\n');

app.get('*', (req, res) => {
  console.log(`[Request] ${req.method} ${req.path}`);
  
  if (req.path.startsWith('/api')) {
    console.log(`  -> 404 API Not Found`);
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  
  if (req.path.startsWith('/assets/')) {
    console.log(`  -> 404 Asset Not Found: ${req.path}`);
    return res.status(404).send('Asset not found');
  }
  
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error('CRITICAL: index.html not found at', indexPath);
    res.status(404).send('Frontend build not found. Please ensure "npm run build" completed successfully.');
  }
});

// Start server
async function startServer() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
