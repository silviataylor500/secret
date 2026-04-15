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
        email VARCHAR(255) NOT NULL UNIQUE,
        mobile VARCHAR(20) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        investmentAmount DECIMAL(10, 2) DEFAULT 0,
        dailyReturnRate DECIMAL(5, 2) DEFAULT 0.05,
        btcAllocated DECIMAL(16, 8) DEFAULT 0,
        dailyEarnings DECIMAL(10, 2) DEFAULT 0,
        totalEarnings DECIMAL(10, 2) DEFAULT 0,
        role ENUM('user', 'admin', 'co-admin', 'master-admin') DEFAULT 'user',
        chain INT DEFAULT 1,
        unlockedLevel INT DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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

    try {
      await connection.execute(`ALTER TABLE users ADD COLUMN unlockedLevel INT DEFAULT 0`);
      console.log('UnlockedLevel column added to users table');
    } catch (e) {
      console.log('UnlockedLevel column already exists');
    }

    // Create settings table for storing TRC20 address per chain
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        chain INT DEFAULT 1,
        trc20_address VARCHAR(255),
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

    // Create deposits table for tracking user deposits with level support
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS deposits (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        chain INT DEFAULT 1,
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

    const [existingUsers] = await connection.execute('SELECT id FROM users WHERE email = ? OR mobile = ?', [email, mobile]);
    if (existingUsers.length > 0) {
      connection.release();
      return res.status(400).json({ message: 'Email or mobile already exists' });
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

    const [users] = await connection.execute('SELECT * FROM users WHERE email = ? AND mobile = ?', [
      email,
      mobile,
    ]);

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
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, chain: sessionChain } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: `Login failed: ${error.message}` });
  }
});

// Get user profile
app.get('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.execute('SELECT id, name, email, mobile, investmentAmount, dailyReturnRate, btcAllocated, dailyEarnings, totalEarnings, role, chain, unlockedLevel FROM users WHERE id = ?', [req.user.id]);
    connection.release();

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
});

// Admin: Get all users in their chain
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    let query = 'SELECT id, name, email, mobile, investmentAmount, dailyReturnRate, btcAllocated, dailyEarnings, totalEarnings, role, chain, unlockedLevel, createdAt FROM users';
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

// Get TRC20 address for user's chain
app.get('/api/settings/trc20', authMiddleware, async (req, res) => {
  try {
    const { chain } = req.query;
    const connection = await pool.getConnection();
    
    // Determine which chain to fetch
    // Master Admin can specify a chain, otherwise use the user's session chain
    const targetChain = (req.user.role === 'master-admin' && chain) ? parseInt(chain) : req.user.chain;
    
    const [settings] = await connection.execute('SELECT trc20_address FROM settings WHERE chain = ?', [targetChain]);
    connection.release();

    if (settings.length === 0) {
      return res.json({ trc20_address: '' });
    }

    res.json({ trc20_address: settings[0].trc20_address });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch TRC20 address' });
  }
});

// Admin: Set TRC20 address for their chain
app.post('/api/admin/settings/trc20', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { trc20_address, chain } = req.body;

    if (!trc20_address) {
      return res.status(400).json({ message: 'TRC20 address is required' });
    }

    // Determine which chain to update
    // Master Admin can specify a chain, otherwise use the admin's own chain
    const targetChain = (req.user.role === 'master-admin' && chain) ? chain : req.user.chain;

    const connection = await pool.getConnection();

    // Use ON DUPLICATE KEY UPDATE for a more robust update/insert
    await connection.execute(
      'INSERT INTO settings (chain, trc20_address) VALUES (?, ?) ON DUPLICATE KEY UPDATE trc20_address = ?',
      [targetChain, trc20_address, trc20_address]
    );

    connection.release();
    res.json({ message: 'TRC20 address updated successfully' });
  } catch (error) {
    console.error('TRC20 update error:', error.message);
    res.status(500).json({ message: `Failed to update TRC20 address: ${error.message}` });
  }
});

// User: Submit deposit with level
app.post('/api/deposits/submit', authMiddleware, async (req, res) => {
  try {
    const { transactionId, level } = req.body;

    if (!transactionId || level === undefined) {
      return res.status(400).json({ message: 'Transaction ID and level are required' });
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
      'INSERT INTO deposits (id, userId, chain, transactionId, level, status) VALUES (?, ?, ?, ?, ?, ?)',
      [depositId, req.user.id, req.user.chain, transactionId, level, 'pending']
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
      SELECT d.id, d.userId, u.name, u.email, d.transactionId, d.level, d.status, d.createdAt
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

    // Update deposit status
    await connection.execute('UPDATE deposits SET status = ? WHERE id = ?', ['approved', req.params.id]);

    // Update user's unlocked level
    await connection.execute(
      'UPDATE users SET unlockedLevel = ? WHERE id = ?',
      [Math.max(deposit.level, deposit.level), deposit.userId]
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
      SELECT w.id, w.userId, u.name, u.email, w.amount, w.trc20_address, w.status, w.createdAt
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
      SELECT m.id, m.userId, u.name, u.email, m.message, m.senderRole, m.createdAt
      FROM messages m
      JOIN users u ON m.userId = u.id
    `;
    let params = [];

    if (req.user.role !== 'master-admin') {
      query += ' WHERE m.chain = ?';
      params.push(req.user.chain);
    }

    query += ' ORDER BY m.createdAt DESC';

    const [messages] = await connection.execute(query, params);
    connection.release();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch chat messages' });
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

    const messageId = crypto.randomUUID();
    await connection.execute(
      'INSERT INTO messages (id, userId, coAdminId, chain, message, senderRole) VALUES (?, ?, ?, ?, ?, ?)',
      [messageId, userId, req.user.id, req.user.chain, message, 'co-admin']
    );

    connection.release();
    res.json({ message: 'Reply sent successfully' });
  } catch (error) {
    console.error('Chat reply error:', error.message);
    res.status(500).json({ message: `Failed to send reply: ${error.message}` });
  }
});

// Static files
app.use(express.static(path.join(__dirname, '../client/dist/public')));
app.use(express.static(path.join(__dirname, '../client/dist')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
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
