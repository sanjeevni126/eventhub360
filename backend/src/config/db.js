const { Pool } = require('pg');

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'employee_db',
      password: process.env.DB_PASSWORD || 'gauri.1234',
      port: process.env.DB_PORT || 5432,
    });

console.log("DATABASE_URL is:", process.env.DATABASE_URL ? "SET" : "NOT SET");

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
