const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = process.env.PORT || 5000;

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key-for-development';

app.use(cors({
  origin: ['https://stocktrack1.netlify.app', 'https://authpage67829.netlify.app'],
  credentials: true
}));
app.use(express.json());

// Database configuration
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://stocktracker_user:VBl80z6pcfDti6WVw8891QC8LVlzj3xw@dpg-d3psloogjchc73asf1k0-a/stocktracker_3r5s',
  ssl: { rejectUnauthorized: false }
});

const db = {
  query: (sql, params) => pool.query(sql, params),
  all: (sql, params) => pool.query(sql, params).then(result => result.rows),
  run: (sql, params) => pool.query(sql, params).then(result => ({ lastID: result.rows[0]?.id, changes: result.rowCount }))
};

// Initialize database
async function initializeDatabase() {
  try {
    await db.query(`
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
    console.log('✅ StockTrack Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

// Token verification middleware - AYNI JWT_SECRET kullan
function authenticateToken(req, res, next) {
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

// Get all products for authenticated user
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const products = await db.all(
      'SELECT * FROM products WHERE user_email = $1 ORDER BY id DESC',
      [req.user.email]
    );
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add new product
app.post('/api/products', authenticateToken, async (req, res) => {
  const { productCode, product, qty, perPrice } = req.body;
  
  if (!productCode || !product || !qty || !perPrice) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  try {
    const result = await db.query(
      'INSERT INTO products (productCode, product, qty, perPrice, user_email) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [productCode, product, parseInt(qty), parseFloat(perPrice), req.user.email]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product
app.put('/api/products/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { productCode, product, qty, perPrice } = req.body;
  
  try {
    const result = await db.query(
      'UPDATE products SET productCode = $1, product = $2, qty = $3, perPrice = $4 WHERE id = $5 AND user_email = $6 RETURNING *',
      [productCode, product, parseInt(qty), parseFloat(perPrice), parseInt(id), req.user.email]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await db.query(
      'DELETE FROM products WHERE id = $1 AND user_email = $2 RETURNING *',
      [parseInt(id), req.user.email]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User info endpoint - Token validation için
app.get('/api/user-info', authenticateToken, async (req, res) => {
  res.json({
    email: req.user.email,
    role: req.user.role,
    userId: req.user.userId
  });
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Error', 
      database: 'Disconnected',
      error: error.message 
    });
  }
});

// Public endpoint - Herkese açık
app.get('/', (req, res) => {
  res.json({ 
    message: 'StockTrack API is running!',
    endpoints: {
      products: 'GET /api/products (protected)',
      userInfo: 'GET /api/user-info (protected)',
      health: 'GET /health'
    }
  });
});

initializeDatabase();

app.listen(PORT, () => {
  console.log(`🚀 StockTrack Server running on port ${PORT}`);
});