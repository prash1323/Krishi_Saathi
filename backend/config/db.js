/**
 * config/db.js
 * ─────────────────────────────────────────────────────────────
 * PostgreSQL Connection Pool
 * Uses pg.Pool for efficient connection reuse across requests.
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user     : process.env.DB_USER,
  host     : process.env.DB_HOST,
  database : process.env.DB_NAME,
  password : process.env.DB_PASSWORD,
  port     : parseInt(process.env.DB_PORT, 10) || 5432,

  /* Connection pool tuning */
  max               : 10,    // max simultaneous connections in pool
  idleTimeoutMillis : 30000, // close idle connections after 30 s
  connectionTimeoutMillis: 2000, // error if connection takes > 2 s
});

/* Log pool-level errors (e.g. DB server restarts) */
pool.on('error', (err) => {
  console.error('[DB Pool] Unexpected error on idle client:', err.message);
});

module.exports = pool;
