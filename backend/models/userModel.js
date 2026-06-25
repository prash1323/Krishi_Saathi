/**
 * models/userModel.js
 * ─────────────────────────────────────────────────────────────
 * User Model
 * Encapsulates all SQL operations on the `users` table.
 * Controllers never write raw SQL — they call these functions.
 *
 * Table DDL (run once in psql / migration):
 *
 *   CREATE TABLE IF NOT EXISTS users (
 *     id         SERIAL PRIMARY KEY,
 *     name       VARCHAR(100)  NOT NULL,
 *     email      VARCHAR(100)  UNIQUE NOT NULL,
 *     password   TEXT          NOT NULL,
 *     state      VARCHAR(100),
 *     district   VARCHAR(100),
 *     soil_type  VARCHAR(100),
 *     created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
 *   );
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

const pool = require('../config/db');

/* ── CREATE TABLE (idempotent) ──────────────────────────────── */
const createUsersTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL       PRIMARY KEY,
      name       VARCHAR(100) NOT NULL,
      email      VARCHAR(100) UNIQUE NOT NULL,
      password   TEXT         NOT NULL,
      state      VARCHAR(100),
      district   VARCHAR(100),
      soil_type  VARCHAR(100),
      created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(sql);
};

/* ── CREATE a new user ──────────────────────────────────────── */
/**
 * @param {{ name, email, password, state, district, soil_type }} data
 * @returns {Promise<object>} The newly inserted user row
 */
const createUser = async ({ name, email, password, state, district, soil_type }) => {
  const sql = `
    INSERT INTO users (name, email, password, state, district, soil_type)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, name, email, state, district, soil_type, created_at;
  `;
  const values = [name, email, password, state || null, district || null, soil_type || null];
  const { rows } = await pool.query(sql, values);
  return rows[0];
};

/* ── FIND by email ──────────────────────────────────────────── */
/**
 * Returns the full user row including hashed password
 * (used for login password comparison).
 * @param {string} email
 * @returns {Promise<object|null>}
 */
const findUserByEmail = async (email) => {
  const sql = `SELECT * FROM users WHERE email = $1 LIMIT 1;`;
  const { rows } = await pool.query(sql, [email]);
  return rows[0] || null;
};

/* ── FIND by id (safe – no password) ───────────────────────── */
/**
 * Returns user fields safe for public response (no password).
 * @param {number} id
 * @returns {Promise<object|null>}
 */
const findUserById = async (id) => {
  const sql = `
    SELECT id, name, email, state, district, soil_type, created_at
    FROM users
    WHERE id = $1
    LIMIT 1;
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
};

/* ── CHECK email existence ──────────────────────────────────── */
/**
 * Lightweight check — only reads one boolean column.
 * @param {string} email
 * @returns {Promise<boolean>}
 */
const emailExists = async (email) => {
  const sql = `SELECT 1 FROM users WHERE email = $1 LIMIT 1;`;
  const { rowCount } = await pool.query(sql, [email]);
  return rowCount > 0;
};

module.exports = {
  createUsersTable,
  createUser,
  findUserByEmail,
  findUserById,
  emailExists,
};
