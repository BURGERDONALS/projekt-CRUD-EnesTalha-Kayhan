const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database configuration - Uses PostgreSQL in production, SQLite in local
let db;
const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

if (isProduction) {
    // PostgreSQL for production
    const { Pool } = require('pg');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://stocktracker_user:VBl80z6pcfDti6WVw8891QC8LVlzj3xw@dpg-d3psloogjchc73asf1k0-a/stocktracker_3r5s',
        ssl: {
            rejectUnauthorized: false
        }
    });
    
    db = {
        query: (sql, params) => pool.query(sql, params),
        all: (sql, params) => pool.query(sql, params).then(result => result.rows),
        run: (sql, params) => pool.query(sql, params).then(result => ({ lastID: result.rows[0]?.id, changes: result.rowCount }))
    };
    
    console.log('Connected to PostgreSQL database (Production)');
} else {
    // SQLite for local development
    const sqlite3 = require('sqlite3').verbose();
    const sqliteDb = new sqlite3.Database('./stocktracker.db');
    
    db = {
        query: (sql, params) => new Promise((resolve, reject) => {
            sqliteDb.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve({ rows });
            });
        }),
        all: (sql, params) => new Promise((resolve, reject) => {
            sqliteDb.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }),
        run: (sql, params) => new Promise((resolve, reject) => {
            sqliteDb.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ lastID: this.lastID, changes: this.changes });
            });
        })
    };
    
    console.log('Connected to SQLite database (Local Development)');
}

// Initialize database table
async function initializeDatabase() {
    try {
        if (isProduction) {
            await db.query(`
                CREATE TABLE IF NOT EXISTS products (
                    id SERIAL PRIMARY KEY,
                    productCode VARCHAR(50) NOT NULL,
                    product VARCHAR(100) NOT NULL,
                    qty INTEGER NOT NULL,
                    perPrice DECIMAL(10,2) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
        } else {
            await db.run(`
                CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    productCode VARCHAR(50) NOT NULL,
                    product VARCHAR(100) NOT NULL,
                    qty INTEGER NOT NULL,
                    perPrice DECIMAL(10,2) NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
        }
        console.log('Database initialized successfully');
    } catch (err) {
        console.error('Database initialization error:', err);
    }
}
initializeDatabase();

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await db.all('SELECT * FROM products ORDER BY id DESC');
        res.json(products);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add new product
app.post('/api/products', async (req, res) => {
    const { productCode, product, qty, perPrice } = req.body;
    
    if (!productCode || !product || !qty || !perPrice) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    try {
        let result;
        if (isProduction) {
            result = await db.query(
                'INSERT INTO products (productCode, product, qty, perPrice) VALUES ($1, $2, $3, $4) RETURNING *',
                [productCode, product, parseInt(qty), parseFloat(perPrice)]
            );
        } else {
            result = await db.run(
                'INSERT INTO products (productCode, product, qty, perPrice) VALUES (?, ?, ?, ?)',
                [productCode, product, parseInt(qty), parseFloat(perPrice)]
            );
        }
        
        const newProduct = isProduction ? 
            result.rows[0] : 
            { id: result.lastID, productCode, product, qty: parseInt(qty), perPrice: parseFloat(perPrice) };
            
        res.status(201).json(newProduct);
    } catch (err) {
        console.error('Error adding product:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const { productCode, product, qty, perPrice } = req.body;
    
    try {
        let result;
        if (isProduction) {
            result = await db.query(
                'UPDATE products SET productCode = $1, product = $2, qty = $3, perPrice = $4 WHERE id = $5 RETURNING *',
                [productCode, product, parseInt(qty), parseFloat(perPrice), parseInt(id)]
            );
        } else {
            result = await db.run(
                'UPDATE products SET productCode = ?, product = ?, qty = ?, perPrice = ? WHERE id = ?',
                [productCode, product, parseInt(qty), parseFloat(perPrice), parseInt(id)]
            );
        }
        
        if (isProduction ? result.rows.length === 0 : result.changes === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const updatedProduct = isProduction ? 
            result.rows[0] : 
            { id: parseInt(id), productCode, product, qty: parseInt(qty), perPrice: parseFloat(perPrice) };
            
        res.json(updatedProduct);
    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        let result;
        if (isProduction) {
            result = await db.query('DELETE FROM products WHERE id = $1 RETURNING *', [parseInt(id)]);
        } else {
            result = await db.run('DELETE FROM products WHERE id = ?', [parseInt(id)]);
        }
        
        if (isProduction ? result.rows.length === 0 : result.changes === 0) {
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
    console.log(`Environment: ${isProduction ? 'Production (PostgreSQL)' : 'Local (SQLite)'}`);
});