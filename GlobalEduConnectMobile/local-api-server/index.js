require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Data storage paths
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CLASSES_FILE = path.join(DATA_DIR, 'classes.json');
const ENROLLMENTS_FILE = path.join(DATA_DIR, 'enrollments.json');
const RATINGS_FILE = path.join(DATA_DIR, 'ratings.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Initialize data files if they don't exist
const initializeDataFile = (filePath, initialData = []) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
  }
};

initializeDataFile(USERS_FILE);
initializeDataFile(CLASSES_FILE);
initializeDataFile(ENROLLMENTS_FILE);
initializeDataFile(RATINGS_FILE);
initializeDataFile(MESSAGES_FILE);

// Helper functions for data access
const readData = (filePath) => {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const writeData = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Auth endpoints
app.post('/auth/register', (req, res) => {
  try {
    const { email, password, role, name, isDemo } = req.body;
    
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role are required' });
    }
    
    const users = readData(USERS_FILE);
    
    // Check if user already exists
    if (users.find(user => user.email === email)) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }
    
    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    
    // Create new user
    const newUser = {
      id: users.length + 1,
      email,
      password: hashedPassword,
      role,
      name: name || email.split('@')[0],
      createdAt: new Date().toISOString(),
      isDemo: isDemo || false
    };
    
    users.push(newUser);
    writeData(USERS_FILE, users);
    
    // Generate token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role }, 
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

app.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const users = readData(USERS_FILE);
    const user = users.find(user => user.email === email);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, 
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(200).json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

app.get('/auth/me', authenticateToken, (req, res) => {
  try {
    const users = readData(USERS_FILE);
    const user = users.find(user => user.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error getting user data' });
  }
});

// Classes endpoints
app.get('/classes', (req, res) => {
  try {
    const { enrolled, recommended, createdBy, search, page = 1, limit = 10, subject, language, difficulty } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    let classes = readData(CLASSES_FILE);
    let filteredClasses = [...classes];
    
    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filteredClasses = filteredClasses.filter(cls => 
        cls.title.toLowerCase().includes(searchLower) || 
        cls.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by subject
    if (subject) {
      filteredClasses = filteredClasses.filter(cls => cls.subject === subject);
    }
    
    // Filter by language
    if (language) {
      filteredClasses = filteredClasses.filter(cls => cls.language === language);
    }
    
    // Filter by difficulty
    if (difficulty) {
      filteredClasses = filteredClasses.filter(cls => cls.difficulty === difficulty);
    }
    
    // Special filters
    if (req.user) {
      if (enrolled === 'true') {
        const enrollments = readData(ENROLLMENTS_FILE);
        const userEnrollments = enrollments.filter(e => e.userId === req.user.id);
        filteredClasses = filteredClasses.filter(cls => 
          userEnrollments.some(e => e.classId === cls.id)
        );
      }
      
      if (createdBy === 'self') {
        filteredClasses = filteredClasses.filter(cls => cls.createdBy === req.user.id);
      }
      
      if (recommended === 'true') {
        // Simple recommendation algorithm - show classes not enrolled in
        const enrollments = readData(ENROLLMENTS_FILE);
        const userEnrollments = enrollments.filter(e => e.userId === req.user.id);
        const enrolledClassIds = userEnrollments.map(e => e.classId);
        
        filteredClasses = filteredClasses.filter(cls => 
          !enrolledClassIds.includes(cls.id)
        );
        
        // Sort by rating
        const ratings = readData(RATINGS_FILE);
        filteredClasses.forEach(cls => {
          const classRatings = ratings.filter(r => r.classId === cls.id);
          cls.averageRating = classRatings.length 
            ? classRatings.reduce((sum, r) => sum + r.rating, 0) / classRatings.length 
            : 0;
        });
        
        filteredClasses.sort((a, b) => b.averageRating - a.averageRating);
      }
    }
    
    // Pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = pageNum * limitNum;
    const paginatedClasses = filteredClasses.slice(startIndex, endIndex);
    
    res.status(200).json({
      classes: paginatedClasses,
      totalCount: filteredClasses.length,
      hasMore: endIndex < filteredClasses.length
    });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ message: 'Server error getting classes' });
  }
});

app.get('/classes/:id', (req, res) => {
  try {
    const classId = parseInt(req.params.id);
    const classes = readData(CLASSES_FILE);
    const classData = classes.find(cls => cls.id === classId);
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Get ratings
    const ratings = readData(RATINGS_FILE);
    const classRatings = ratings.filter(r => r.classId === classId);
    
    // Calculate average rating
    const averageRating = classRatings.length 
      ? classRatings.reduce((sum, r) => sum + r.rating, 0) / classRatings.length 
      : 0;
    
    // Get enrollment count
    const enrollments = readData(ENROLLMENTS_FILE);
    const enrollmentCount = enrollments.filter(e => e.classId === classId).length;
    
    res.status(200).json({
      ...classData,
      averageRating,
      enrollmentCount,
      ratings: classRatings
    });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ message: 'Server error getting class details' });
  }
});

app.post('/classes', authenticateToken, (req, res) => {
  try {
    // Only teachers and admins can create classes
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only teachers can create classes' });
    }
    
    const { title, description, subject, language, difficulty, schedule } = req.body;
    
    if (!title || !description || !subject) {
      return res.status(400).json({ message: 'Title, description, and subject are required' });
    }
    
    const classes = readData(CLASSES_FILE);
    
    const newClass = {
      id: classes.length + 1,
      title,
      description,
      subject,
      language: language || 'English',
      difficulty: difficulty || 'Beginner',
      schedule: schedule || [],
      createdBy: req.user.id,
      createdAt: new Date().toISOString()
    };
    
    classes.push(newClass);
    writeData(CLASSES_FILE, classes);
    
    res.status(201).json(newClass);
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ message: 'Server error creating class' });
  }
});

