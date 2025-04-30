const db = require('../db');

const ClassService = {
  /**
   * Get all classes with optional filters
   */
  async getClasses({ search, subject, language, difficulty, teacher_id, page = 1, limit = 10 }) {
    try {
      const offset = (page - 1) * limit;
      
      // Build WHERE clause based on filters
      const whereConditions = [];
      const params = [];
      
      if (search) {
        whereConditions.push(`(c.title LIKE ? OR c.description LIKE ?)`);
        params.push(`%${search}%`, `%${search}%`);
      }
      
      if (subject) {
        whereConditions.push('c.subject = ?');
        params.push(subject);
      }
      
      if (language) {
        whereConditions.push('c.language = ?');
        params.push(language);
      }
      
      if (difficulty) {
        whereConditions.push('c.difficulty = ?');
        params.push(difficulty);
      }
      
      if (teacher_id) {
        whereConditions.push('c.teacher_id = ?');
        params.push(teacher_id);
      }
      
      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';
      
      // Get classes
      const classes = await db.all(
        `SELECT c.*, 
                u.name as teacher_name, 
                u.profile_image as teacher_profile_image,
                (SELECT COUNT(*) FROM class_enrollments ce WHERE ce.class_id = c.id) as enrollment_count
         FROM classes c
         JOIN users u ON c.teacher_id = u.id
         ${whereClause}
         ORDER BY c.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );
      
      // Get total count for pagination
      const [{ total }] = await db.all(
        `SELECT COUNT(*) as total
         FROM classes c
         ${whereClause}`,
        params
      );
      
      // Enhance classes with tags array
      const enhancedClasses = classes.map(cls => {
        return {
          ...cls,
          tags: cls.tags ? cls.tags.split(',').map(tag => tag.trim()) : [],
        };
      });
      
      return {
        classes: enhancedClasses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        }
      };
    } catch (error) {
      console.error('Get classes error:', error);
      throw error;
    }
  },

  /**
   * Get class by ID with detailed information
   */
  async getClassById(classId, userId = null) {
    try {
      // Get class details
      const classDetails = await db.get(
        `SELECT c.*, 
                u.name as teacher_name, 
                u.profile_image as teacher_profile_image,
                (SELECT COUNT(*) FROM class_enrollments ce WHERE ce.class_id = c.id) as enrollment_count
         FROM classes c
         JOIN users u ON c.teacher_id = u.id
         WHERE c.id = ?`,
        [classId]
      );
      
      if (!classDetails) {
        throw new Error('Class not found');
      }
      
      // Parse tags
      classDetails.tags = classDetails.tags ? classDetails.tags.split(',').map(tag => tag.trim()) : [];
      
      // Get teacher details
      const teacher = await db.get(
        `SELECT u.id, u.name, u.profile_image, u.role,
                tp.bio, tp.expertise, tp.average_rating, tp.total_ratings
         FROM users u
         JOIN teacher_profiles tp ON u.id = tp.user_id
         WHERE u.id = ?`,
        [classDetails.teacher_id]
      );
      
      classDetails.teacher = teacher;
      
      // Get class schedule
      const schedule = await db.all(
        `SELECT id, start_time, end_time, topic, description
         FROM class_schedules
         WHERE class_id = ?
         ORDER BY start_time`,
        [classId]
      );
      
      classDetails.schedule = schedule;
      
      // Get class ratings
      const ratings = await db.all(
        `SELECT cr.*, u.name as user_name, u.profile_image as user_profile_image
         FROM class_ratings cr
         JOIN users u ON cr.student_id = u.id
         WHERE cr.class_id = ?
         ORDER BY cr.created_at DESC
         LIMIT 10`,
        [classId]
      );
      
      classDetails.ratings = ratings;
      
      // Check if user is enrolled
      if (userId) {
        const enrollment = await db.get(
          `SELECT * FROM class_enrollments
           WHERE class_id = ? AND student_id = ?`,
          [classId, userId]
        );
        
        classDetails.enrollment = enrollment;
      }
      
      return classDetails;
    } catch (error) {
      console.error('Get class error:', error);
      throw error;
    }
  },

  /**
   * Create a new class
   */
  async createClass(classData, teacherId) {
    try {
      // Validate teacher role
      const teacher = await db.get(
        `SELECT * FROM users WHERE id = ? AND role = 'teacher'`,
        [teacherId]
      );
      
      if (!teacher) {
        throw new Error('Only teachers can create classes');
      }
      
      // Handle tags
      const tags = classData.tags ? classData.tags.join(',') : null;
      
      // Insert class
      const result = await db.run(
        `INSERT INTO classes (
          title, description, subject, language, difficulty, 
          teacher_id, is_active, max_students, tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          classData.title,
          classData.description,
          classData.subject,
          classData.language || 'English',
          classData.difficulty || 'beginner',
          teacherId,
          classData.is_active !== undefined ? classData.is_active : 1,
          classData.max_students || null,
          tags
        ]
      );
      
      // Insert class schedule if provided
      if (classData.schedule && Array.isArray(classData.schedule) && classData.schedule.length > 0) {
        for (const session of classData.schedule) {
          await db.run(
            `INSERT INTO class_schedules (
              class_id, start_time, end_time, topic, description
            ) VALUES (?, ?, ?, ?, ?)`,
            [
              result.id,
              session.start_time,
              session.end_time,
              session.topic || null,
              session.description || null
            ]
          );
        }
      }
      
      // Return created class
      return await this.getClassById(result.id);
    } catch (error) {
      console.error('Create class error:', error);
      throw error;
    }
  },

  /**
   * Update a class
   */
  async updateClass(classId, classData, userId) {
    try {
      // Check if class exists and user is the teacher
      const classDetails = await db.get(
        `SELECT * FROM classes WHERE id = ?`,
        [classId]
      );
      
      if (!classDetails) {
        throw new Error('Class not found');
      }
      
      if (classDetails.teacher_id !== userId) {
        throw new Error('You are not authorized to update this class');
      }
      
      // Handle tags
      const tags = classData.tags ? classData.tags.join(',') : undefined;
      
      // Build update query dynamically based on provided fields
      const updateFields = [];
      const updateValues = [];
      
      const fields = {
        title: classData.title,
        description: classData.description,
        subject: classData.subject,
        language: classData.language,
        difficulty: classData.difficulty,
        is_active: classData.is_active,
        max_students: classData.max_students,
        tags: tags
      };
      
      Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        }
      });
      
      if (updateFields.length > 0) {
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        
        // Update class
        await db.run(
          `UPDATE classes 
           SET ${updateFields.join(', ')} 
           WHERE id = ?`,
          [...updateValues, classId]
        );
      }
      
      // Update schedule if provided
      if (classData.schedule && Array.isArray(classData.schedule)) {
        // First delete existing schedule
        await db.run(
          `DELETE FROM class_schedules WHERE class_id = ?`,
          [classId]
        );
        
        // Then insert new schedule
        for (const session of classData.schedule) {
          await db.run(
            `INSERT INTO class_schedules (
              class_id, start_time, end_time, topic, description
            ) VALUES (?, ?, ?, ?, ?)`,
            [
              classId,
              session.start_time,
              session.end_time,
              session.topic || null,
              session.description || null
            ]
          );
        }
      }
      
      // Return updated class
      return await this.getClassById(classId);
    } catch (error) {
      console.error('Update class error:', error);
      throw error;
    }
  },

  /**
   * Delete a class
   */
  async deleteClass(classId, userId) {
    try {
      // Check if class exists and user is the teacher
      const classDetails = await db.get(
        `SELECT * FROM classes WHERE id = ?`,
        [classId]
      );
      
      if (!classDetails) {
        throw new Error('Class not found');
      }
      
      if (classDetails.teacher_id !== userId) {
        throw new Error('You are not authorized to delete this class');
      }
      
      // Delete class (cascade will delete enrollments, schedules, ratings, etc.)
      await db.run(
        `DELETE FROM classes WHERE id = ?`,
        [classId]
      );
      
      return { success: true };
    } catch (error) {
      console.error('Delete class error:', error);
      throw error;
    }
  },

  /**
   * Enroll in a class
   */
  async enrollInClass(classId, studentId) {
    try {
      // Check if class exists and is active
      const classDetails = await db.get(
        `SELECT * FROM classes WHERE id = ? AND is_active = 1`,
        [classId]
      );
      
      if (!classDetails) {
        throw new Error('Class not found or not active');
      }
      
      // Check if user is a student
      const student = await db.get(
        `SELECT * FROM users WHERE id = ? AND role = 'student'`,
        [studentId]
      );
      
      if (!student) {
        throw new Error('Only students can enroll in classes');
      }
      
      // Check if class is full
      if (classDetails.max_students) {
        const [{ count }] = await db.all(
          `SELECT COUNT(*) as count FROM class_enrollments WHERE class_id = ?`,
          [classId]
        );
        
        if (count >= classDetails.max_students) {
          throw new Error('Class is full');
        }
      }
      
      // Check if already enrolled
      const existingEnrollment = await db.get(
        `SELECT * FROM class_enrollments WHERE class_id = ? AND student_id = ?`,
        [classId, studentId]
      );
      
      if (existingEnrollment) {
        throw new Error('You are already enrolled in this class');
      }
      
      // Create enrollment
      const result = await db.run(
        `INSERT INTO class_enrollments (class_id, student_id) VALUES (?, ?)`,
        [classId, studentId]
      );
      
      // Get enrollment
      const enrollment = await db.get(
        `SELECT * FROM class_enrollments WHERE id = ?`,
        [result.id]
      );
      
      return enrollment;
    } catch (error) {
      console.error('Enroll in class error:', error);
      throw error;
    }
  },

  /**
   * Get student enrollments
   */
  async getStudentEnrollments(studentId) {
    try {
      const enrollments = await db.all(
        `SELECT ce.*, 
                c.title, c.description, c.subject, c.language, c.difficulty, 
                c.average_rating, c.tags,
                u.name as teacher_name, 
                u.profile_image as teacher_profile_image
         FROM class_enrollments ce
         JOIN classes c ON ce.class_id = c.id
         JOIN users u ON c.teacher_id = u.id
         WHERE ce.student_id = ?
         ORDER BY ce.created_at DESC`,
        [studentId]
      );
      
      // Enhance enrollments with tags array
      const enhancedEnrollments = enrollments.map(enrollment => {
        return {
          ...enrollment,
          tags: enrollment.tags ? enrollment.tags.split(',').map(tag => tag.trim()) : [],
        };
      });
      
      return enhancedEnrollments;
    } catch (error) {
      console.error('Get student enrollments error:', error);
      throw error;
    }
  },

  /**
   * Get teacher classes
   */
  async getTeacherClasses(teacherId) {
    try {
      const classes = await db.all(
        `SELECT c.*, 
                (SELECT COUNT(*) FROM class_enrollments ce WHERE ce.class_id = c.id) as enrollment_count
         FROM classes c
         WHERE c.teacher_id = ?
         ORDER BY c.created_at DESC`,
        [teacherId]
      );
      
      // Enhance classes with tags array
      const enhancedClasses = classes.map(cls => {
        return {
          ...cls,
          tags: cls.tags ? cls.tags.split(',').map(tag => tag.trim()) : [],
        };
      });
      
      return enhancedClasses;
    } catch (error) {
      console.error('Get teacher classes error:', error);
      throw error;
    }
  },

  /**
   * Rate a class
   */
  async rateClass(classId, studentId, rating, review) {
    try {
      // Check if class exists
      const classDetails = await db.get(
        `SELECT * FROM classes WHERE id = ?`,
        [classId]
      );
      
      if (!classDetails) {
        throw new Error('Class not found');
      }
      
      // Check if student is enrolled
      const enrollment = await db.get(
        `SELECT * FROM class_enrollments WHERE class_id = ? AND student_id = ?`,
        [classId, studentId]
      );
      
      if (!enrollment) {
        throw new Error('You must be enrolled in this class to rate it');
      }
      
      // Check if already rated
      const existingRating = await db.get(
        `SELECT * FROM class_ratings WHERE class_id = ? AND student_id = ?`,
        [classId, studentId]
      );
      
      if (existingRating) {
        // Update existing rating
        await db.run(
          `UPDATE class_ratings 
           SET rating = ?, review = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [rating, review || null, existingRating.id]
        );
      } else {
        // Create new rating
        await db.run(
          `INSERT INTO class_ratings (class_id, student_id, rating, review) 
           VALUES (?, ?, ?, ?)`,
          [classId, studentId, rating, review || null]
        );
      }
      
      // Update class average rating
      await this.updateClassAverageRating(classId);
      
      return { success: true };
    } catch (error) {
      console.error('Rate class error:', error);
      throw error;
    }
  },

  /**
   * Update class average rating
   */
  async updateClassAverageRating(classId) {
    try {
      // Get average rating and count
      const [{ average, count }] = await db.all(
        `SELECT AVG(rating) as average, COUNT(*) as count 
         FROM class_ratings 
         WHERE class_id = ?`,
        [classId]
      );
      
      // Update class
      await db.run(
        `UPDATE classes 
         SET average_rating = ? 
         WHERE id = ?`,
        [average || 0, classId]
      );
      
      return { average, count };
    } catch (error) {
      console.error('Update class average rating error:', error);
      throw error;
    }
  },
};

module.exports = ClassService;