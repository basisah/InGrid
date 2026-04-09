const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: process.env.DB_HOST || "db",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "password",
  database: process.env.DB_NAME || "ingriddb",
  port: process.env.DB_PORT || 3306,
});

module.exports = db;