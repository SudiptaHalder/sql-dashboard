import express from "express";
import { createConnection } from "../utils/mysqlConnection.js";
import { setActiveConfig, getActiveConfig } from "../state/activeConfig.js";

const router = express.Router();

// TEST CONNECTION
router.post("/connect", (req, res) => {
  const config = req.body;

  const conn = createConnection(config);

  conn.connect((err) => {
    if (err) {
      return res.json({ success: false, error: err.message });
    }

    // Save credentials in memory
    setActiveConfig(config);

    return res.json({ success: true, message: "Connected successfully!" });
  });
});

// Get active config (mask password)
router.get("/status", (req, res) => {
  const config = getActiveConfig();
  if (!config) return res.json({ connected: false });

  res.json({
    connected: true,
    config: { ...config, password: "***" },
  });
});

export default router;
