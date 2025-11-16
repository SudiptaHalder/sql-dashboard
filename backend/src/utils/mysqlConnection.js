import mysql from "mysql2";

export function createConnection(config) {
  return mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
    port: config.port || 3306
  });
}
