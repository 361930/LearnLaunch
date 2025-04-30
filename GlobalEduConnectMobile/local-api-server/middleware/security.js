/**
 * Security middleware for GlobalEduConnect API Server
 * 
 * Provides various security enhancements:
 * - Input validation and sanitization
 * - Rate limiting
 * - CORS configuration
 * - Content Security Policy
 * - Request logging
 */

const rateLimit = require('express-rate-limit');
const validator = require('validator');

/**
 * Set up security-related response headers
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function securityHeaders(req, res, next) {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' ws: wss:;");
  res.setHeader('Referrer-Policy', 'same-origin');
  
  next();
}

/**
 * Configure CORS for API requests
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function corsMiddleware(req, res, next) {
  // For local development, we allow all origins
  // In a production environment, this would be more restrictive
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
}

/**
 * Sanitize request inputs
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function sanitizeInputs(req, res, next) {
  // Sanitize body parameters
  if (req.body) {
    sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query) {
    sanitizeObject(req.query);
  }
  
  // Sanitize URL parameters
  if (req.params) {
    sanitizeObject(req.params);
  }
  
  next();
}

/**
 * Recursively sanitize an object
 * 
 * @param {Object} obj - Object to sanitize
 */
function sanitizeObject(obj) {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        // Sanitize string to prevent XSS
        obj[key] = validator.escape(value);
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitizeObject(value);
      }
    }
  }
}

/**
 * Create rate limiter middleware
 * 
 * @param {Object} options - Rate limiting options
 * @returns {Function} Express middleware
 */
function createRateLimiter(options = {}) {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests, please try again later.',
  };
  
  return rateLimit({
    ...defaultOptions,
    ...options,
  });
}

/**
 * Stricter rate limiter for auth endpoints
 */
const authRateLimiter = createRateLimiter({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 10, // Max 10 requests per windowMs
  message: 'Too many login attempts, please try again later.',
});

/**
 * Basic request logger middleware
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function requestLogger(req, res, next) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip} - UA: ${userAgent}`);
  
  // Track response time
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    console.log(`[${timestamp}] ${method} ${url} - ${statusCode} - ${duration}ms`);
  });
  
  next();
}

/**
 * Validate JSON content in requests
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function validateJsonContent(req, res, next) {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.headers['content-type'];
    
    if (contentType && contentType.includes('application/json')) {
      // Check if body is empty when it should have content
      if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: 'Empty JSON body not allowed' });
      }
    }
  }
  
  next();
}

/**
 * Error handling middleware
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function errorHandler(err, req, res, next) {
  // Log error details
  console.error('Error occurred:', err);
  
  // Send appropriate response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred';
  
  // In production, don't expose detailed error messages
  const response = process.env.NODE_ENV === 'production'
    ? { error: statusCode === 500 ? 'An unexpected error occurred' : message }
    : { error: message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined };
  
  res.status(statusCode).json(response);
}

/**
 * Not found handler middleware
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Resource not found' });
}

module.exports = {
  securityHeaders,
  corsMiddleware,
  sanitizeInputs,
  createRateLimiter,
  authRateLimiter,
  requestLogger,
  validateJsonContent,
  errorHandler,
  notFoundHandler,
};