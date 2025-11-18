// backend/src/routes/configRoutes.js
import express from "express";
import fs from "fs";
import mysql from "mysql2/promise";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { encryptJSON, decryptJSON } from "../utils/crypto.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = express.Router();

const CONFIG_DIR = join(__dirname, "../../db");
const CONFIG_FILE = join(CONFIG_DIR, "config.enc.json");

// Ensure db directory exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

/* =====================================================
   SAVE ENCRYPTED CONFIG
===================================================== */
router.post("/database", (req, res) => {
  try {
    const encrypted = encryptJSON(req.body);
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(encrypted, null, 2));

    return res.json({
      success: true,
      message: "Database configuration saved & encrypted.",
    });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

/* =====================================================
   LOAD DECRYPTED CONFIG (password hidden)
===================================================== */
router.get("/database", (req, res) => {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return res.json({ success: false, config: null });
    }

    const encrypted = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    const decrypted = decryptJSON(encrypted);

    const safeConfig = {
      ...decrypted,
      password: "******", // hide password
    };

    return res.json({ success: true, config: safeConfig });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

/* =====================================================
   TEST MYSQL CONNECTION
===================================================== */
router.post("/test-connection", async (req, res) => {
  try {
    const conn = await mysql.createConnection({
      host: req.body.host,
      port: req.body.port,
      user: req.body.user,
      password: req.body.password,
      database: req.body.database,
    });

    await conn.query("SELECT 1");
    await conn.end();

    return res.json({ success: true, message: "MySQL connection successful!" });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

/* =====================================================
   RETURN ALL TABLES (decrypted config)
===================================================== */
router.get("/tables", async (req, res) => {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return res.json({ success: false, error: "No DB config found." });
    }

    const encrypted = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    const cfg = decryptJSON(encrypted);

    const conn = await mysql.createConnection(cfg);

    const [tables] = await conn.query(
      `SELECT 
         TABLE_NAME as table_name,
         TABLE_ROWS as table_rows,
         DATA_LENGTH as data_length,
         INDEX_LENGTH as index_length
       FROM information_schema.tables
       WHERE table_schema = ?`,
      [cfg.database]
    );

    await conn.end();

    return res.json({ success: true, tables });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

/* =====================================================
   RETURN ROWS FROM SPECIFIC TABLE
===================================================== */
router.get("/tables/:table/data", async (req, res) => {
  try {
    const tableName = req.params.table;

    if (!fs.existsSync(CONFIG_FILE)) {
      return res.json({ success: false, error: "No DB config found." });
    }

    const encrypted = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    const cfg = decryptJSON(encrypted);

    const conn = await mysql.createConnection(cfg);

    // Get column names
    const [cols] = await conn.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
       ORDER BY ORDINAL_POSITION`,
      [cfg.database, tableName]
    );

    const columnNames = cols.map((c) => c.COLUMN_NAME);

    // Fetch table data
    const [rows] = await conn.query(`SELECT * FROM \`${tableName}\` LIMIT 200`);

    await conn.end();

    return res.json({
      success: true,
      data: { columns: columnNames, rows },
    });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

export default router;
