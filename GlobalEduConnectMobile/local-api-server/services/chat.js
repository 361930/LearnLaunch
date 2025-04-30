const db = require('../db');

const ChatService = {
  /**
   * Get messages for a class
   */
  async getMessages(classId, limit = 50, offset = 0) {
    try {
      // Check if class exists
      const classDetails = await db.get(
        `SELECT * FROM classes WHERE id = ?`,
        [classId]
      );
      
      if (!classDetails) {
        throw new Error('Class not found');
      }
      
      // Get messages
      const messages = await db.all(
        `SELECT m.*, 
                u.name as user_name, 
                u.profile_image as user_profile_image,
                u.role as user_role
         FROM messages m
         JOIN users u ON m.user_id = u.id
         WHERE m.class_id = ?
         ORDER BY m.created_at DESC
         LIMIT ? OFFSET ?`,
        [classId, limit, offset]
      );
      
      // Reverse to get chronological order (oldest first)
      return messages.reverse();
    } catch (error) {
      console.error('Get messages error:', error);
      throw error;
    }
  },

  /**
   * Send a message
   */
  async sendMessage(classId, userId, content) {
    try {
      // Check if class exists
      const classDetails = await db.get(
        `SELECT * FROM classes WHERE id = ?`,
        [classId]
      );
      
      if (!classDetails) {
        throw new Error('Class not found');
      }
      
      // Check if user is enrolled or is the teacher
      const isTeacher = classDetails.teacher_id === userId;
      
      if (!isTeacher) {
        const enrollment = await db.get(
          `SELECT * FROM class_enrollments WHERE class_id = ? AND student_id = ?`,
          [classId, userId]
        );
        
        if (!enrollment) {
          throw new Error('You must be enrolled in this class to send messages');
        }
      }
      
      // Create message
      const result = await db.run(
        `INSERT INTO messages (class_id, user_id, content) 
         VALUES (?, ?, ?)`,
        [classId, userId, content]
      );
      
      // Get created message with user details
      const message = await db.get(
        `SELECT m.*, 
                u.name as user_name, 
                u.profile_image as user_profile_image,
                u.role as user_role
         FROM messages m
         JOIN users u ON m.user_id = u.id
         WHERE m.id = ?`,
        [result.id]
      );
      
      // Mark as read by sender
      await this.markMessageAsRead(message.id, userId);
      
      return message;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  },

  /**
   * Mark a message as read
   */
  async markMessageAsRead(messageId, userId) {
    try {
      // Check if already marked as read
      const existingRead = await db.get(
        `SELECT * FROM message_reads 
         WHERE message_id = ? AND user_id = ?`,
        [messageId, userId]
      );
      
      if (!existingRead) {
        // Mark as read
        await db.run(
          `INSERT INTO message_reads (message_id, user_id) 
           VALUES (?, ?)`,
          [messageId, userId]
        );
      }
      
      return { success: true };
    } catch (error) {
      console.error('Mark message as read error:', error);
      throw error;
    }
  },

  /**
   * Mark all messages in a class as read
   */
  async markAllMessagesAsRead(classId, userId) {
    try {
      // Get all unread message IDs
      const unreadMessages = await db.all(
        `SELECT m.id 
         FROM messages m
         LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = ?
         WHERE m.class_id = ? AND mr.id IS NULL`,
        [userId, classId]
      );
      
      // Mark all as read
      for (const message of unreadMessages) {
        await this.markMessageAsRead(message.id, userId);
      }
      
      return { success: true, count: unreadMessages.length };
    } catch (error) {
      console.error('Mark all messages as read error:', error);
      throw error;
    }
  },

  /**
   * Get unread message count
   */
  async getUnreadMessageCount(userId) {
    try {
      const result = await db.all(
        `SELECT m.class_id, COUNT(*) as count
         FROM messages m
         LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = ?
         WHERE mr.id IS NULL
         GROUP BY m.class_id`,
        [userId]
      );
      
      const unreadByClass = {};
      let totalUnread = 0;
      
      result.forEach(item => {
        unreadByClass[item.class_id] = item.count;
        totalUnread += item.count;
      });
      
      return {
        totalUnread,
        unreadByClass
      };
    } catch (error) {
      console.error('Get unread message count error:', error);
      throw error;
    }
  },

  /**
   * Setup Socket.IO handlers
   */
  setupSocketHandlers(io, authService) {
    // Authentication middleware for Socket.IO
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication token is required'));
        }
        
        // Verify token
        const decoded = authService.verifyToken(token);
        
        if (!decoded || !decoded.id) {
          return next(new Error('Invalid authentication token'));
        }
        
        // Get user
        const user = await authService.getUserById(decoded.id);
        
        if (!user) {
          return next(new Error('User not found'));
        }
        
        // Attach user to socket
        socket.user = user;
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
    
    // Connection handler
    io.on('connection', (socket) => {
      console.log(`User connected: ${socket.user.id}`);
      
      // Join room
      socket.on('join_room', async ({ roomId }) => {
        if (!roomId) return;
        
        // Extract class ID from room ID
        let classId = roomId;
        if (roomId.startsWith('class_')) {
          classId = roomId.replace('class_', '');
        }
        
        try {
          // Check if class exists
          const classDetails = await db.get(
            `SELECT * FROM classes WHERE id = ?`,
            [classId]
          );
          
          if (!classDetails) {
            socket.emit('error', { message: 'Class not found' });
            return;
          }
          
          // Check if user is enrolled or is the teacher
          const isTeacher = classDetails.teacher_id === socket.user.id;
          
          if (!isTeacher) {
            const enrollment = await db.get(
              `SELECT * FROM class_enrollments WHERE class_id = ? AND student_id = ?`,
              [classId, socket.user.id]
            );
            
            if (!enrollment) {
              socket.emit('error', { message: 'You must be enrolled in this class to join the chat' });
              return;
            }
          }
          
          // Join room
          socket.join(roomId);
          console.log(`User ${socket.user.id} joined room: ${roomId}`);
          
          // Mark all messages as read
          await this.markAllMessagesAsRead(classId, socket.user.id);
          
          socket.emit('room_joined', { roomId });
        } catch (error) {
          console.error('Join room error:', error);
          socket.emit('error', { message: error.message });
        }
      });
      
      // Leave room
      socket.on('leave_room', ({ roomId }) => {
        if (!roomId) return;
        
        socket.leave(roomId);
        console.log(`User ${socket.user.id} left room: ${roomId}`);
      });
      
      // Send message
      socket.on('send_message', async ({ roomId, message }) => {
        if (!roomId || !message) return;
        
        // Extract class ID from room ID
        let classId = roomId;
        if (roomId.startsWith('class_')) {
          classId = roomId.replace('class_', '');
        }
        
        try {
          // Save message to database
          const newMessage = await this.sendMessage(classId, socket.user.id, message);
          
          // Broadcast to room
          io.to(roomId).emit('new_message', newMessage);
        } catch (error) {
          console.error('Send message error:', error);
          socket.emit('error', { message: error.message });
        }
      });
      
      // Disconnect handler
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.user.id}`);
      });
    });
  }
};

module.exports = ChatService;