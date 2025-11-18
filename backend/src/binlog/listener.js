import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import ZongJi from "zongji";
import { decryptJSON } from "../utils/crypto.js";

const CONFIG_FILE = path.join(process.cwd(), "backend/db/config.enc.json");

let ioInstance = null;

export default {
  attachIO(io) {
    ioInstance = io;
  },

  async start() {
    console.log("🚀 Starting MySQL Binlog Listener...");

    if (!fs.existsSync(CONFIG_FILE)) {
      console.log("ℹ️ No DB config found. Skipping binlog.");
      return;
    }

    const enc = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    const cfg = decryptJSON(enc);

    // For binlog: REPLICATION user is required
    const binlogConfig = {
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,            // Should be binlog_user ideally
      password: cfg.password,
      database: cfg.database,
      serverId: 1,
      startAtEnd: true,
    };

    const zongji = new ZongJi(binlogConfig);

    // Only row events
    zongji.on("binlog", (event) => {
      if (!event.getEventName) return;

      const eventType = event.getEventName();

      // ⛔ Skip non-table events
      const validEvents = ["writerows", "updaterows", "deleterows"];
      if (!validEvents.includes(eventType.toLowerCase())) {
        return;
      }

      const table = event.tableMap[event.tableId];
      if (!table) return;

      const tableName = table.tableName;

      let activity = {
        id: Date.now(),
        table: tableName,
        timestamp: new Date().toISOString(),
        type: "",
        before: null,
        after: null,
        real: true,
      };

      if (eventType === "writerows") {
        activity.type = "INSERT";
        activity.after = event.rows[0];
      }

      if (eventType === "updaterows") {
        activity.type = "UPDATE";
        activity.before = event.rows[0].before;
        activity.after = event.rows[0].after;
      }

      if (eventType === "deleterows") {
        activity.type = "DELETE";
        activity.before = event.rows[0];
      }

      console.log("📦 EVENT:", activity);

      if (ioInstance) ioInstance.emit("db_event", activity);
    });

    zongji.start({
      includeEvents: ["writerows", "updaterows", "deleterows"],
      includeSchema: {
        [cfg.database]: true,
      },
    });

    console.log("✔️ Binlog listener running");
  },
};
