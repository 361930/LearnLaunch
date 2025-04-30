const express = require('express');
const router = express.Router();
const chatService = require('../services/chat');
const { authenticate } = require('../middleware/auth');

/**
 * Get messages for a class
 * GET /api/chat/classes/:id
 */
router.get('/classes/:id', authenticate, async (req, res) => {
  try {
    const classId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const messages = await chatService.getMessages(classId, limit, offset);
    
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send a message to a class
 * POST /api/chat/classes/:id
 */
router.post('/classes/:id', authenticate, async (req, res) => {
  try {
    const classId = parseInt(req.params.id);
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    const message = await chatService.sendMessage(classId, req.user.id, content);
    
    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Mark all messages in a class as read
 * POST /api/chat/classes/:id/read
 */
router.post('/classes/:id/read', authenticate, async (req, res) => {
  try {
    const classId = parseInt(req.params.id);
    
    const result = await chatService.markAllMessagesAsRead(classId, req.user.id);
    
    res.json(result);
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get unread message count
 * GET /api/chat/unread
 */
router.get('/unread', authenticate, async (req, res) => {
  try {
    const unreadCount = await chatService.getUnreadMessageCount(req.user.id);
    
    res.json(unreadCount);
  } catch (error) {
    console.error('Get unread message count error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;