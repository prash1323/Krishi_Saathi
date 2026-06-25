/**
 * middleware/authMiddleware.js
 * ─────────────────────────────────────────────────────────────
 * JWT Authentication Middleware
 *
 * Protects routes that require a logged-in user.
 *
 * Usage in routes:
 *   router.get('/profile', protect, getProfile);
 *
 * Token format expected in header:
 *   Authorization: Bearer <jwt_token>
 *
 * On success  → attaches decoded payload to req.user and calls next()
 * On failure  → returns 401 with descriptive error message
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

const jwt = require('jsonwebtoken');

/**
 * protect
 * Middleware that verifies the JWT present in the Authorization header.
 * Attaches { id, email, iat, exp } to req.user on success.
 */
const protect = (req, res, next) => {
  /* 1 · Extract header */
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader) {
    return res.status(401).json({
      success : false,
      message : 'Access denied. No authorization header provided.',
    });
  }

  /* 2 · Expect "Bearer <token>" format */
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({
      success : false,
      message : 'Access denied. Token format must be: Bearer <token>',
    });
  }

  const token = parts[1];

  /* 3 · Verify and decode */
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /* Attach only safe payload fields to req.user */
    req.user = {
      id   : decoded.id,
      email: decoded.email,
    };

    next();
  } catch (err) {
    /* Distinguish between expired and invalid tokens */
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success : false,
        message : 'Session expired. Please log in again.',
      });
    }

    return res.status(401).json({
      success : false,
      message : 'Invalid token. Authentication failed.',
    });
  }
};

module.exports = { protect };
