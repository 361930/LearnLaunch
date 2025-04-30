const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

// JWT secret key (in production, this would be an environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_for_development';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

// Number of bcrypt salt rounds
const SALT_ROUNDS = 10;

// User roles
const ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
};

// Auth service methods
const AuthService = {
  /**
   * Register a new user
   */
  async register(userData) {
    const { email, password, name, role = ROLES.STUDENT } = userData;

    // Validate role
    if (!Object.values(ROLES).includes(role)) {
      throw new Error(`Invalid role. Must be one of: ${Object.values(ROLES).join(', ')}`);
    }

    try {
      // Check if user already exists
      const existingUser = await db.get(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user
      const result = await db.run(
        `INSERT INTO users (name, email, password, role) 
         VALUES (?, ?, ?, ?)`,
        [name, email, hashedPassword, role]
      );

      // Get created user
      const user = await db.get(
        'SELECT id, name, email, role, username, profile_image, preferred_language, timezone, status, created_at FROM users WHERE id = ?',
        [result.id]
      );

      // Create corresponding profile based on role
      if (role === ROLES.STUDENT) {
        await db.run(
          'INSERT INTO student_profiles (user_id) VALUES (?)',
          [user.id]
        );
      } else if (role === ROLES.TEACHER) {
        await db.run(
          'INSERT INTO teacher_profiles (user_id) VALUES (?)',
          [user.id]
        );
      }

      // Generate JWT token
      const token = this.generateToken(user);

      return {
        user,
        token,
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  /**
   * Login a user
   */
  async login(email, password) {
    try {
      // Find user by email
      const user = await db.get(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if user is active
      if (user.status !== 'active') {
        throw new Error(`Your account is ${user.status}. Please contact support.`);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = user;

      // Generate JWT token
      const token = this.generateToken(userWithoutPassword);

      // Update last login timestamp
      await db.run(
        'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id]
      );

      return {
        user: userWithoutPassword,
        token,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  /**
   * Generate JWT token for user
   */
  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  },

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      console.error('Token verification error:', error);
      throw new Error('Invalid token');
    }
  },

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    try {
      const user = await db.get(
        `SELECT id, name, email, role, username, profile_image, 
                preferred_language, timezone, status, created_at, updated_at 
         FROM users 
         WHERE id = ?`,
        [userId]
      );

      if (!user) {
        throw new Error('User not found');
      }

      // Get user profile based on role
      if (user.role === ROLES.STUDENT) {
        const profile = await db.get(
          'SELECT * FROM student_profiles WHERE user_id = ?',
          [userId]
        );
        user.profile = profile || null;
      } else if (user.role === ROLES.TEACHER) {
        const profile = await db.get(
          'SELECT * FROM teacher_profiles WHERE user_id = ?',
          [userId]
        );
        user.profile = profile || null;
      }

      return user;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  },

  /**
   * Update user profile
   */
  async updateUser(userId, updates) {
    try {
      // Start transaction
      await db.transaction(async () => {
        // Update user table fields
        const { name, email, username, profile_image, preferred_language, timezone, ...profileUpdates } = updates;
        
        if (Object.keys({ name, email, username, profile_image, preferred_language, timezone }).some(key => updates[key] !== undefined)) {
          // Build update query dynamically based on provided fields
          const fields = Object.entries({
            name, email, username, profile_image, preferred_language, timezone
          })
            .filter(([key, value]) => value !== undefined)
            .map(([key]) => `${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = ?`);
          
          const values = Object.entries({
            name, email, username, profile_image, preferred_language, timezone
          })
            .filter(([key, value]) => value !== undefined)
            .map(([, value]) => value);
          
          if (fields.length > 0) {
            const updateQuery = `
              UPDATE users 
              SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
              WHERE id = ?
            `;
            
            await db.run(updateQuery, [...values, userId]);
          }
        }
        
        // Update profile table fields if any
        const user = await this.getUserById(userId);
        
        if (Object.keys(profileUpdates).length > 0) {
          if (user.role === ROLES.STUDENT) {
            // Build student profile update query
            const { bio, interests, education_level } = profileUpdates;
            const fields = Object.entries({ bio, interests, education_level })
              .filter(([key, value]) => value !== undefined)
              .map(([key]) => `${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = ?`);
            
            const values = Object.entries({ bio, interests, education_level })
              .filter(([key, value]) => value !== undefined)
              .map(([, value]) => value);
            
            if (fields.length > 0) {
              const updateQuery = `
                UPDATE student_profiles 
                SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
                WHERE user_id = ?
              `;
              
              await db.run(updateQuery, [...values, userId]);
            }
          } else if (user.role === ROLES.TEACHER) {
            // Build teacher profile update query
            const { bio, expertise, years_experience } = profileUpdates;
            const fields = Object.entries({ bio, expertise, years_experience })
              .filter(([key, value]) => value !== undefined)
              .map(([key]) => `${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = ?`);
            
            const values = Object.entries({ bio, expertise, years_experience })
              .filter(([key, value]) => value !== undefined)
              .map(([, value]) => value);
            
            if (fields.length > 0) {
              const updateQuery = `
                UPDATE teacher_profiles 
                SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
                WHERE user_id = ?
              `;
              
              await db.run(updateQuery, [...values, userId]);
            }
          }
        }
      });
      
      // Return updated user
      return await this.getUserById(userId);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  },

  /**
   * Change user password
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get user with password
      const user = await db.get(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

      // Update password
      await db.run(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, userId]
      );

      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },
};

module.exports = AuthService;