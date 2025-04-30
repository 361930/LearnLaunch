/**
 * Security middleware for GlobalEduConnect Local API Server
 * 
 * Implements various security measures to protect the API:
 * - Input validation
 * - Blocked IP addresses
 * - Request validation
 * - Basic DOS protection
 */

// Track request counts and timestamps for basic DOS protection
const requestTracker = {
  // Map IP addresses to request counts
  counts: new Map(),
  // Map IP addresses to timestamps of first request in window
  timestamps: new Map(),
  // Window size in milliseconds
  windowMs: 60 * 1000, // 1 minute
  // Threshold for suspicious behavior
  threshold: 100, // 100 requests per minute
  // Reset counts for an IP address
  reset(ip) {
    this.counts.delete(ip);
    this.timestamps.delete(ip);
  },
  // Record a request from an IP address
  record(ip) {
    const now = Date.now();
    
    // If IP not in maps or window expired, reset counts
    if (!this.counts.has(ip) || now - this.timestamps.get(ip) > this.windowMs) {
      this.counts.set(ip, 1);
      this.timestamps.set(ip, now);
      return 1;
    }
    
    // Increment count for existing IP
    const count = this.counts.get(ip) + 1;
    this.counts.set(ip, count);
    return count;
  },
  // Check if IP has exceeded threshold
  isAbusive(ip) {
    return this.counts.has(ip) && this.counts.get(ip) > this.threshold;
  }
};

// List of blocked IP addresses
const blockedIPs = new Set();

/**
 * Set security-related HTTP headers
 */
function setSecurityHeaders(req, res, next) {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  
  next();
}

/**
 * Simple input sanitization middleware
 */
function sanitizeInputs(req, res, next) {
  // Function to sanitize a string
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    // Remove potentially dangerous patterns
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/\bon\w+\s*=/gi, '')
      .trim();
  };
  
  // Sanitize request body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    });
  }
  
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    });
  }
  
  next();
}

/**
 * Check for blocked IP addresses
 */
function checkBlockedIP(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  
  if (blockedIPs.has(ip)) {
    return res.status(403).json({ 
      error: 'Access blocked. Please contact support if you believe this is in error.' 
    });
  }
  
  next();
}

/**
 * Basic DOS protection middleware
 */
function protectAgainstDOS(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  
  // Skip for allowed testing IPs
  if (ip === '127.0.0.1' || ip === '::1') {
    return next();
  }
  
  // Record request and check count
  const count = requestTracker.record(ip);
  
  // If abusive, block temporarily
  if (requestTracker.isAbusive(ip)) {
    console.warn(`Potential DOS attack detected from IP: ${ip}`);
    return res.status(429).json({ 
      error: 'Too many requests. Please try again later.'
    });
  }
  
  next();
}

/**
 * Validate request format
 */
function validateRequest(req, res, next) {
  // Check content type for POST/PUT/PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'] || '';
    
    if (!contentType.includes('application/json')) {
      return res.status(415).json({ 
        error: 'Unsupported Media Type. Content-Type must be application/json'
      });
    }
    
    // Check for empty body
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ 
        error: 'Request body is empty or invalid'
      });
    }
  }
  
  next();
}

/**
 * Security logging middleware
 */
function securityLogging(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const method = req.method;
  const url = req.originalUrl || req.url;
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // Log suspicious requests
  if (
    url.includes('../') || 
    url.includes('..\\') || 
    url.includes('SELECT') || 
    url.includes('UNION') ||
    url.includes('%27') || // Single quote
    url.includes('%22') || // Double quote
    url.includes('%60')    // Backtick
  ) {
    console.warn(`Suspicious request detected - IP: ${ip}, Method: ${method}, URL: ${url}, User-Agent: ${userAgent}`);
  }
  
  next();
}

/**
 * Setup all security middleware
 */
function setupSecurity(app) {
  app.use(checkBlockedIP);
  app.use(setSecurityHeaders);
  app.use(sanitizeInputs);
  app.use(protectAgainstDOS);
  app.use(validateRequest);
  app.use(securityLogging);
  
  console.log('Security middleware initialized');
}

module.exports = {
  setupSecurity,
  blockedIPs,
  requestTracker,
  // Export individual middlewares for selective use
  setSecurityHeaders,
  sanitizeInputs,
  checkBlockedIP,
  protectAgainstDOS,
  validateRequest,
  securityLogging
};