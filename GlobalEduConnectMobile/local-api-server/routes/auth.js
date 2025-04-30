const express = require('express');
const router = express.Router();
const authService = require('../services/auth');
const { authenticate } = require('../middleware/auth');

/**
 * Register a new user
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    
    // Register user
    const result = await authService.register({ email, password, name, role });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Login user
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Login user
    const result = await authService.login(email, password);
    
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

/**
 * Get current user
 * GET /api/auth/user
 */
router.get('/user', authenticate, async (req, res) => {
  try {
    // User is already attached to req by authenticate middleware
    res.json(req.user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update user profile
 * PATCH /api/auth/user
 */
router.patch('/user', authenticate, async (req, res) => {
  try {
    const { name, email, username, profile_image, preferred_language, timezone, ...profileUpdates } = req.body;
    
    // Update user
    const updatedUser = await authService.updateUser(
      req.user.id, 
      { name, email, username, profile_image, preferred_language, timezone, ...profileUpdates }
    );
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Change password
 * POST /api/auth/change-password
 */
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    // Change password
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;