app.post('/classes/:id/join', authenticateToken, (req, res) => {
  try {
    // Only students can join classes
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can join classes' });
    }
    
    const classId = parseInt(req.params.id);
    
    // Check if class exists
    const classes = readData(CLASSES_FILE);
    const classData = classes.find(cls => cls.id === classId);
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Check if already enrolled
    const enrollments = readData(ENROLLMENTS_FILE);
    const existingEnrollment = enrollments.find(
      e => e.classId === classId && e.userId === req.user.id
    );
    
    if (existingEnrollment) {
      return res.status(409).json({ message: 'Already enrolled in this class' });
    }
    
    // Create enrollment
    const newEnrollment = {
      id: enrollments.length + 1,
      classId,
      userId: req.user.id,
      enrolledAt: new Date().toISOString(),
      progress: 0
    };
    
    enrollments.push(newEnrollment);
    writeData(ENROLLMENTS_FILE, enrollments);
    
    res.status(201).json(newEnrollment);
  } catch (error) {
    console.error('Join class error:', error);
    res.status(500).json({ message: 'Server error joining class' });
  }
});

// User profile endpoints
app.get('/users/me', authenticateToken, (req, res) => {
  try {
    const users = readData(USERS_FILE);
    const user = users.find(user => user.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    // Get enrollments for students
    if (user.role === 'student') {
      const enrollments = readData(ENROLLMENTS_FILE);
      const userEnrollments = enrollments.filter(e => e.userId === user.id);
      userWithoutPassword.enrollments = userEnrollments;
    }
    
    // Get created classes for teachers
    if (user.role === 'teacher') {
      const classes = readData(CLASSES_FILE);
      const createdClasses = classes.filter(cls => cls.createdBy === user.id);
      userWithoutPassword.classes = createdClasses;
    }
    
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error getting profile' });
  }
});

app.patch('/users/me', authenticateToken, (req, res) => {
  try {
    const { name, bio, profilePicture } = req.body;
    
    const users = readData(USERS_FILE);
    const userIndex = users.findIndex(user => user.id === req.user.id);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user
    if (name) users[userIndex].name = name;
    if (bio) users[userIndex].bio = bio;
    if (profilePicture) users[userIndex].profilePicture = profilePicture;
    
    writeData(USERS_FILE, users);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = users[userIndex];
    
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// Ratings endpoints
app.post('/classes/:id/rate', authenticateToken, (req, res) => {
  try {
    const classId = parseInt(req.params.id);
    const { rating, review } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    // Check if class exists
    const classes = readData(CLASSES_FILE);
    const classData = classes.find(cls => cls.id === classId);
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Check if enrolled
    const enrollments = readData(ENROLLMENTS_FILE);
    const enrollment = enrollments.find(
      e => e.classId === classId && e.userId === req.user.id
    );
    
    if (!enrollment) {
      return res.status(403).json({ message: 'You must be enrolled to rate this class' });
    }
    
    // Check if already rated
    const ratings = readData(RATINGS_FILE);
    const existingRating = ratings.find(
      r => r.classId === classId && r.userId === req.user.id
    );
    
    if (existingRating) {
      // Update existing rating
      existingRating.rating = rating;
      existingRating.review = review;
      existingRating.updatedAt = new Date().toISOString();
      writeData(RATINGS_FILE, ratings);
      return res.status(200).json(existingRating);
    }
    
    // Create new rating
    const newRating = {
      id: ratings.length + 1,
      classId,
      userId: req.user.id,
      rating,
      review,
      createdAt: new Date().toISOString()
    };
    
    ratings.push(newRating);
    writeData(RATINGS_FILE, ratings);
    
    res.status(201).json(newRating);
  } catch (error) {
    console.error('Rate class error:', error);
    res.status(500).json({ message: 'Server error rating class' });
  }
});

// Messages endpoints (fallback if Firebase is down)
app.get('/discussion/:classId/messages', authenticateToken, (req, res) => {
  try {
    const classId = parseInt(req.params.classId);
    
    // Check if class exists
    const classes = readData(CLASSES_FILE);
    const classData = classes.find(cls => cls.id === classId);
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Get messages for this class
    const messages = readData(MESSAGES_FILE);
    const classMessages = messages.filter(m => m.classId === classId);
    
    // Sort by timestamp
    classMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    res.status(200).json(classMessages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error getting messages' });
  }
});

app.post('/discussion/:classId/messages', authenticateToken, (req, res) => {
  try {
    const classId = parseInt(req.params.classId);
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }
    
    // Check if class exists
    const classes = readData(CLASSES_FILE);
    const classData = classes.find(cls => cls.id === classId);
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Create new message
    const messages = readData(MESSAGES_FILE);
    const newMessage = {
      id: messages.length + 1,
      classId,
      userId: req.user.id,
      userName: req.user.name,
      content,
      timestamp: new Date().toISOString(),
      readBy: [req.user.id]
    };
    
    messages.push(newMessage);
    writeData(MESSAGES_FILE, messages);
    
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error sending message' });
  }
});

// Mark messages as read
app.post('/discussion/:classId/read', authenticateToken, (req, res) => {
  try {
    const classId = parseInt(req.params.classId);
    
    const messages = readData(MESSAGES_FILE);
    
    // Update all messages for this class
    let updated = false;
    messages.forEach(message => {
      if (message.classId === classId && !message.readBy.includes(req.user.id)) {
        message.readBy.push(req.user.id);
        updated = true;
      }
    });
    
    if (updated) {
      writeData(MESSAGES_FILE, messages);
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error marking messages as read' });
  }
});

// Start server
app.listen(PORT, () => console.log(`API Server running at http://localhost:${PORT}`));