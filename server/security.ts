import { Express, Request, Response, NextFunction } from "express";

// Apply security headers middleware
export function setupSecurityHeaders(app: Express) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Content Security Policy to prevent XSS attacks
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
    );
    
    // Prevent MIME type sniffing security vulnerability
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Clickjacking protection
    res.setHeader('X-Frame-Options', 'DENY');
    
    // XSS protection - although modern browsers use CSP
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Prevent leaking referrer information
    res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
    
    // HSTS - Force HTTPS in production
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }
    
    next();
  });
}

// Sanitize input middleware
export function sanitizeInputs(req: Request, res: Response, next: NextFunction) {
  if (req.body) {
    // Iterate through each property in req.body
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Basic sanitization - remove script tags
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .trim();
      }
    });
  }
  next();
}

// CORS configuration for mobile apps
export function setupCORS(app: Express) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Allow requests from our mobile app and web client
    const allowedOrigins = [
      'capacitor://localhost',
      'http://localhost',
      'http://localhost:3000',
      'http://localhost:5173',
      'https://globaleduconnect.replit.app'
    ];
    
    const origin = req.headers.origin as string;
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    // Allow specific headers and methods
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });
}

// Log potentially malicious requests
export function securityLogging(req: Request, res: Response, next: NextFunction) {
  // Check for SQL injection attempts
  const potentialSQLi = /('|"|;|--|\/\*|\*\/|%|#|\\)/i;
  // Check for XSS attempts
  const potentialXSS = /<(script|iframe|img|svg|a|div|link|style)/i;
  // Check for path traversal
  const pathTraversal = /(\.\.|\/\/|~|\.\.\/|\.\.\\)/i;
  
  const params = { ...req.query, ...req.params };
  
  let isSuspicious = false;
  
  // Check URL params for suspicious patterns
  Object.keys(params).forEach(key => {
    if (
      typeof params[key] === 'string' && 
      (potentialSQLi.test(params[key] as string) || 
       potentialXSS.test(params[key] as string) ||
       pathTraversal.test(params[key] as string))
    ) {
      isSuspicious = true;
      console.warn(`Suspicious request parameter detected: ${key}=${params[key]}`);
    }
  });
  
  // Check request body for suspicious patterns if it's a string or object
  if (req.body) {
    if (typeof req.body === 'string' && 
        (potentialSQLi.test(req.body) || 
         potentialXSS.test(req.body) ||
         pathTraversal.test(req.body))) {
      isSuspicious = true;
      console.warn(`Suspicious request body detected (string)`);
    } else if (typeof req.body === 'object') {
      Object.keys(req.body).forEach(key => {
        if (
          typeof req.body[key] === 'string' && 
          (potentialSQLi.test(req.body[key]) || 
           potentialXSS.test(req.body[key]) ||
           pathTraversal.test(req.body[key]))
        ) {
          isSuspicious = true;
          console.warn(`Suspicious request body parameter detected: ${key}=${req.body[key]}`);
        }
      });
    }
  }
  
  // Log suspicious requests
  if (isSuspicious) {
    console.warn(`Potentially malicious request detected from ${req.ip} to ${req.method} ${req.originalUrl}`);
    
    // In production, you might want to:
    // 1. Log to a security monitoring service
    // 2. Increment a counter for this IP in rate limiting
    // 3. Add the IP to a temporary block list
    
    // For extreme cases, you could block the request
    // return res.status(403).json({ message: 'Request blocked for security reasons' });
  }
  
  next();
}

// Middleware to apply all security measures
export function setupSecurity(app: Express) {
  setupSecurityHeaders(app);
  app.use(sanitizeInputs);
  setupCORS(app);
  app.use(securityLogging);
}