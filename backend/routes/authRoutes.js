/**
 * routes/authRoutes.js
 * ─────────────────────────────────────────────────────────────
 * Authentication Routes
 *
 * Base path (mounted in server.js): /api/auth
 *
 * Public routes:
 *   POST /api/auth/signup   → register new farmer
 *   POST /api/auth/login    → authenticate + receive JWT
 *
 * Protected routes (require valid JWT):
 *   GET  /api/auth/profile  → fetch logged-in user profile
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

const { Router } = require('express');

const { signup, login, getProfile } = require('../controllers/authController');
const { protect }                   = require('../middleware/authMiddleware');

const router = Router();

/* ── Public ─────────────────────────────────────────────────── */
router.post('/signup',  signup);
router.post('/login',   login);

/* ── Protected ──────────────────────────────────────────────── */
router.get('/profile',  protect, getProfile);

module.exports = router;
