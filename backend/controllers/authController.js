/**
 * controllers/authController.js
 * ─────────────────────────────────────────────────────────────
 * Auth Controller
 * Handles: signup · login · profile
 * All DB operations are delegated to userModel.
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

const {
  createUser,
  findUserByEmail,
  findUserById,
  emailExists,
} = require('../models/userModel');

/* ── Helpers ────────────────────────────────────────────────── */

/**
 * Sign a JWT for a given user.
 * Payload: { id, email } · Expiry: 7 days
 */
const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

/**
 * Validates that all required string fields are non-empty.
 * Returns an array of missing field names.
 */
const getMissingFields = (body, required) =>
  required.filter((field) => !body[field] || String(body[field]).trim() === '');

/* ═══════════════════════════════════════════════════════════════
   POST /api/auth/signup
═══════════════════════════════════════════════════════════════ */
/**
 * Register a new farmer account.
 *
 * Body: { name, email, password, state?, district?, soil_type? }
 *
 * Flow:
 *  1. Validate required fields
 *  2. Check email uniqueness
 *  3. Hash password (bcrypt, 12 rounds)
 *  4. Insert user into DB
 *  5. Return 201 + user profile (no password)
 */
const signup = async (req, res) => {
  try {
    const { name, email, password, state, district, soil_type } = req.body;

    /* 1 · Required field validation */
    const missing = getMissingFields(req.body, ['name', 'email', 'password']);
    if (missing.length) {
      return res.status(400).json({
        success : false,
        message : `Missing required fields: ${missing.join(', ')}`,
      });
    }

    /* 2 · Basic email format check */
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success : false,
        message : 'Please provide a valid email address',
      });
    }

    /* 3 · Password length check */
    if (password.length < 6) {
      return res.status(400).json({
        success : false,
        message : 'Password must be at least 6 characters long',
      });
    }

    /* 4 · Duplicate email check */
    const exists = await emailExists(email.trim().toLowerCase());
    if (exists) {
      return res.status(409).json({
        success : false,
        message : 'An account with this email already exists',
      });
    }

    /* 5 · Hash password */
    const SALT_ROUNDS = 12;
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    /* 6 · Create user */
    const newUser = await createUser({
      name      : name.trim(),
      email     : email.trim().toLowerCase(),
      password  : hashedPassword,
      state     : state     ? state.trim()     : null,
      district  : district  ? district.trim()  : null,
      soil_type : soil_type ? soil_type.trim() : null,
    });

    /* 7 · Respond */
    return res.status(201).json({
      success : true,
      message : 'Account created successfully',
      data    : {
        user: {
          id        : newUser.id,
          name      : newUser.name,
          email     : newUser.email,
          state     : newUser.state,
          district  : newUser.district,
          soil_type : newUser.soil_type,
          created_at: newUser.created_at,
        },
      },
    });
  } catch (err) {
    console.error('[Signup Error]', err.message);
    return res.status(500).json({
      success : false,
      message : 'Server error during signup. Please try again.',
    });
  }
};

/* ═══════════════════════════════════════════════════════════════
   POST /api/auth/login
═══════════════════════════════════════════════════════════════ */
/**
 * Authenticate an existing farmer and issue a JWT.
 *
 * Body: { email, password }
 *
 * Flow:
 *  1. Validate required fields
 *  2. Find user by email
 *  3. Compare password with bcrypt
 *  4. Sign JWT (payload: id, email · expiry: 7d)
 *  5. Return 200 + token + user profile
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    /* 1 · Required field validation */
    const missing = getMissingFields(req.body, ['email', 'password']);
    if (missing.length) {
      return res.status(400).json({
        success : false,
        message : `Missing required fields: ${missing.join(', ')}`,
      });
    }

    /* 2 · Find user (includes hashed password) */
    const user = await findUserByEmail(email.trim().toLowerCase());
    if (!user) {
      /* Use generic message — never reveal whether email exists */
      return res.status(401).json({
        success : false,
        message : 'Invalid email or password',
      });
    }

    /* 3 · Verify password */
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success : false,
        message : 'Invalid email or password',
      });
    }

    /* 4 · Sign JWT */
    const token = signToken(user);

    /* 5 · Respond — never expose password hash */
    return res.status(200).json({
      success : true,
      message : 'Login successful',
      data    : {
        token,
        expiresIn: '7d',
        user: {
          id        : user.id,
          name      : user.name,
          email     : user.email,
          state     : user.state,
          district  : user.district,
          soil_type : user.soil_type,
          created_at: user.created_at,
        },
      },
    });
  } catch (err) {
    console.error('[Login Error]', err.message);
    return res.status(500).json({
      success : false,
      message : 'Server error during login. Please try again.',
    });
  }
};

/* ═══════════════════════════════════════════════════════════════
   GET /api/auth/profile  (protected)
═══════════════════════════════════════════════════════════════ */
/**
 * Return the logged-in user's profile.
 * req.user is attached by authMiddleware before this runs.
 *
 * Flow:
 *  1. Extract id from req.user (set by JWT middleware)
 *  2. Fetch fresh user record from DB
 *  3. Return profile (no password)
 */
const getProfile = async (req, res) => {
  try {
    const user = await findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success : false,
        message : 'User not found',
      });
    }

    return res.status(200).json({
      success : true,
      message : 'Profile fetched successfully',
      data    : { user },
    });
  } catch (err) {
    console.error('[Profile Error]', err.message);
    return res.status(500).json({
      success : false,
      message : 'Server error fetching profile. Please try again.',
    });
  }
};

module.exports = { signup, login, getProfile };
