/**
 * Authentication middleware for GlobalEduConnect API Server
 * 
 * Provides JWT-based authentication and authorization:
 * - Token validation
 * - Role-based access control
 * - User verification
 */

const jwt = require('jsonwebtoken');
const { getUserById } = require('../services/users');

// JWT secret key - in production, use an environment variable
// For local development/testing, we use a fixed secret
const JWT_SECRET = process.env.JWT_SECRET || 'globaleduconnect-local-secret-key';
const JWT_EXPIRES_IN = '7d'; // Token expiration time

/**
 * Create a new JWT token for a user
 * 
 * @param {Object} user - User object to encode in token
 * @returns {string} Generated JWT token
 */
function createToken(user) {
  // Create payload with essential user information
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
  
  // Sign and return token
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify a JWT token
 * 
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}

/**
 * Extract token from request headers
 * 
 * @param {Object} req - Express request object
 * @returns {string|null} Extracted token or null if not found
 */
function extractTokenFromHeader(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.split(' ')[1];
}

/**
 * Middleware to validate authentication
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function validateAuth(req, res, next) {
  try {
    // Extract token from header
    const token = extractTokenFromHeader(req);
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Get user from database
    const user = await getUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ 
        error: 'Account is not active. Please contact support.'
      });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication process failed' });
  }
}

/**
 * Middleware to validate user role
 * 
 * @param {string[]} allowedRoles - Array of roles allowed to access the resource
 * @returns {Function} Express middleware function
 */
function validateRole(allowedRoles) {
  return (req, res, next) => {
    // Ensure auth middleware ran first
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check if user has allowed role
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'You do not have permission to access this resource'
      });
    }
    
    next();
  };
}

/**
 * Middleware for admin-only routes
 */
const validateAdmin = validateRole(['admin']);

/**
 * Middleware for teacher and admin routes
 */
const validateTeacherOrAdmin = validateRole(['teacher', 'admin']);

/**
 * Middleware to check if user is accessing their own resource
 * 
 * @param {Function} getResourceUserId - Function to extract user ID from request
 * @returns {Function} Express middleware function
 */
function validateOwnership(getResourceUserId) {
  return async (req, res, next) => {
    try {
      // Ensure auth middleware ran first
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Admin can access all resources
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Get resource owner ID using the provided function
      const resourceUserId = await getResourceUserId(req);
      
      // Check if user owns the resource
      if (req.user.id !== resourceUserId) {
        return res.status(403).json({ 
          error: 'You do not have permission to access this resource'
        });
      }
      
      next();
    } catch (error) {
      console.error('Ownership validation error:', error);
      res.status(500).json({ error: 'Ownership validation failed' });
    }
  };
}

module.exports = {
  createToken,
  verifyToken,
  validateAuth,
  validateRole,
  validateAdmin,
  validateTeacherOrAdmin,
  validateOwnership
};