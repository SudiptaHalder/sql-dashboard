import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import MySQLEvents from "@rodrigogs/mysql-events";

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = join(__dirname, "../../db/config.json");

let instance = null;

export default {
  start: async (io) => {
    try {
      if (!existsSync(configPath)) {
        console.log("⚠️ No DB config.json found. Binlog listener disabled.");
        return;
      }

      const config = JSON.parse(readFileSync(configPath, "utf8"));

      console.log("🔄 Connecting to MySQL binlog...");

      instance = new MySQLEvents(
        {
          host: config.host,
          user: config.user,
          password: config.password,
          port: config.port || 3306,
        },
        {
          startAtEnd: true, // Start from the latest binlog event
        }
      );

      await instance.start();

      console.log("🔥 Binlog listener started");

      instance.addTrigger({
        name: "monitor-all-tables",
        expression: `${config.database}.*`,
        statement: MySQLEvents.STATEMENTS.ALL,
        onEvent: (event) => {
          const { type, table, affectedRows } = event;

          let activity = {
            id: Date.now(),
            type,
            table,
            timestamp: new Date(),
            real: true,
          };

          if (type === "INSERT") {
            activity.after = affectedRows[0].after;
          }

          if (type === "UPDATE") {
            activity.before = affectedRows[0].before;
            activity.after = affectedRows[0].after;
          }

          if (type === "DELETE") {
            activity.before = affectedRows[0].before;
          }

          io.emit("sql_activity", activity);
        },
      });

      instance.on(MySQLEvents.EVENTS.CONNECTION_ERROR, (err) =>
        console.log("❌ Binlog connection error:", err)
      );

      instance.on(MySQLEvents.EVENTS.ZONGJI_ERROR, (err) =>
        console.log("❌ Binlog ZongJi error:", err)
      );
    } catch (err) {
      console.error("❌ Failed to start binlog:", err.message);
    }
  },

  stop: async () => {
    if (instance) {
      console.log("🛑 Stopping MySQL event listener...");
      await instance.stop();
      instance = null;
    }
  },
};
