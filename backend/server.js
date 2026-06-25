/**
 * server.js
 * ─────────────────────────────────────────────────────────────
 * Krishi Saathi – Backend Entry Point
 * Phase 1 · Authentication Foundation
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const pool        = require('./config/db');
const authRoutes  = require('./routes/authRoutes');

const app  = express();
const PORT = process.env.PORT || 5000;

/* ── Global Middleware ──────────────────────────────────────── */
app.use(cors({
  origin : process.env.CLIENT_ORIGIN || '*',
  methods : ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── Health Check ───────────────────────────────────────────── */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success : true,
    message : 'Krishi Saathi API is running',
    version : '1.0.0',
    phase   : 'Phase 1 – Authentication',
    timestamp: new Date().toISOString(),
  });
});

/* ── API Routes ─────────────────────────────────────────────── */
app.use('/api/auth', authRoutes);

/* ── 404 Handler ────────────────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({
    success : false,
    message : `Route ${req.method} ${req.originalUrl} not found`,
  });
});

/* ── Global Error Handler ───────────────────────────────────── */
app.use((err, req, res, next) => {         // eslint-disable-line no-unused-vars
  console.error('[Server Error]', err.stack || err.message);
  res.status(err.status || 500).json({
    success : false,
    message : err.message || 'Internal server error',
  });
});

/* ── Start Server after DB connection test ──────────────────── */
(async () => {
  try {
    await pool.query('SELECT 1');          // verify PostgreSQL is reachable
    console.log('[DB] PostgreSQL connected successfully');

    app.listen(PORT, () => {
      console.log(`[Server] Krishi Saathi API running on port ${PORT}`);
      console.log(`[Server] Health: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('[DB] Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
  }
})();

module.exports = app;   // exported for future test suites
