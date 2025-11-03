const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://stocktracker_user:VBl80z6pcfDti6WVw8891QC8LVlzj3xw@dpg-d3psloogjchc73asf1k0-a/stocktracker_3r5s',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key-for-development';

// CORS Configuration - DÜZELTİLDİ
const allowedOrigins = [
  'https://stocktrack1.netlify.app',
  'https://authpage67829.netlify.app',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

app.use(cors({
  origin: function (origin, callback) {
    // Origin yoksa (mobile app, postman gibi) izin ver
    if (!origin) return callback(null, true);
    
    // Allow list'teki origin'lere izin ver
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      // Allow list'te yoksa CORS hatası döndür
      return callback(new Error('CORS policy: Origin not allowed'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Middleware
app.use(express.json());

// Initialize database
async function initializeDatabase() {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'USER',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        productCode VARCHAR(50) NOT NULL,
        product VARCHAR(100) NOT NULL,
        qty INTEGER NOT NULL,
        perPrice DECIMAL(10,2) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_user_email ON products(user_email)`);

    // Test user
    const testPasswordHash = await bcrypt.hash('password', 10);
    
    await pool.query(`
      INSERT INTO users (email, password_hash, role) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (email) DO NOTHING
    `, ['test@test.com', testPasswordHash, 'USER']);

    console.log('✅ Database initialized successfully');
    console.log('👤 Test user: test@test.com / password');
    
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

// Token verification middleware - DÜZELTİLDİ
function authenticateToken(req, res, next) {
  // Preflight OPTIONS isteklerini atla
  if (req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// ========== AUTH ROUTES ==========

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'StockTrack & Auth API is running!',
    endpoints: {
      auth: {
        register: 'POST /register',
        login: 'POST /login',
        profile: 'GET /api/profile',
        users: 'GET /api/users'
      },
      products: {
        list: 'GET /api/products',
        create: 'POST /api/products',
        update: 'PUT /api/products/:id',
        delete: 'DELETE /api/products/:id',
        userInfo: 'GET /api/user-info'
      },
      health: 'GET /health'
    }
  });
});

// Register endpoint
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
      [email, passwordHash, 'USER']
    );

    res.status(201).json({ 
      message: 'User created successfully',
      user: newUser.rows[0]
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login endpoint - DÜZELTİLDİ
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      redirectTo: process.env.FRONTEND_URL || 'https://stocktrack1.netlify.app'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Protected auth routes
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ 
    message: 'This is a protected endpoint!',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const usersResult = await pool.query(
      'SELECT id, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(usersResult.rows);
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, email, role, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(userResult.rows[0]);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ========== STOCKTRACK ROUTES ==========

// User info endpoint
app.get('/api/user-info', authenticateToken, async (req, res) => {
  res.json({
    email: req.user.email,
    role: req.user.role,
    userId: req.user.userId
  });
});

// Get all products for authenticated user
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching products for user:', req.user.email);
    
    const products = await pool.query(
      'SELECT * FROM products WHERE user_email = $1 ORDER BY id DESC',
      [req.user.email]
    );
    
    console.log('Products found:', products.rows.length);
    res.json(products.rows);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// Add new product
app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    const { productCode, product, qty, perPrice } = req.body;
    
    console.log('Adding product for user:', req.user.email, 'Data:', { productCode, product, qty, perPrice });
    
    if (!productCode || !product || !qty || !perPrice) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const result = await pool.query(
      'INSERT INTO products (productCode, product, qty, perPrice, user_email) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [productCode, product, parseInt(qty), parseFloat(perPrice), req.user.email]
    );
    
    console.log('Product added successfully:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// Update product
app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { productCode, product, qty, perPrice } = req.body;
    
    console.log('Updating product:', id, 'for user:', req.user.email);
    
    const result = await pool.query(
      'UPDATE products SET productCode = $1, product = $2, qty = $3, perPrice = $4 WHERE id = $5 AND user_email = $6 RETURNING *',
      [productCode, product, parseInt(qty), parseFloat(perPrice), parseInt(id), req.user.email]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    console.log('Product updated successfully:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// Delete product
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Deleting product:', id, 'for user:', req.user.email);
    
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 AND user_email = $2 RETURNING *',
      [parseInt(id), req.user.email]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    console.log('Product deleted successfully');
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// Health check with better error handling
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'Error', 
      database: 'Disconnected',
      error: error.message 
    });
  }
});

// Global error handling middleware - DÜZELTİLDİ
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // CORS hataları için özel handling
  if (err.message === 'CORS policy: Origin not allowed') {
    return res.status(403).json({ 
      error: 'CORS: Origin not allowed',
      allowedOrigins: allowedOrigins
    });
  }
  
  // Diğer hatalar
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Combined Server running on port ${PORT}`);
      console.log(`📍 Health check: http://0.0.0.0:${PORT}/health`);
      console.log(`🔑 Test user: test@test.com / password`);
      console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer().catch(console.error);