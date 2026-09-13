const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'motorwise_super_secret_key_123';

/**
 * Middleware to authenticate JWT token from Authorization header.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader);

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (ex) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Optional authentication: extracts user if token provided, but doesn't block if absent.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader);

  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      // Ignore token errors in optional auth
    }
  }
  next();
}

/**
 * Role-based authorization guard.
 * @param  {...string} allowedRoles
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges.' });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  optionalAuth,
  authorizeRoles,
  JWT_SECRET
};
