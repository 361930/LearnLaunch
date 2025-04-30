/**
 * GlobalEduConnect Local API Server
 * 
 * A self-contained local API server that provides backend services
 * for the GlobalEduConnect mobile app. Uses SQLite for storage and
 * Socket.IO for real-time communication.
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const path = require('path');

// Import database connection
const db = require('./db');

// Import middleware
const { setupSecurity } = require('./middleware/security');
const { validateAuth } = require('./middleware/auth');

// Import route handlers
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const classesRoutes = require('./routes/classes');
const enrollmentsRoutes = require('./routes/enrollments');
const challengesRoutes = require('./routes/challenges');
const chatRoutes = require('./routes/chat');
const donationsRoutes = require('./routes/donations');
const settingsRoutes = require('./routes/settings');

// Import Socket.IO handlers
const { setupSocketHandlers } = require('./services/socket');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Set port - defaults to 3001
const PORT = process.env.PORT || 3001;

// Initialize Socket.IO with CORS configuration
const io = new Server(server, {
  cors: {
    origin: '*', // For development - restrict in production
    methods: ['GET', 'POST'],
    credentials: true,
  },
  path: '/ws',
});

// Basic middleware setup
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false })); // Disable CSP for development
app.use(compression());
app.use(morgan('dev')); // Logging
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Apply rate limiter to all API routes
app.use('/api', apiLimiter);

// Setup security middleware
setupSecurity(app);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', validateAuth, usersRoutes);
app.use('/api/classes', validateAuth, classesRoutes);
app.use('/api/enrollments', validateAuth, enrollmentsRoutes);
app.use('/api/challenges', validateAuth, challengesRoutes);
app.use('/api/chat', validateAuth, chatRoutes);
app.use('/api/donations', validateAuth, donationsRoutes);
app.use('/api/settings', validateAuth, settingsRoutes);

// Setup Socket.IO handlers with authentication
setupSocketHandlers(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Handle specific error types
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  
  // Default error handler
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
});

// Initialize database
db.init()
  .then(() => {
    // Start server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`GlobalEduConnect API Server running on port ${PORT}`);
      console.log(`Socket.IO server available at ws://localhost:${PORT}/ws`);
      console.log(`REST API available at http://localhost:${PORT}/api`);
    });
  })
  .catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  
  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed.');
    
    // Close database connection
    db.close()
      .then(() => {
        console.log('Database connection closed.');
        process.exit(0);
      })
      .catch(error => {
        console.error('Error closing database:', error);
        process.exit(1);
      });
  });
});