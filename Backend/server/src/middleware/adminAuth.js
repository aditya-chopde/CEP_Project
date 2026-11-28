// Simple admin authentication middleware using a session token stored in memory.
// In production you would use JWT + a real user store.

const crypto = require('crypto');

// Admin credentials (in production, store hashed password in env/db)
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

// Active session tokens (in-memory; restarting the server invalidates sessions)
const activeSessions = new Map();

/**
 * Validate admin credentials and return a session token.
 */
function login(username, password) {
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = crypto.randomBytes(32).toString('hex');
    activeSessions.set(token, { username, createdAt: Date.now() });
    return token;
  }
  return null;
}

/**
 * Invalidate a session token.
 */
function logout(token) {
  activeSessions.delete(token);
}

/**
 * Express middleware – checks for `Authorization: Bearer <token>` header.
 */
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Admin authentication required' }
    });
  }

  const token = authHeader.slice(7);
  if (!activeSessions.has(token)) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired session' }
    });
  }

  req.adminUser = activeSessions.get(token).username;
  next();
}

module.exports = { login, logout, requireAdmin };
