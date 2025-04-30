/**
 * Authentication middleware for GlobalEduConnect API Server
 * 
 * Provides authentication and authorization utilities:
 * - JWT token verification
 * - Role-based access control
 * - User session management
 */

const jwt = require('jsonwebtoken');
const userService = require('../services/users');

// Secret for JWT signing (in real-world, this would be in environment variables)
const JWT_SECRET = 'GlobalEduConnect_JWT_Secret_2023';
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '30d';

/**
 * Create a JWT token for a user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
function createToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    // Don't include sensitive data in the token
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Create a refresh token for a user
 * @param {Object} user - User object
 * @returns {string} Refresh token
 */
function createRefreshToken(user) {
  const payload = {
    id: user.id,
    tokenType: 'refresh'
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

/**
 * Verify a JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token payload or null
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
 * Get token from authorization header
 * @param {Object} req - Express request object
 * @returns {string|null} JWT token or null
 */
function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }
  
  return null;
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function authenticate(req, res, next) {
  const token = getTokenFromRequest(req);
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  try {
    // Get user from database
    const user = await userService.getUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is not active' });
    }
    
    // Attach user to request
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Role-based authorization middleware
 * 
 * @param {string[]} roles - Authorized roles
 * @returns {Function} Middleware function
 */
function authorize(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

/**
 * Admin authorization middleware
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function isAdmin(req, res, next) {
  return authorize(['admin'])(req, res, next);
}

/**
 * Teacher authorization middleware
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function isTeacher(req, res, next) {
  return authorize(['teacher', 'admin'])(req, res, next);
}

/**
 * Student authorization middleware
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function isStudent(req, res, next) {
  return authorize(['student', 'teacher', 'admin'])(req, res, next);
}

/**
 * Resource owner middleware
 * Checks if requested resource belongs to the authenticated user
 * 
 * @param {Function} getResourceOwnerId - Function to get resource owner ID
 * @returns {Function} Middleware function
 */
function isResourceOwner(getResourceOwnerId) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
      const ownerId = await getResourceOwnerId(req);
      
      // Admin can access all resources
      if (req.user.role === 'admin') {
        return next();
      }
      
      if (ownerId !== req.user.id) {
        return res.status(403).json({ error: 'You do not own this resource' });
      }
      
      next();
    } catch (error) {
      console.error('Resource authorization error:', error);
      res.status(500).json({ error: 'Authorization failed' });
    }
  };
}

/**
 * Refresh token middleware
 * Handles token refresh
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function refreshToken(req, res) {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }
  
  try {
    const decoded = verifyToken(refreshToken);
    
    if (!decoded || decoded.tokenType !== 'refresh') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    const user = await userService.getUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Create new tokens
    const accessToken = createToken(user);
    const newRefreshToken = createRefreshToken(user);
    
    res.json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
}

module.exports = {
  createToken,
  createRefreshToken,
  verifyToken,
  authenticate,
  authorize,
  isAdmin,
  isTeacher,
  isStudent,
  isResourceOwner,
  refreshToken,
};