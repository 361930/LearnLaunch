/**
 * Socket.IO service for GlobalEduConnect API Server
 * 
 * Handles real-time messaging and notifications:
 * - User authentication for socket connections
 * - Chat message handling
 * - Classroom events
 * - Real-time notifications
 * - User presence tracking
 */

const { verifyToken } = require('../middleware/auth');
const chatService = require('./chat');
const userService = require('./users');

// Store active socket connections by user ID
const activeConnections = new Map();

// Store user presence information (online status)
const userPresence = new Map();

/**
 * Setup Socket.IO handlers
 * @param {Object} io - Socket.IO server instance
 */
function setupSocketHandlers(io) {
  // Middleware: Authenticate socket connections with JWT
  io.use(async (socket, next) => {
    try {
      // Extract token from handshake auth
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }
      
      // Verify token and get user
      const payload = verifyToken(token);
      
      if (!payload) {
        return next(new Error('Invalid token'));
      }
      
      // Get user from database to verify they exist
      const user = await userService.getUserById(payload.id);
      
      if (!user) {
        return next(new Error('User not found'));
      }
      
      // Attach user to socket for later use
      socket.user = user;
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication failed'));
    }
  });
  
  // Connection event
  io.on('connection', (socket) => {
    const userId = socket.user.id;
    const username = socket.user.username;
    
    console.log(`Socket connected: ${username} (${userId}), Socket ID: ${socket.id}`);
    
    // Add to active connections
    if (!activeConnections.has(userId)) {
      activeConnections.set(userId, new Set());
    }
    
    activeConnections.get(userId).add(socket.id);
    
    // Update user presence
    updateUserPresence(userId, true);
    
    // Join user's personal room for direct messages
    socket.join(`user:${userId}`);
    
    // Handle joining rooms (e.g., classes the user belongs to)
    handleJoinRooms(socket);
    
    // Handle chat message events
    handleChatMessages(io, socket);
    
    // Handle notifications
    handleNotifications(socket);
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${username} (${userId}), Socket ID: ${socket.id}`);
      
      // Remove from active connections
      if (activeConnections.has(userId)) {
        activeConnections.get(userId).delete(socket.id);
        
        // If no more active connections for this user, mark them as offline
        if (activeConnections.get(userId).size === 0) {
          activeConnections.delete(userId);
          updateUserPresence(userId, false);
        }
      }
    });
  });
  
  console.log('Socket.IO handlers initialized');
}

/**
 * Update user presence and broadcast to interested parties
 * @param {number} userId - User ID
 * @param {boolean} isOnline - Whether user is online
 */
function updateUserPresence(userId, isOnline) {
  // Update presence data
  userPresence.set(userId, {
    isOnline,
    lastSeen: new Date().toISOString()
  });
  
  // TODO: Broadcast to friends and classmates
}

/**
 * Handle joining rooms for classes, groups, etc.
 * @param {Object} socket - Socket.IO socket
 */
async function handleJoinRooms(socket) {
  try {
    const userId = socket.user.id;
    
    // Join class rooms the user belongs to (either as teacher or student)
    const userClasses = await getUserClasses(userId);
    
    for (const classData of userClasses) {
      socket.join(`class:${classData.id}`);
    }
    
    // Join challenge rooms
    const userChallenges = await getUserChallenges(userId);
    
    for (const challenge of userChallenges) {
      socket.join(`challenge:${challenge.id}`);
    }
  } catch (error) {
    console.error('Error joining rooms:', error.message);
  }
}

/**
 * Get classes the user belongs to (as teacher or student)
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of class objects
 */
async function getUserClasses(userId) {
  // This is a placeholder that should be implemented properly
  // using the class service to fetch actual data
  return []; // For now, return empty array
}

/**
 * Get challenges the user participates in
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of challenge objects
 */
async function getUserChallenges(userId) {
  // This is a placeholder that should be implemented properly
  // using the challenge service to fetch actual data
  return []; // For now, return empty array
}

/**
 * Handle chat message events
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Socket.IO socket
 */
function handleChatMessages(io, socket) {
  // Handle private message to user
  socket.on('private-message', async (data) => {
    try {
      const { recipient_id, message } = data;
      const sender_id = socket.user.id;
      
      if (!recipient_id || !message) {
        return socket.emit('error', { message: 'Invalid message data' });
      }
      
      // Store message in database
      const savedMessage = await chatService.savePrivateMessage({
        sender_id,
        recipient_id,
        message
      });
      
      // Emit to sender for confirmation
      socket.emit('message-sent', savedMessage);
      
      // Emit to recipient if online
      io.to(`user:${recipient_id}`).emit('new-message', savedMessage);
    } catch (error) {
      console.error('Error handling private message:', error.message);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Handle class message
  socket.on('class-message', async (data) => {
    try {
      const { class_id, message } = data;
      const sender_id = socket.user.id;
      
      if (!class_id || !message) {
        return socket.emit('error', { message: 'Invalid message data' });
      }
      
      // Store message in database
      const savedMessage = await chatService.saveClassMessage({
        sender_id,
        class_id,
        message
      });
      
      // Emit to sender for confirmation
      socket.emit('message-sent', savedMessage);
      
      // Emit to class room
      socket.to(`class:${class_id}`).emit('new-class-message', savedMessage);
    } catch (error) {
      console.error('Error handling class message:', error.message);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Handle typing indicators
  socket.on('typing', (data) => {
    const { recipient_id, class_id } = data;
    const user = {
      id: socket.user.id,
      username: socket.user.username
    };
    
    // Send typing indicator for private chat
    if (recipient_id) {
      socket.to(`user:${recipient_id}`).emit('user-typing', { user });
    }
    
    // Send typing indicator for class chat
    if (class_id) {
      socket.to(`class:${class_id}`).emit('user-typing', { user, class_id });
    }
  });
  
  // Handle typing stopped
  socket.on('typing-stopped', (data) => {
    const { recipient_id, class_id } = data;
    const user = {
      id: socket.user.id,
      username: socket.user.username
    };
    
    // Send typing stopped for private chat
    if (recipient_id) {
      socket.to(`user:${recipient_id}`).emit('user-typing-stopped', { user });
    }
    
    // Send typing stopped for class chat
    if (class_id) {
      socket.to(`class:${class_id}`).emit('user-typing-stopped', { user, class_id });
    }
  });
}

/**
 * Handle notification events
 * @param {Object} socket - Socket.IO socket
 */
function handleNotifications(socket) {
  // Subscribe to notification channels
  socket.on('subscribe-notifications', (data) => {
    const { channels } = data;
    
    if (Array.isArray(channels)) {
      channels.forEach(channel => {
        socket.join(`notification:${channel}`);
      });
    }
  });
  
  // Unsubscribe from notification channels
  socket.on('unsubscribe-notifications', (data) => {
    const { channels } = data;
    
    if (Array.isArray(channels)) {
      channels.forEach(channel => {
        socket.leave(`notification:${channel}`);
      });
    }
  });
}

/**
 * Send a notification to a specific user
 * @param {Object} io - Socket.IO server instance
 * @param {number} userId - User ID
 * @param {Object} notification - Notification data
 */
function sendUserNotification(io, userId, notification) {
  io.to(`user:${userId}`).emit('notification', notification);
}

/**
 * Send a notification to a class
 * @param {Object} io - Socket.IO server instance
 * @param {number} classId - Class ID
 * @param {Object} notification - Notification data
 */
function sendClassNotification(io, classId, notification) {
  io.to(`class:${classId}`).emit('notification', notification);
}

/**
 * Broadcast notification to all users
 * @param {Object} io - Socket.IO server instance
 * @param {Object} notification - Notification data
 */
function broadcastNotification(io, notification) {
  io.emit('notification', notification);
}

/**
 * Get online status of a user
 * @param {number} userId - User ID
 * @returns {Object} Presence information
 */
function getUserPresence(userId) {
  return userPresence.get(userId) || { isOnline: false, lastSeen: null };
}

/**
 * Check if a user is connected
 * @param {number} userId - User ID
 * @returns {boolean} True if user has active connections
 */
function isUserConnected(userId) {
  return activeConnections.has(userId) && activeConnections.get(userId).size > 0;
}

/**
 * Get all online users
 * @returns {Array<number>} Array of online user IDs
 */
function getOnlineUsers() {
  return Array.from(activeConnections.keys());
}

module.exports = {
  setupSocketHandlers,
  sendUserNotification,
  sendClassNotification,
  broadcastNotification,
  getUserPresence,
  isUserConnected,
  getOnlineUsers
};