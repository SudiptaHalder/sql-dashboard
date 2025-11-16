import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import MySQL from 'mysql2';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = express.Router();
const configPath = join(__dirname, '../../db/config.json');

// Ensure db directory exists
try {
  mkdirSync(dirname(configPath), { recursive: true });
} catch (error) {
  console.log('DB directory already exists');
}

// Safe connection cleanup
const safeEndConnection = (connection) => {
  if (connection && connection.state !== 'disconnected') {
    try {
      connection.end();
    } catch (error) {
      console.log('Connection already closed');
    }
  }
};

// Test database connection
router.post('/test-connection', async (req, res) => {
  let connection;
  try {
    const { host, port, user, password, database } = req.body;
    
    console.log('Testing connection to:', { host, port, database, user });
    
    connection = MySQL.createConnection({
      host: host || 'localhost',
      port: port || 3306,
      user: user || 'root',
      password: password || '',
      database: database || '',
      connectTimeout: 5000,
      insecureAuth: true
    });

    await new Promise((resolve, reject) => {
      connection.connect(err => {
        if (err) reject(err);
        else resolve();
      });
    });

    const [results] = await connection.promise().execute('SELECT 1 as test');
    safeEndConnection(connection);

    res.json({ success: true, message: 'Database connection successful!' });
  } catch (error) {
    safeEndConnection(connection);
    res.json({ success: false, error: error.message });
  }
});

// Get all tables in database
router.get('/tables', async (req, res) => {
  let connection;
  try {
    const configPath = join(__dirname, '../../db/config.json');
    if (!existsSync(configPath)) {
      return res.json({ success: false, error: 'Database not configured' });
    }

    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    connection = MySQL.createConnection({
      host: config.host,
      port: config.port || 3306,
      user: config.user,
      password: config.password,
      database: config.database,
      connectTimeout: 5000,
      insecureAuth: true
    });

    await new Promise((resolve, reject) => {
      connection.connect(err => {
        if (err) reject(err);
        else resolve();
      });
    });

    const [tables] = await connection.promise().execute(`
      SELECT 
        TABLE_NAME as table_name,
        TABLE_ROWS as table_rows,
        DATA_LENGTH as data_length,
        INDEX_LENGTH as index_length
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [config.database]);

    safeEndConnection(connection);
    res.json({ success: true, tables });
  } catch (error) {
    safeEndConnection(connection);
    res.json({ success: false, error: error.message });
  }
});

// Get table data
router.get('/tables/:tableName/data', async (req, res) => {
  let connection;
  try {
    const { tableName } = req.params;
    const configPath = join(__dirname, '../../db/config.json');
    
    if (!existsSync(configPath)) {
      return res.json({ success: false, error: 'Database not configured' });
    }

    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    connection = MySQL.createConnection({
      host: config.host,
      port: config.port || 3306,
      user: config.user,
      password: config.password,
      database: config.database,
      connectTimeout: 5000,
      insecureAuth: true
    });

    await new Promise((resolve, reject) => {
      connection.connect(err => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Get column names
    const [columns] = await connection.promise().execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `, [config.database, tableName]);

    const columnNames = columns.map((col) => col.COLUMN_NAME);

    // Get table data
    const [rows] = await connection.promise().execute(
      `SELECT * FROM ?? LIMIT 100`,
      [tableName]
    );

    safeEndConnection(connection);

    res.json({
      success: true,
      data: {
        columns: columnNames,
        rows: rows
      }
    });
  } catch (error) {
    safeEndConnection(connection);
    res.json({ success: false, error: error.message });
  }
});

// Save database configuration
router.post('/database', async (req, res) => {
  try {
    const { host, port, user, password, database } = req.body;
    
    const config = {
      host: host || 'localhost',
      port: port || 3306,
      user: user || 'root',
      password: password || '',
      database: database || ''
    };
    
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('Database configuration saved');
    
    res.json({ success: true, message: 'Database configuration saved!' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Get database configuration
router.get('/database', (req, res) => {
  try {
    if (existsSync(configPath)) {
      const config = JSON.parse(readFileSync(configPath, 'utf8'));
      res.json({ success: true, config: { ...config, password: '***' } });
    } else {
      res.json({ success: false, config: null });
    }
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

export default router;