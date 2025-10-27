const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// PostgreSQL connection 
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://stocktracker_user:VBl80z6pcfDti6WVw8891QC8LVlzj3xw@dpg-d3psloogjchc73asf1k0-a/stocktracker_3r5s',
  ssl: {
    rejectUnauthorized: false
  }
});

async function initializeDatabase() {
  try 
  {
    const client = await pool.connect();
    // Products
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        productCode VARCHAR(50) NOT NULL,
        product VARCHAR(100) NOT NULL,
        qty INTEGER NOT NULL,
        perPrice DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('PostgreSQL database initialized successfully');
    client.release();
  } 
  catch (err) 
  {
    console.error('Database initialization error:', err);
  }
}
initializeDatabase();

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
    res.json(result.rows);
  } 
  catch (err) 
  {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add new product
app.post('/api/products', async (req, res) => {
  const { productCode, product, qty, perPrice } = req.body;
  
  if (!productCode || !product || !qty || !perPrice) 
  {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  try 
  {
    const result = await pool.query(
      'INSERT INTO products (productCode, product, qty, perPrice) VALUES ($1, $2, $3, $4) RETURNING *',
      [productCode, product, parseInt(qty), parseFloat(perPrice)]
    );
    res.status(201).json(result.rows[0]);
  } 
  catch (err) 
  {
    console.error('Error adding product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { productCode, product, qty, perPrice } = req.body;
  
  try 
  {
    const result = await pool.query(
      'UPDATE products SET productCode = $1, product = $2, qty = $3, perPrice = $4 WHERE id = $5 RETURNING *',
      [productCode, product, parseInt(qty), parseFloat(perPrice), parseInt(id)]
    );
    
    if (result.rows.length === 0) 
    {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [parseInt(id)]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`PostgreSQL database connected`);
});