import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hasRole, isAdmin, isTeacherOrAdmin } from "./auth";
import { WebSocketServer } from "ws";
import { z } from "zod";
import { eq, and, or, sql, desc } from 'drizzle-orm';
import { insertClassSchema, insertAccessibilitySettingsSchema, classes } from "@shared/schema";
import { db } from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket server for live class functionality
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Map to store active class sessions
  const activeSessions = new Map();
  
  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'join-class') {
          const { classId, userId, userName } = data;
          
          // Add user to the class session
          if (!activeSessions.has(classId)) {
            activeSessions.set(classId, new Map());
          }
          
          const classSession = activeSessions.get(classId);
          classSession.set(userId, { ws, userName });
          
          // Notify others that user has joined
          classSession.forEach((client, clientId) => {
            if (clientId !== userId && client.ws.readyState === ws.OPEN) {
              client.ws.send(JSON.stringify({
                type: 'user-joined',
                userId,
                userName,
              }));
            }
          });
          
          // Send current participants to the new user
          const participants = [];
          classSession.forEach((client, clientId) => {
            if (clientId !== userId) {
              participants.push({
                userId: clientId,
                userName: client.userName,
              });
            }
          });
          
          ws.send(JSON.stringify({
            type: 'class-joined',
            participants,
          }));
        }
        else if (data.type === 'leave-class') {
          const { classId, userId } = data;
          
          if (activeSessions.has(classId)) {
            const classSession = activeSessions.get(classId);
            const user = classSession.get(userId);
            
            if (user) {
              classSession.delete(userId);
              
              // Notify others that user has left
              classSession.forEach((client) => {
                if (client.ws.readyState === ws.OPEN) {
                  client.ws.send(JSON.stringify({
                    type: 'user-left',
                    userId,
                  }));
                }
              });
              
              // If no more users in session, remove the session
              if (classSession.size === 0) {
                activeSessions.delete(classId);
              }
            }
          }
        }
        else if (data.type === 'class-message') {
          const { classId, userId, userName, message } = data;
          
          if (activeSessions.has(classId)) {
            const classSession = activeSessions.get(classId);
            
            // Broadcast message to all users in the class
            classSession.forEach((client) => {
              if (client.ws.readyState === ws.OPEN) {
                client.ws.send(JSON.stringify({
                  type: 'class-message',
                  userId,
                  userName,
                  message,
                  timestamp: new Date().toISOString(),
                }));
              }
            });
          }
        }
      } catch (error) {
        console.error('WebSocket error:', error);
      }
    });
    
    ws.on('close', () => {
      // Clean up any sessions this user was part of
      activeSessions.forEach((classSession, classId) => {
        classSession.forEach((client, userId) => {
          if (client.ws === ws) {
            classSession.delete(userId);
            
            // Notify others
            classSession.forEach((otherClient) => {
              if (otherClient.ws.readyState === ws.OPEN) {
                otherClient.ws.send(JSON.stringify({
                  type: 'user-left',
                  userId,
                }));
              }
            });
            
            // Remove empty sessions
            if (classSession.size === 0) {
              activeSessions.delete(classId);
            }
          }
        });
      });
    });
  });

  // User profile routes
  app.get("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check privacy settings
      if (user.id !== req.user.id && req.user.role !== "admin") {
        if (user.privacySettings === "private") {
          return res.status(403).json({ message: "This profile is private" });
        }
        if (user.privacySettings === "semi-public" && !req.isAuthenticated()) {
          return res.status(403).json({ message: "You must be logged in to view this profile" });
        }
      }
      
      // Don't send password hash
      const { password, ...userWithoutPassword } = user;
      
      // Get additional profile data based on role
      let profileData = null;
      if (user.role === "student") {
        profileData = await storage.getStudentProfile(userId);
      } else if (user.role === "teacher") {
        profileData = await storage.getTeacherProfile(userId);
      }
      
      res.json({ 
        ...userWithoutPassword, 
        profile: profileData 
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  app.patch("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Only allow users to update their own profile (or admins)
      if (userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to update this user" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Extract and validate user data to update
      const { role, status, ...updateData } = req.body;
      
      // Only admins can change role or status
      if ((role || status) && req.user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to change role or status" });
      }
      
      // Update user
      const updatedUser = await storage.updateUser(userId, {
        ...updateData,
        ...(req.user.role === "admin" ? { role, status } : {}),
      });
      
      // Update profile data if provided
      if (req.body.profile) {
        if (user.role === "student") {
          await storage.updateStudentProfile(userId, req.body.profile);
        } else if (user.role === "teacher") {
          await storage.updateTeacherProfile(userId, req.body.profile);
        }
      }
      
      // Get latest profile data
      let profileData = null;
      if (user.role === "student") {
        profileData = await storage.getStudentProfile(userId);
      } else if (user.role === "teacher") {
        profileData = await storage.getTeacherProfile(userId);
      }
      
      // Don't send password hash
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json({
        ...userWithoutPassword,
        profile: profileData
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  // Accessibility settings
  app.get("/api/accessibility", isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.getAccessibilitySettings(req.user.id);
      res.json(settings || {});
    } catch (error) {
      console.error("Error fetching accessibility settings:", error);
      res.status(500).json({ message: "Failed to fetch accessibility settings" });
    }
  });
  
  app.post("/api/accessibility", isAuthenticated, async (req, res) => {
    try {
      const schema = insertAccessibilitySettingsSchema.extend({
        userId: z.number()
      });
      
      const data = schema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const settings = await storage.updateAccessibilitySettings(data);
      res.json(settings);
    } catch (error) {
      console.error("Error updating accessibility settings:", error);
      res.status(500).json({ message: "Failed to update accessibility settings" });
    }
  });
  
  // Class routes
  app.get("/api/classes", async (req, res) => {
    try {
      const { upcoming, featured, search, category, teacherId, live, language } = req.query;
      
      if (upcoming === "true") {
        const upcomingClasses = await storage.getUpcomingClasses(10);
        return res.json(upcomingClasses);
      }
      
      if (featured === "true") {
        // Get classes with highest ratings
        const classes = await db
          .select()
          .from(classes)
          .orderBy(desc(classes.avgRating))
          .limit(6);
        return res.json(classes);
      }
      
      if (search) {
        const searchString = search.toString();
        const filters: any = {};
        
        if (category) filters.category = category.toString();
        if (teacherId) filters.teacherId = parseInt(teacherId.toString());
        if (language) filters.language = language.toString();
        
        const results = await storage.searchClasses(searchString, filters);
        return res.json(results);
      }
      
      // Get all classes with pagination
      const limit = parseInt(req.query.limit?.toString() || "20");
      const offset = parseInt(req.query.offset?.toString() || "0");
      
      // Basic query with filters
      let query = db.select().from(classes);
      
      if (teacherId) {
        query = query.where(eq(classes.teacherId, parseInt(teacherId.toString())));
      }
      
      if (live === "true") {
        query = query.where(eq(classes.isLive, true));
      }
      
      if (category) {
        query = query.where(eq(classes.category, category.toString()));
      }
      
      if (language) {
        query = query.where(eq(classes.language, language.toString()));
      }
      
      const results = await query
        .limit(limit)
        .offset(offset)
        .orderBy(desc(classes.createdAt));
      
      res.json(results);
    } catch (error) {
      console.error("Error fetching classes:", error);
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });
  
  app.get("/api/classes/:id", async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      
      if (isNaN(classId)) {
        return res.status(400).json({ message: "Invalid class ID" });
      }
      
      const classData = await storage.getClass(classId);
      
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      // Get teacher data
      const teacher = await storage.getUser(classData.teacherId);
      const teacherProfile = await storage.getTeacherProfile(classData.teacherId);
      
      // Get ratings
      const ratings = await storage.getClassRatings(classId);
      
      // Remove sensitive teacher data
      const { password, ...teacherWithoutPassword } = teacher;
      
      res.json({
        ...classData,
        teacher: teacherWithoutPassword,
        teacherProfile,
        ratings
      });
    } catch (error) {
      console.error("Error fetching class:", error);
      res.status(500).json({ message: "Failed to fetch class" });
    }
  });
  
  app.post("/api/classes", isTeacherOrAdmin, async (req, res) => {
    try {
      const schema = insertClassSchema.extend({
        teacherId: z.number()
      });
      
      const data = schema.parse({
        ...req.body,
        teacherId: req.user.id
      });
      
      const newClass = await storage.createClass(data);
      res.status(201).json(newClass);
    } catch (error) {
      console.error("Error creating class:", error);
      res.status(500).json({ message: "Failed to create class" });
    }
  });
  
  app.patch("/api/classes/:id", isTeacherOrAdmin, async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      
      if (isNaN(classId)) {
        return res.status(400).json({ message: "Invalid class ID" });
      }
      
      const classData = await storage.getClass(classId);
      
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      // Check if user is the class creator or an admin
      if (classData.teacherId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to update this class" });
      }
      
      const updatedClass = await storage.updateClass(classId, req.body);
      res.json(updatedClass);
    } catch (error) {
      console.error("Error updating class:", error);
      res.status(500).json({ message: "Failed to update class" });
    }
  });
  
  app.delete("/api/classes/:id", isTeacherOrAdmin, async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      
      if (isNaN(classId)) {
        return res.status(400).json({ message: "Invalid class ID" });
      }
      
      const classData = await storage.getClass(classId);
      
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      // Check if user is the class creator or an admin
      if (classData.teacherId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to delete this class" });
      }
      
      await storage.deleteClass(classId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting class:", error);
      res.status(500).json({ message: "Failed to delete class" });
    }
  });
  
  // Class enrollment routes
  app.post("/api/classes/:id/enroll", isAuthenticated, async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      
      if (isNaN(classId)) {
        return res.status(400).json({ message: "Invalid class ID" });
      }
      
      const classData = await storage.getClass(classId);
      
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      // Check if user is already enrolled
      const existingEnrollment = await storage.getClassEnrollment(classId, req.user.id);
      
      if (existingEnrollment) {
        return res.status(400).json({ message: "You are already enrolled in this class" });
      }
      
      // Check if class is at capacity
      if (classData.maxAttendees) {
        const enrollments = await storage.getClassEnrollments(classId);
        if (enrollments.length >= classData.maxAttendees) {
          return res.status(400).json({ message: "Class is at full capacity" });
        }
      }
      
      const enrollment = await storage.createClassEnrollment({
        classId,
        studentId: req.user.id,
      });
      
      res.status(201).json(enrollment);
    } catch (error) {
      console.error("Error enrolling in class:", error);
      res.status(500).json({ message: "Failed to enroll in class" });
    }
  });
  
  app.get("/api/classes/:id/enrollments", isTeacherOrAdmin, async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      
      if (isNaN(classId)) {
        return res.status(400).json({ message: "Invalid class ID" });
      }
      
      const classData = await storage.getClass(classId);
      
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      // Check if user is the class creator or an admin
      if (classData.teacherId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to view enrollments for this class" });
      }
      
      const enrollments = await storage.getClassEnrollments(classId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });
  
  // Ratings routes
  app.post("/api/classes/:id/rate", isAuthenticated, async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      
      if (isNaN(classId)) {
        return res.status(400).json({ message: "Invalid class ID" });
      }
      
      const classData = await storage.getClass(classId);
      
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      // Ensure the user has enrolled in the class
      const enrollment = await storage.getClassEnrollment(classId, req.user.id);
      
      if (!enrollment) {
        return res.status(403).json({ message: "You must be enrolled in a class to rate it" });
      }
      
      const { rating, review } = req.body;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be a number between 1 and 5" });
      }
      
      const classRating = await storage.createClassRating({
        classId,
        studentId: req.user.id,
        rating,
        review,
      });
      
      res.status(201).json(classRating);
    } catch (error) {
      console.error("Error rating class:", error);
      res.status(500).json({ message: "Failed to submit rating" });
    }
  });
  
  app.post("/api/teachers/:id/rate", isAuthenticated, async (req, res) => {
    try {
      const teacherId = parseInt(req.params.id);
      
      if (isNaN(teacherId)) {
        return res.status(400).json({ message: "Invalid teacher ID" });
      }
      
      const teacher = await storage.getUser(teacherId);
      
      if (!teacher || teacher.role !== "teacher") {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      const { rating, review } = req.body;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be a number between 1 and 5" });
      }
      
      const teacherRating = await storage.createTeacherRating({
        teacherId,
        studentId: req.user.id,
        rating,
        review,
      });
      
      res.status(201).json(teacherRating);
    } catch (error) {
      console.error("Error rating teacher:", error);
      res.status(500).json({ message: "Failed to submit rating" });
    }
  });
  
  // Favorites routes
  app.post("/api/teachers/:id/favorite", isAuthenticated, async (req, res) => {
    try {
      const teacherId = parseInt(req.params.id);
      
      if (isNaN(teacherId)) {
        return res.status(400).json({ message: "Invalid teacher ID" });
      }
      
      const teacher = await storage.getUser(teacherId);
      
      if (!teacher || teacher.role !== "teacher") {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      // Create favorite
      const favorite = await storage.addFavoriteTeacher({
        studentId: req.user.id,
        teacherId,
      });
      
      res.status(201).json(favorite);
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });
  
  app.delete("/api/teachers/:id/favorite", isAuthenticated, async (req, res) => {
    try {
      const teacherId = parseInt(req.params.id);
      
      if (isNaN(teacherId)) {
        return res.status(400).json({ message: "Invalid teacher ID" });
      }
      
      const result = await storage.removeFavoriteTeacher(req.user.id, teacherId);
      
      if (!result) {
        return res.status(404).json({ message: "Favorite not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });
  
  app.get("/api/user/favorites", isAuthenticated, async (req, res) => {
    try {
      const favorites = await storage.getFavoriteTeachers(req.user.id);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });
  
  // Donations routes
  app.post("/api/teachers/:id/donate", isAuthenticated, async (req, res) => {
    try {
      const teacherId = parseInt(req.params.id);
      
      if (isNaN(teacherId)) {
        return res.status(400).json({ message: "Invalid teacher ID" });
      }
      
      const teacher = await storage.getUser(teacherId);
      
      if (!teacher || teacher.role !== "teacher") {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      const { amount, currency, message, isAnonymous } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Amount must be greater than 0" });
      }
      
      const donation = await storage.createDonation({
        senderId: req.user.id,
        receiverId: teacherId,
        amount,
        currency: currency || "USD",
        message,
        isAnonymous: isAnonymous || false,
      });
      
      res.status(201).json(donation);
    } catch (error) {
      console.error("Error creating donation:", error);
      res.status(500).json({ message: "Failed to create donation" });
    }
  });
  
  app.get("/api/user/donations/received", isAuthenticated, async (req, res) => {
    try {
      // You can only view your own received donations
      const donations = await storage.getDonationsReceived(req.user.id);
      res.json(donations);
    } catch (error) {
      console.error("Error fetching received donations:", error);
      res.status(500).json({ message: "Failed to fetch received donations" });
    }
  });
  
  app.get("/api/user/donations/sent", isAuthenticated, async (req, res) => {
    try {
      // You can only view your own sent donations
      const donations = await storage.getDonationsMade(req.user.id);
      res.json(donations);
    } catch (error) {
      console.error("Error fetching sent donations:", error);
      res.status(500).json({ message: "Failed to fetch sent donations" });
    }
  });
  
  // Reports routes
  app.post("/api/reports", isAuthenticated, async (req, res) => {
    try {
      const { reportType, description, reportedUserId, reportedClassId } = req.body;
      
      if (!reportType || !description) {
        return res.status(400).json({ message: "Report type and description are required" });
      }
      
      if (!reportedUserId && !reportedClassId) {
        return res.status(400).json({ message: "Must report either a user or a class" });
      }
      
      const report = await storage.createReport({
        reporterId: req.user.id,
        reportType,
        description,
        reportedUserId: reportedUserId ? parseInt(reportedUserId) : undefined,
        reportedClassId: reportedClassId ? parseInt(reportedClassId) : undefined,
      });
      
      res.status(201).json(report);
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(500).json({ message: "Failed to create report" });
    }
  });
  
  app.get("/api/reports", isAdmin, async (req, res) => {
    try {
      const status = req.query.status?.toString();
      const reports = await storage.getReports(status);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });
  
  app.patch("/api/reports/:id", isAdmin, async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      
      if (isNaN(reportId)) {
        return res.status(400).json({ message: "Invalid report ID" });
      }
      
      const { status, notes } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const report = await storage.updateReportStatus(reportId, status, req.user.id, notes);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      res.json(report);
    } catch (error) {
      console.error("Error updating report:", error);
      res.status(500).json({ message: "Failed to update report" });
    }
  });
  
  // Forum routes
  app.get("/api/forums/:type", async (req, res) => {
    try {
      const forumType = req.params.type;
      
      if (forumType !== "student" && forumType !== "teacher") {
        return res.status(400).json({ message: "Invalid forum type" });
      }
      
      // If it's the teacher forum, check if user is a teacher or admin
      if (forumType === "teacher" && (!req.isAuthenticated() || (req.user.role !== "teacher" && req.user.role !== "admin"))) {
        return res.status(403).json({ message: "Only teachers and admins can access the teacher forum" });
      }
      
      const parentId = req.query.parentId ? parseInt(req.query.parentId.toString()) : undefined;
      
      const posts = await storage.getForumPostsByType(forumType, parentId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching forum posts:", error);
      res.status(500).json({ message: "Failed to fetch forum posts" });
    }
  });
  
  app.post("/api/forums/:type", isAuthenticated, async (req, res) => {
    try {
      const forumType = req.params.type;
      
      if (forumType !== "student" && forumType !== "teacher") {
        return res.status(400).json({ message: "Invalid forum type" });
      }
      
      // If it's the teacher forum, check if user is a teacher or admin
      if (forumType === "teacher" && req.user.role !== "teacher" && req.user.role !== "admin") {
        return res.status(403).json({ message: "Only teachers and admins can post in the teacher forum" });
      }
      
      const { title, content, parentId } = req.body;
      
      if (!title && !parentId) {
        return res.status(400).json({ message: "Title is required for new topics" });
      }
      
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }
      
      const post = await storage.createForumPost({
        authorId: req.user.id,
        forumType,
        title: title || "",
        content,
        parentId: parentId ? parseInt(parentId) : undefined,
      });
      
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating forum post:", error);
      res.status(500).json({ message: "Failed to create forum post" });
    }
  });
  
  // Announcements routes
  app.get("/api/announcements", async (req, res) => {
    try {
      // If not authenticated, return public announcements only
      const targetRole = req.isAuthenticated() ? req.user.role : "all";
      const announcements = await storage.getAnnouncements(targetRole);
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });
  
  app.post("/api/announcements", isAdmin, async (req, res) => {
    try {
      const { title, content, targetRole, expiresAt, isPinned } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required" });
      }
      
      const announcement = await storage.createAnnouncement({
        adminId: req.user.id,
        title,
        content,
        targetRole: targetRole || "all",
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        isPinned: isPinned || false,
      });
      
      res.status(201).json(announcement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(500).json({ message: "Failed to create announcement" });
    }
  });
  
  // Chat routes
  app.get("/api/chat/:userId", isAuthenticated, async (req, res) => {
    try {
      const otherUserId = parseInt(req.params.userId);
      
      if (isNaN(otherUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const otherUser = await storage.getUser(otherUserId);
      
      if (!otherUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Mark messages as read
      await storage.markChatMessagesAsRead(req.user.id, otherUserId);
      
      // Get messages
      const limit = parseInt(req.query.limit?.toString() || "50");
      const messages = await storage.getChatMessages(req.user.id, otherUserId, limit);
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });
  
  app.post("/api/chat/:userId", isAuthenticated, async (req, res) => {
    try {
      const receiverId = parseInt(req.params.userId);
      
      if (isNaN(receiverId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const receiver = await storage.getUser(receiverId);
      
      if (!receiver) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message content is required" });
      }
      
      const chatMessage = await storage.createChatMessage({
        senderId: req.user.id,
        receiverId,
        message,
      });
      
      res.status(201).json(chatMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });
  
  // Admin routes
  app.get("/api/admin/teachers/pending", isAdmin, async (req, res) => {
    try {
      const pendingTeachers = await storage.getUsersByStatus("pending");
      res.json(pendingTeachers.filter(user => user.role === "teacher"));
    } catch (error) {
      console.error("Error fetching pending teachers:", error);
      res.status(500).json({ message: "Failed to fetch pending teachers" });
    }
  });
  
  app.patch("/api/admin/teachers/:id/approve", isAdmin, async (req, res) => {
    try {
      const teacherId = parseInt(req.params.id);
      
      if (isNaN(teacherId)) {
        return res.status(400).json({ message: "Invalid teacher ID" });
      }
      
      const teacher = await storage.getUser(teacherId);
      
      if (!teacher || teacher.role !== "teacher") {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      const result = await storage.updateUserStatus(teacherId, "active");
      
      if (!result) {
        return res.status(500).json({ message: "Failed to approve teacher" });
      }
      
      const updatedTeacher = await storage.getUser(teacherId);
      res.json(updatedTeacher);
    } catch (error) {
      console.error("Error approving teacher:", error);
      res.status(500).json({ message: "Failed to approve teacher" });
    }
  });
  
  app.patch("/api/admin/teachers/:id/reject", isAdmin, async (req, res) => {
    try {
      const teacherId = parseInt(req.params.id);
      
      if (isNaN(teacherId)) {
        return res.status(400).json({ message: "Invalid teacher ID" });
      }
      
      const teacher = await storage.getUser(teacherId);
      
      if (!teacher || teacher.role !== "teacher") {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      const result = await storage.updateUserStatus(teacherId, "blocked");
      
      if (!result) {
        return res.status(500).json({ message: "Failed to reject teacher" });
      }
      
      const updatedTeacher = await storage.getUser(teacherId);
      res.json(updatedTeacher);
    } catch (error) {
      console.error("Error rejecting teacher:", error);
      res.status(500).json({ message: "Failed to reject teacher" });
    }
  });
  
  app.patch("/api/admin/users/:id/block", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const result = await storage.updateUserStatus(userId, "blocked");
      
      if (!result) {
        return res.status(500).json({ message: "Failed to block user" });
      }
      
      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error blocking user:", error);
      res.status(500).json({ message: "Failed to block user" });
    }
  });
  
  app.patch("/api/admin/users/:id/unblock", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const result = await storage.updateUserStatus(userId, "active");
      
      if (!result) {
        return res.status(500).json({ message: "Failed to unblock user" });
      }
      
      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error unblocking user:", error);
      res.status(500).json({ message: "Failed to unblock user" });
    }
  });
  
  app.patch("/api/admin/users/:id/block-country", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const { country } = req.body;
      
      if (!country) {
        return res.status(400).json({ message: "Country is required" });
      }
      
      const result = await storage.blockUserFromCountry(userId, country);
      
      if (!result) {
        return res.status(500).json({ message: "Failed to block country" });
      }
      
      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error blocking country:", error);
      res.status(500).json({ message: "Failed to block country" });
    }
  });
  
  app.patch("/api/admin/users/:id/unblock-country", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const { country } = req.body;
      
      if (!country) {
        return res.status(400).json({ message: "Country is required" });
      }
      
      const result = await storage.unblockUserFromCountry(userId, country);
      
      if (!result) {
        return res.status(500).json({ message: "Failed to unblock country" });
      }
      
      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error unblocking country:", error);
      res.status(500).json({ message: "Failed to unblock country" });
    }
  });

  // Challenge Routes
  
  // Get all challenges with optional filtering
  app.get("/api/challenges", async (req, res) => {
    try {
      const { search, difficulty, category } = req.query;
      
      let challenges = await storage.getAllChallenges();
      
      // Apply filters if provided
      if (search) {
        challenges = challenges.filter(challenge => 
          challenge.title.toLowerCase().includes(String(search).toLowerCase()) || 
          challenge.description.toLowerCase().includes(String(search).toLowerCase())
        );
      }
      
      if (difficulty) {
        challenges = challenges.filter(challenge => challenge.difficulty === difficulty);
      }
      
      if (category) {
        challenges = challenges.filter(challenge => challenge.category === category);
      }
      
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      res.status(500).json({ message: "Failed to fetch challenges" });
    }
  });

  // Get a single challenge by ID
  app.get("/api/challenges/:id", async (req, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      
      if (isNaN(challengeId)) {
        return res.status(400).json({ message: "Invalid challenge ID" });
      }
      
      const challenge = await storage.getChallenge(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      res.json(challenge);
    } catch (error) {
      console.error("Error fetching challenge:", error);
      res.status(500).json({ message: "Failed to fetch challenge" });
    }
  });

  // Get challenges created by or participated in by the current user
  app.get("/api/challenges/my", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const userChallenges = await storage.getUserChallenges(userId);
      res.json(userChallenges);
    } catch (error) {
      console.error("Error fetching user challenges:", error);
      res.status(500).json({ message: "Failed to fetch user challenges" });
    }
  });

  // Create a new challenge
  app.post("/api/challenges", isAuthenticated, async (req, res) => {
    try {
      const challenge = await storage.createChallenge({
        ...req.body,
        creatorId: req.user.id,
      });
      
      res.status(201).json(challenge);
    } catch (error) {
      console.error("Error creating challenge:", error);
      res.status(500).json({ message: "Failed to create challenge" });
    }
  });

  // Get challenge participants
  app.get("/api/challenges/:id/participants", async (req, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      
      if (isNaN(challengeId)) {
        return res.status(400).json({ message: "Invalid challenge ID" });
      }
      
      const participants = await storage.getChallengeParticipants(challengeId);
      res.json(participants);
    } catch (error) {
      console.error("Error fetching challenge participants:", error);
      res.status(500).json({ message: "Failed to fetch challenge participants" });
    }
  });

  // Get current user's participation in a challenge
  app.get("/api/challenges/:id/my-participation", isAuthenticated, async (req, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      
      if (isNaN(challengeId)) {
        return res.status(400).json({ message: "Invalid challenge ID" });
      }
      
      const userId = req.user.id;
      const participation = await storage.getChallengeParticipation(challengeId, userId);
      
      if (!participation) {
        return res.status(404).json({ message: "Participation not found" });
      }
      
      res.json(participation);
    } catch (error) {
      console.error("Error fetching challenge participation:", error);
      res.status(500).json({ message: "Failed to fetch challenge participation" });
    }
  });

  // Join a challenge
  app.post("/api/challenges/:id/join", isAuthenticated, async (req, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      
      if (isNaN(challengeId)) {
        return res.status(400).json({ message: "Invalid challenge ID" });
      }
      
      const userId = req.user.id;
      
      // Check if challenge exists
      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      // Check if user already joined
      const existingParticipation = await storage.getChallengeParticipation(challengeId, userId);
      if (existingParticipation) {
        return res.status(400).json({ message: "You have already joined this challenge" });
      }
      
      // Check if challenge is active
      if (!challenge.isActive) {
        return res.status(400).json({ message: "This challenge is no longer active" });
      }
      
      // Check if challenge has reached maximum participants
      if (challenge.maxParticipants && challenge.currentParticipants >= challenge.maxParticipants) {
        return res.status(400).json({ message: "This challenge has reached its maximum number of participants" });
      }
      
      // Join challenge
      const participation = await storage.joinChallenge(challengeId, userId);
      
      // Update challenge participant count
      await storage.updateChallengeParticipants(challengeId, challenge.currentParticipants + 1);
      
      res.status(201).json(participation);
    } catch (error) {
      console.error("Error joining challenge:", error);
      res.status(500).json({ message: "Failed to join challenge" });
    }
  });

  // Submit solution for a challenge
  app.post("/api/challenges/:id/submit", isAuthenticated, async (req, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      
      if (isNaN(challengeId)) {
        return res.status(400).json({ message: "Invalid challenge ID" });
      }
      
      const userId = req.user.id;
      
      // Check if challenge exists
      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      // Check if user has joined the challenge
      const participation = await storage.getChallengeParticipation(challengeId, userId);
      if (!participation) {
        return res.status(400).json({ message: "You must join the challenge before submitting" });
      }
      
      // Update participation with submission
      const updatedParticipation = await storage.updateChallengeParticipation(
        participation.id,
        {
          ...req.body,
          status: "completed",
          completedAt: new Date(),
        }
      );
      
      res.json(updatedParticipation);
    } catch (error) {
      console.error("Error submitting challenge solution:", error);
      res.status(500).json({ message: "Failed to submit challenge solution" });
    }
  });

  // Get challenge comments
  app.get("/api/challenges/:id/comments", async (req, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      
      if (isNaN(challengeId)) {
        return res.status(400).json({ message: "Invalid challenge ID" });
      }
      
      const comments = await storage.getChallengeComments(challengeId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching challenge comments:", error);
      res.status(500).json({ message: "Failed to fetch challenge comments" });
    }
  });

  // Add comment to a challenge
  app.post("/api/challenges/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      
      if (isNaN(challengeId)) {
        return res.status(400).json({ message: "Invalid challenge ID" });
      }
      
      const comment = await storage.createChallengeComment({
        ...req.body,
        challengeId,
        userId: req.user.id,
      });
      
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating challenge comment:", error);
      res.status(500).json({ message: "Failed to create challenge comment" });
    }
  });

  return httpServer;
}
