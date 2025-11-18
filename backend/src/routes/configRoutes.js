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

// Ensure config directory exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

/* ────────────────────────────────────────────────────────────────
   SAVE CONFIG (Encrypted)
────────────────────────────────────────────────────────────────── */
router.post("/database", async (req, res) => {
  try {
    const encrypted = encryptJSON(req.body);
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(encrypted, null, 2));

    res.json({ success: true, message: "Configuration saved (encrypted)." });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

/* ────────────────────────────────────────────────────────────────
   LOAD CONFIG (Decrypted)
────────────────────────────────────────────────────────────────── */
router.get("/database", (req, res) => {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return res.json({ success: false, config: null });
    }

    const encrypted = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    const decrypted = decryptJSON(encrypted);

    // Mask password on UI
    decrypted.password = "******";

    res.json({ success: true, config: decrypted });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

/* ────────────────────────────────────────────────────────────────
   TEST CONNECTION (Frontend Test Button)
────────────────────────────────────────────────────────────────── */
router.post("/test-connection", async (req, res) => {
  try {
    const { host, port, user, password, database } = req.body;

    const conn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
    });

    await conn.query("SELECT 1");
    conn.end();

    res.json({ success: true, message: "MySQL connection successful!" });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

/* ────────────────────────────────────────────────────────────────
   GET TABLE LIST (Dashboard)
────────────────────────────────────────────────────────────────── */
router.get("/tables", async (req, res) => {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return res.json({ success: false, error: "No DB config found." });
    }

    const encrypted = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    const cfg = decryptJSON(encrypted);

    const conn = await mysql.createConnection(cfg);

    const [rows] = await conn.query(
      `
      SELECT 
        table_name,
        table_rows,
        data_length,
        index_length
      FROM information_schema.tables
      WHERE table_schema = ?
      ORDER BY table_name
      `,
      [cfg.database]
    );

    // Fix MariaDB nulls
    const tables = rows.map((t) => ({
      table_name: t.table_name,
      table_rows: t.table_rows ?? 0,
      data_length: t.data_length ?? 0,
      index_length: t.index_length ?? 0,
    }));

    res.json({ success: true, tables });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

/* ────────────────────────────────────────────────────────────────
   GET SPECIFIC TABLE DATA
────────────────────────────────────────────────────────────────── */
router.get("/tables/:table/data", async (req, res) => {
  try {
    const { table } = req.params;

    if (!fs.existsSync(CONFIG_FILE)) {
      return res.json({ success: false, error: "No DB config found." });
    }

    const encrypted = JSON.parse(fs.readFileSync(CONFIG_FILE));
    const cfg = decryptJSON(encrypted);

    const conn = await mysql.createConnection(cfg);

    // Fetch column names
    const [cols] = await conn.query(
      `
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
      `,
      [cfg.database, table]
    );

    const columns = cols.map((c) => c.COLUMN_NAME);

    // Fetch table rows
    const [rows] = await conn.query(`SELECT * FROM \`${table}\` LIMIT 200`);

    res.json({
      success: true,
      data: {
        columns,
        rows,
      },
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

export default router;
