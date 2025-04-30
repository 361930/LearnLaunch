const express = require('express');
const router = express.Router();
const classService = require('../services/classes');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Get all classes
 * GET /api/classes
 */
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      subject, 
      language, 
      difficulty, 
      teacher_id,
      page = 1, 
      limit = 10 
    } = req.query;
    
    const classes = await classService.getClasses({
      search,
      subject,
      language,
      difficulty,
      teacher_id: teacher_id ? parseInt(teacher_id) : undefined,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json(classes);
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get class by ID
 * GET /api/classes/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const classId = parseInt(req.params.id);
    
    // Get user ID if authenticated
    const userId = req.user ? req.user.id : null;
    
    const classDetails = await classService.getClassById(classId, userId);
    
    res.json(classDetails);
  } catch (error) {
    console.error('Get class error:', error);
    res.status(404).json({ error: error.message });
  }
});

/**
 * Create a new class
 * POST /api/classes
 */
router.post('/', authenticate, authorize(['teacher']), async (req, res) => {
  try {
    const classData = req.body;
    
    const newClass = await classService.createClass(classData, req.user.id);
    
    res.status(201).json(newClass);
  } catch (error) {
    console.error('Create class error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Update a class
 * PUT /api/classes/:id
 */
router.put('/:id', authenticate, authorize(['teacher']), async (req, res) => {
  try {
    const classId = parseInt(req.params.id);
    const classData = req.body;
    
    const updatedClass = await classService.updateClass(classId, classData, req.user.id);
    
    res.json(updatedClass);
  } catch (error) {
    console.error('Update class error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Delete a class
 * DELETE /api/classes/:id
 */
router.delete('/:id', authenticate, authorize(['teacher']), async (req, res) => {
  try {
    const classId = parseInt(req.params.id);
    
    await classService.deleteClass(classId, req.user.id);
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Enroll in a class
 * POST /api/classes/:id/enroll
 */
router.post('/:id/enroll', authenticate, authorize(['student']), async (req, res) => {
  try {
    const classId = parseInt(req.params.id);
    
    const enrollment = await classService.enrollInClass(classId, req.user.id);
    
    res.status(201).json(enrollment);
  } catch (error) {
    console.error('Enroll in class error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Rate a class
 * POST /api/classes/:id/rate
 */
router.post('/:id/rate', authenticate, authorize(['student']), async (req, res) => {
  try {
    const classId = parseInt(req.params.id);
    const { rating, review } = req.body;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    await classService.rateClass(classId, req.user.id, rating, review);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Rate class error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get user's enrolled classes
 * GET /api/classes/user/enrolled
 */
router.get('/user/enrolled', authenticate, authorize(['student']), async (req, res) => {
  try {
    const enrollments = await classService.getStudentEnrollments(req.user.id);
    
    res.json(enrollments);
  } catch (error) {
    console.error('Get student enrollments error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user's teaching classes
 * GET /api/classes/user/teaching
 */
router.get('/user/teaching', authenticate, authorize(['teacher']), async (req, res) => {
  try {
    const classes = await classService.getTeacherClasses(req.user.id);
    
    res.json(classes);
  } catch (error) {
    console.error('Get teacher classes error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;