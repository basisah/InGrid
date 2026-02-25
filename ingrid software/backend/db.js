// db.js
const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "db",            // matches the service name in docker-compose.yml
  user: "root",
  password: "password",
  database: "listing",
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = db;