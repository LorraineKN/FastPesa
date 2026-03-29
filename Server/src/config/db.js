const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Simple query wrapper
const query = (text, params) => pool.query(text, params);

// For models we'll use raw SQL, but we keep a sequelize-like interface
const sequelize = {
  authenticate: async () => {
    const client = await pool.connect();
    client.release();
    return true;
  },
  query,
  pool,
};

module.exports = { pool, query, sequelize };