import { 
  users, studentProfiles, teacherProfiles, classes, classEnrollments, 
  teacherRatings, classRatings, favorites, donations, reports, forumPosts, 
  announcements, chatMessages, accessibilitySettings, challenges, challengeParticipations,
  challengeComments,
  type User, type InsertUser, type StudentProfile, type InsertStudentProfile,
  type TeacherProfile, type InsertTeacherProfile, type Class, type InsertClass,
  type ClassEnrollment, type InsertClassEnrollment, type TeacherRating, 
  type InsertTeacherRating, type ClassRating, type InsertClassRating,
  type Favorite, type InsertFavorite, type Donation, type InsertDonation,
  type Report, type InsertReport, type ForumPost, type InsertForumPost,
  type Announcement, type InsertAnnouncement, type ChatMessage, 
  type InsertChatMessage, type AccessibilitySettings, type InsertAccessibilitySettings,
  type Challenge, type InsertChallenge, type ChallengeParticipation, 
  type InsertChallengeParticipation, type ChallengeComment, type InsertChallengeComment
} from "@shared/schema";
import { db } from './db';
import { eq, and, or, desc, asc, like, ilike, isNull, gte, lt, sql, SQL } from 'drizzle-orm';
import { compare, hash } from 'bcrypt';
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";
import { PgColumn } from "drizzle-orm/pg-core";

const SALT_ROUNDS = 10;

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getUsersWithRole(role: string): Promise<User[]>;
  getUsersByStatus(status: string): Promise<User[]>;
  blockUserFromCountry(userId: number, country: string): Promise<boolean>;
  unblockUserFromCountry(userId: number, country: string): Promise<boolean>;
  updateUserStatus(userId: number, status: string): Promise<boolean>;
  
  // Student profile operations
  getStudentProfile(userId: number): Promise<StudentProfile | undefined>;
  createStudentProfile(profile: InsertStudentProfile): Promise<StudentProfile>;
  updateStudentProfile(userId: number, updates: Partial<InsertStudentProfile>): Promise<StudentProfile | undefined>;
  
  // Teacher profile operations
  getTeacherProfile(userId: number): Promise<TeacherProfile | undefined>;
  createTeacherProfile(profile: InsertTeacherProfile): Promise<TeacherProfile>;
  updateTeacherProfile(userId: number, updates: Partial<InsertTeacherProfile>): Promise<TeacherProfile | undefined>;
  getTeachersByRating(minRating?: number, limit?: number): Promise<(TeacherProfile & { user: User })[]>;
  
  // Class operations
  getClass(id: number): Promise<Class | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: number, updates: Partial<InsertClass>): Promise<Class | undefined>;
  deleteClass(id: number): Promise<boolean>;
  getClassesByTeacher(teacherId: number): Promise<Class[]>;
  getUpcomingClasses(limit?: number): Promise<Class[]>;
  searchClasses(query: string, filters?: Partial<{ category: string, language: string, teacherId: number }>): Promise<Class[]>;
  
  // Class enrollment operations
  getClassEnrollment(classId: number, studentId: number): Promise<ClassEnrollment | undefined>;
  createClassEnrollment(enrollment: InsertClassEnrollment): Promise<ClassEnrollment>;
  updateClassEnrollment(id: number, updates: Partial<InsertClassEnrollment>): Promise<ClassEnrollment | undefined>;
  getStudentEnrollments(studentId: number): Promise<(ClassEnrollment & { class: Class })[]>;
  getClassEnrollments(classId: number): Promise<(ClassEnrollment & { student: User })[]>;
  
  // Rating operations
  getTeacherRatings(teacherId: number): Promise<TeacherRating[]>;
  createTeacherRating(rating: InsertTeacherRating): Promise<TeacherRating>;
  getClassRatings(classId: number): Promise<ClassRating[]>;
  createClassRating(rating: InsertClassRating): Promise<ClassRating>;
  updateTeacherAverageRating(teacherId: number): Promise<number>;
  updateClassAverageRating(classId: number): Promise<number>;
  
  // Favorites operations
  addFavoriteTeacher(favorite: InsertFavorite): Promise<Favorite>;
  removeFavoriteTeacher(studentId: number, teacherId: number): Promise<boolean>;
  getFavoriteTeachers(studentId: number): Promise<(Favorite & { teacher: User & { teacherProfile: TeacherProfile } })[]>;
  
  // Donation operations
  createDonation(donation: InsertDonation): Promise<Donation>;
  getDonationsReceived(userId: number): Promise<Donation[]>;
  getDonationsMade(userId: number): Promise<Donation[]>;
  
  // Report operations
  createReport(report: InsertReport): Promise<Report>;
  getReports(status?: string): Promise<Report[]>;
  updateReportStatus(id: number, status: string, adminId: number, notes?: string): Promise<Report | undefined>;
  
  // Forum operations
  createForumPost(post: InsertForumPost): Promise<ForumPost>;
  getForumPostsByType(forumType: string, parentId?: number): Promise<ForumPost[]>;
  getForumPost(id: number): Promise<ForumPost | undefined>;
  
  // Announcement operations
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  getAnnouncements(targetRole?: string): Promise<Announcement[]>;
  
  // Chat operations
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(userId1: number, userId2: number, limit?: number): Promise<ChatMessage[]>;
  markChatMessagesAsRead(receiverId: number, senderId: number): Promise<boolean>;
  
  // Accessibility operations
  getAccessibilitySettings(userId: number): Promise<AccessibilitySettings | undefined>;
  updateAccessibilitySettings(settings: InsertAccessibilitySettings): Promise<AccessibilitySettings>;

  // Challenge operations
  getAllChallenges(): Promise<Challenge[]>;
  getChallenge(id: number): Promise<Challenge | undefined>;
  getUserChallenges(userId: number): Promise<Challenge[]>; 
  createChallenge(data: InsertChallenge): Promise<Challenge>;
  getChallengeParticipants(challengeId: number): Promise<ChallengeParticipation[]>;
  getChallengeParticipation(challengeId: number, userId: number): Promise<ChallengeParticipation | undefined>;
  joinChallenge(challengeId: number, userId: number): Promise<ChallengeParticipation>;
  updateChallengeParticipation(id: number, data: Partial<ChallengeParticipation>): Promise<ChallengeParticipation>;
  updateChallengeParticipants(challengeId: number, count: number): Promise<Challenge>;
  getChallengeComments(challengeId: number): Promise<ChallengeComment[]>;
  createChallengeComment(data: InsertChallengeComment): Promise<ChallengeComment>;

  // Store for session
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Hash password before storing
    const hashedPassword = await hash(userData.password, SALT_ROUNDS);
    const [user] = await db.insert(users).values({
      ...userData,
      password: hashedPassword
    }).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    // If password is included, hash it
    if (updates.password) {
      updates.password = await hash(updates.password, SALT_ROUNDS);
    }
    
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.count > 0;
  }

  async getUsersWithRole(role: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role));
  }

  async getUsersByStatus(status: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.status, status));
  }

  async blockUserFromCountry(userId: number, country: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    const blockedCountries = user.blockedFromCountries || [];
    if (!blockedCountries.includes(country)) {
      blockedCountries.push(country);
    }

    await db
      .update(users)
      .set({ blockedFromCountries: blockedCountries, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return true;
  }

  async unblockUserFromCountry(userId: number, country: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    const blockedCountries = user.blockedFromCountries || [];
    const updatedCountries = blockedCountries.filter(c => c !== country);

    await db
      .update(users)
      .set({ blockedFromCountries: updatedCountries, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return true;
  }

  async updateUserStatus(userId: number, status: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, userId));
    
    return result.count > 0;
  }

  // Student profile operations
  async getStudentProfile(userId: number): Promise<StudentProfile | undefined> {
    const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId));
    return profile;
  }

  async createStudentProfile(profile: InsertStudentProfile): Promise<StudentProfile> {
    const [createdProfile] = await db.insert(studentProfiles).values(profile).returning();
    return createdProfile;
  }

  async updateStudentProfile(userId: number, updates: Partial<InsertStudentProfile>): Promise<StudentProfile | undefined> {
    const [updatedProfile] = await db
      .update(studentProfiles)
      .set(updates)
      .where(eq(studentProfiles.userId, userId))
      .returning();
    
    return updatedProfile;
  }

  // Teacher profile operations
  async getTeacherProfile(userId: number): Promise<TeacherProfile | undefined> {
    const [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, userId));
    return profile;
  }

  async createTeacherProfile(profile: InsertTeacherProfile): Promise<TeacherProfile> {
    const [createdProfile] = await db.insert(teacherProfiles).values(profile).returning();
    return createdProfile;
  }

  async updateTeacherProfile(userId: number, updates: Partial<InsertTeacherProfile>): Promise<TeacherProfile | undefined> {
    const [updatedProfile] = await db
      .update(teacherProfiles)
      .set(updates)
      .where(eq(teacherProfiles.userId, userId))
      .returning();
    
    return updatedProfile;
  }

  async getTeachersByRating(minRating: number = 4, limit: number = 10): Promise<(TeacherProfile & { user: User })[]> {
    return db
      .select({
        teacherProfile: teacherProfiles,
        user: users
      })
      .from(teacherProfiles)
      .innerJoin(users, eq(teacherProfiles.userId, users.id))
      .where(gte(teacherProfiles.avgRating, minRating))
      .orderBy(desc(teacherProfiles.avgRating))
      .limit(limit)
      .then(results => 
        results.map(r => ({ ...r.teacherProfile, user: r.user }))
      );
  }

  // Class operations
  async getClass(id: number): Promise<Class | undefined> {
    const [classData] = await db.select().from(classes).where(eq(classes.id, id));
    return classData;
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const [createdClass] = await db.insert(classes).values(classData).returning();
    return createdClass;
  }

  async updateClass(id: number, updates: Partial<InsertClass>): Promise<Class | undefined> {
    const [updatedClass] = await db
      .update(classes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(classes.id, id))
      .returning();
    
    return updatedClass;
  }

  async deleteClass(id: number): Promise<boolean> {
    const result = await db.delete(classes).where(eq(classes.id, id));
    return result.count > 0;
  }

  async getClassesByTeacher(teacherId: number): Promise<Class[]> {
    return db.select().from(classes).where(eq(classes.teacherId, teacherId));
  }

  async getUpcomingClasses(limit: number = 10): Promise<Class[]> {
    const now = new Date();
    return db
      .select()
      .from(classes)
      .where(and(
        eq(classes.isLive, true),
        gte(classes.startTime, now)
      ))
      .orderBy(asc(classes.startTime))
      .limit(limit);
  }

  async searchClasses(query: string, filters?: Partial<{ category: string, language: string, teacherId: number }>): Promise<Class[]> {
    let queryBuilder = db
      .select()
      .from(classes)
      .where(
        or(
          ilike(classes.title, `%${query}%`),
          ilike(classes.description, `%${query}%`)
        )
      );
    
    if (filters?.category) {
      queryBuilder = queryBuilder.where(eq(classes.category, filters.category));
    }
    
    if (filters?.language) {
      queryBuilder = queryBuilder.where(eq(classes.language, filters.language));
    }
    
    if (filters?.teacherId) {
      queryBuilder = queryBuilder.where(eq(classes.teacherId, filters.teacherId));
    }
    
    return queryBuilder;
  }

  // Class enrollment operations
  async getClassEnrollment(classId: number, studentId: number): Promise<ClassEnrollment | undefined> {
    const [enrollment] = await db
      .select()
      .from(classEnrollments)
      .where(and(
        eq(classEnrollments.classId, classId),
        eq(classEnrollments.studentId, studentId)
      ));
    
    return enrollment;
  }

  async createClassEnrollment(enrollment: InsertClassEnrollment): Promise<ClassEnrollment> {
    const [created] = await db.insert(classEnrollments).values(enrollment).returning();
    return created;
  }

  async updateClassEnrollment(id: number, updates: Partial<InsertClassEnrollment>): Promise<ClassEnrollment | undefined> {
    const [updated] = await db
      .update(classEnrollments)
      .set(updates)
      .where(eq(classEnrollments.id, id))
      .returning();
    
    return updated;
  }

  async getStudentEnrollments(studentId: number): Promise<(ClassEnrollment & { class: Class })[]> {
    return db
      .select({
        enrollment: classEnrollments,
        class: classes
      })
      .from(classEnrollments)
      .innerJoin(classes, eq(classEnrollments.classId, classes.id))
      .where(eq(classEnrollments.studentId, studentId))
      .then(results => 
        results.map(r => ({ ...r.enrollment, class: r.class }))
      );
  }

  async getClassEnrollments(classId: number): Promise<(ClassEnrollment & { student: User })[]> {
    return db
      .select({
        enrollment: classEnrollments,
        student: users
      })
      .from(classEnrollments)
      .innerJoin(users, eq(classEnrollments.studentId, users.id))
      .where(eq(classEnrollments.classId, classId))
      .then(results => 
        results.map(r => ({ ...r.enrollment, student: r.student }))
      );
  }

  // Rating operations
  async getTeacherRatings(teacherId: number): Promise<TeacherRating[]> {
    return db
      .select()
      .from(teacherRatings)
      .where(eq(teacherRatings.teacherId, teacherId))
      .orderBy(desc(teacherRatings.createdAt));
  }

  async createTeacherRating(rating: InsertTeacherRating): Promise<TeacherRating> {
    const [created] = await db.insert(teacherRatings).values(rating).returning();
    
    // Update the teacher's average rating
    await this.updateTeacherAverageRating(rating.teacherId);
    
    return created;
  }

  async getClassRatings(classId: number): Promise<ClassRating[]> {
    return db
      .select()
      .from(classRatings)
      .where(eq(classRatings.classId, classId))
      .orderBy(desc(classRatings.createdAt));
  }

  async createClassRating(rating: InsertClassRating): Promise<ClassRating> {
    const [created] = await db.insert(classRatings).values(rating).returning();
    
    // Update the class's average rating
    await this.updateClassAverageRating(rating.classId);
    
    return created;
  }

  async updateTeacherAverageRating(teacherId: number): Promise<number> {
    // Calculate new average rating
    const result = await db
      .select({
        avgRating: sql<number>`avg(${teacherRatings.rating})`,
        totalRatings: sql<number>`count(${teacherRatings.id})`
      })
      .from(teacherRatings)
      .where(eq(teacherRatings.teacherId, teacherId));
    
    const avgRating = result[0]?.avgRating || 0;
    const totalRatings = result[0]?.totalRatings || 0;
    
    // Update teacher profile
    await db
      .update(teacherProfiles)
      .set({ 
        avgRating, 
        totalRatings 
      })
      .where(eq(teacherProfiles.userId, teacherId));
    
    return avgRating;
  }

  async updateClassAverageRating(classId: number): Promise<number> {
    // Calculate new average rating
    const result = await db
      .select({
        avgRating: sql<number>`avg(${classRatings.rating})`,
        totalRatings: sql<number>`count(${classRatings.id})`
      })
      .from(classRatings)
      .where(eq(classRatings.classId, classId));
    
    const avgRating = result[0]?.avgRating || 0;
    const totalRatings = result[0]?.totalRatings || 0;
    
    // Update class
    await db
      .update(classes)
      .set({ 
        avgRating, 
        totalRatings,
        updatedAt: new Date()
      })
      .where(eq(classes.id, classId));
    
    return avgRating;
  }

  // Favorites operations
  async addFavoriteTeacher(favorite: InsertFavorite): Promise<Favorite> {
    const [created] = await db.insert(favorites).values(favorite).returning();
    return created;
  }

  async removeFavoriteTeacher(studentId: number, teacherId: number): Promise<boolean> {
    const result = await db
      .delete(favorites)
      .where(and(
        eq(favorites.studentId, studentId),
        eq(favorites.teacherId, teacherId)
      ));
    
    return result.count > 0;
  }

  async getFavoriteTeachers(studentId: number): Promise<(Favorite & { teacher: User & { teacherProfile: TeacherProfile } })[]> {
    return db
      .select({
        favorite: favorites,
        teacher: users,
        teacherProfile: teacherProfiles
      })
      .from(favorites)
      .innerJoin(users, eq(favorites.teacherId, users.id))
      .innerJoin(teacherProfiles, eq(users.id, teacherProfiles.userId))
      .where(eq(favorites.studentId, studentId))
      .then(results => 
        results.map(r => ({ 
          ...r.favorite, 
          teacher: { 
            ...r.teacher, 
            teacherProfile: r.teacherProfile 
          } 
        }))
      );
  }

  // Donation operations
  async createDonation(donation: InsertDonation): Promise<Donation> {
    const [created] = await db.insert(donations).values(donation).returning();
    return created;
  }

  async getDonationsReceived(userId: number): Promise<Donation[]> {
    return db
      .select()
      .from(donations)
      .where(eq(donations.receiverId, userId))
      .orderBy(desc(donations.createdAt));
  }

  async getDonationsMade(userId: number): Promise<Donation[]> {
    return db
      .select()
      .from(donations)
      .where(eq(donations.senderId, userId))
      .orderBy(desc(donations.createdAt));
  }

  // Report operations
  async createReport(report: InsertReport): Promise<Report> {
    const [created] = await db.insert(reports).values(report).returning();
    return created;
  }

  async getReports(status?: string): Promise<Report[]> {
    let query = db.select().from(reports).orderBy(desc(reports.createdAt));
    
    if (status) {
      query = query.where(eq(reports.status, status));
    }
    
    return query;
  }

  async updateReportStatus(id: number, status: string, adminId: number, notes?: string): Promise<Report | undefined> {
    const [updated] = await db
      .update(reports)
      .set({ 
        status, 
        reviewedBy: adminId, 
        reviewedAt: new Date(),
        adminNotes: notes
      })
      .where(eq(reports.id, id))
      .returning();
    
    return updated;
  }

  // Forum operations
  async createForumPost(post: InsertForumPost): Promise<ForumPost> {
    const [created] = await db.insert(forumPosts).values(post).returning();
    return created;
  }

  async getForumPostsByType(forumType: string, parentId?: number): Promise<ForumPost[]> {
    let query = db
      .select()
      .from(forumPosts)
      .where(eq(forumPosts.forumType, forumType));
    
    if (parentId) {
      query = query.where(eq(forumPosts.parentId, parentId));
    } else {
      query = query.where(isNull(forumPosts.parentId));
    }
    
    return query.orderBy(desc(forumPosts.createdAt));
  }

  async getForumPost(id: number): Promise<ForumPost | undefined> {
    const [post] = await db.select().from(forumPosts).where(eq(forumPosts.id, id));
    return post;
  }

  // Announcement operations
  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [created] = await db.insert(announcements).values(announcement).returning();
    return created;
  }

  async getAnnouncements(targetRole?: string): Promise<Announcement[]> {
    let query = db
      .select()
      .from(announcements)
      .where(
        or(
          isNull(announcements.expiresAt),
          gte(announcements.expiresAt, new Date())
        )
      );
    
    if (targetRole) {
      query = query.where(
        or(
          eq(announcements.targetRole, "all"),
          eq(announcements.targetRole, targetRole)
        )
      );
    }
    
    return query.orderBy([
      desc(announcements.isPinned),
      desc(announcements.createdAt)
    ]);
  }

  // Chat operations
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [created] = await db.insert(chatMessages).values(message).returning();
    return created;
  }

  async getChatMessages(userId1: number, userId2: number, limit: number = 50): Promise<ChatMessage[]> {
    return db
      .select()
      .from(chatMessages)
      .where(
        or(
          and(
            eq(chatMessages.senderId, userId1),
            eq(chatMessages.receiverId, userId2)
          ),
          and(
            eq(chatMessages.senderId, userId2),
            eq(chatMessages.receiverId, userId1)
          )
        )
      )
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }

  async markChatMessagesAsRead(receiverId: number, senderId: number): Promise<boolean> {
    const result = await db
      .update(chatMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(chatMessages.receiverId, receiverId),
          eq(chatMessages.senderId, senderId),
          eq(chatMessages.isRead, false)
        )
      );
    
    return result.count > 0;
  }

  // Accessibility operations
  async getAccessibilitySettings(userId: number): Promise<AccessibilitySettings | undefined> {
    const [settings] = await db.select().from(accessibilitySettings).where(eq(accessibilitySettings.userId, userId));
    return settings;
  }

  async updateAccessibilitySettings(settings: InsertAccessibilitySettings): Promise<AccessibilitySettings> {
    const { userId } = settings;
    const existing = await this.getAccessibilitySettings(userId);
    
    if (existing) {
      const [updated] = await db
        .update(accessibilitySettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(accessibilitySettings.userId, userId))
        .returning();
      
      return updated;
    } else {
      const [created] = await db
        .insert(accessibilitySettings)
        .values(settings)
        .returning();
      
      return created;
    }
  }

  // Challenge operations
  async getAllChallenges(): Promise<Challenge[]> {
    try {
      const results = await db.select().from(challenges)
        .leftJoin(users, eq(challenges.creatorId, users.id))
        .orderBy(desc(challenges.createdAt));
      
      return results.map(row => ({
        ...row.challenges,
        creator: row.users ? {
          id: row.users.id,
          name: row.users.name,
          profileImage: row.users.profileImage,
          role: row.users.role
        } : undefined
      }));
    } catch (error) {
      console.error("Error fetching challenges:", error);
      return [];
    }
  }

  async getChallenge(id: number): Promise<Challenge | undefined> {
    try {
      const [result] = await db.select().from(challenges)
        .where(eq(challenges.id, id))
        .leftJoin(users, eq(challenges.creatorId, users.id));
      
      if (!result) return undefined;
      
      return {
        ...result.challenges,
        creator: result.users ? {
          id: result.users.id,
          name: result.users.name,
          profileImage: result.users.profileImage,
          role: result.users.role
        } : undefined
      };
    } catch (error) {
      console.error(`Error fetching challenge ${id}:`, error);
      return undefined;
    }
  }

  async getUserChallenges(userId: number): Promise<Challenge[]> {
    try {
      // Get challenges created by the user
      const createdChallenges = await db.select().from(challenges)
        .where(eq(challenges.creatorId, userId))
        .orderBy(desc(challenges.createdAt));
      
      // Get challenges participated in by the user
      const participations = await db.select({
        challenge: challenges,
      }).from(challengeParticipations)
        .leftJoin(challenges, eq(challengeParticipations.challengeId, challenges.id))
        .where(eq(challengeParticipations.userId, userId))
        .orderBy(desc(challenges.createdAt));
      
      // Combine the lists and remove duplicates
      const combinedChallenges = [
        ...createdChallenges,
        ...participations.map(row => row.challenge)
      ];
      
      // Remove duplicates by challenge ID
      const uniqueChallenges = Array.from(
        new Map(combinedChallenges.map(challenge => [challenge.id, challenge]))
      ).map(([_, challenge]) => challenge);
      
      return uniqueChallenges;
    } catch (error) {
      console.error(`Error fetching user challenges for user ${userId}:`, error);
      return [];
    }
  }

  async createChallenge(data: InsertChallenge): Promise<Challenge> {
    try {
      const [challenge] = await db.insert(challenges).values({
        ...data,
        createdAt: new Date(),
        currentParticipants: 0
      }).returning();
      return challenge;
    } catch (error) {
      console.error("Error creating challenge:", error);
      throw error;
    }
  }

  async getChallengeParticipants(challengeId: number): Promise<ChallengeParticipation[]> {
    try {
      const results = await db.select({
        participation: challengeParticipations,
        user: users
      }).from(challengeParticipations)
        .where(eq(challengeParticipations.challengeId, challengeId))
        .leftJoin(users, eq(challengeParticipations.userId, users.id))
        .orderBy(desc(challengeParticipations.joinedAt));
      
      return results.map(row => ({
        ...row.participation,
        user: row.user ? {
          id: row.user.id,
          name: row.user.name,
          profileImage: row.user.profileImage,
          role: row.user.role
        } : undefined
      }));
    } catch (error) {
      console.error(`Error fetching participants for challenge ${challengeId}:`, error);
      return [];
    }
  }

  async getChallengeParticipation(challengeId: number, userId: number): Promise<ChallengeParticipation | undefined> {
    try {
      const [participation] = await db.select().from(challengeParticipations)
        .where(and(
          eq(challengeParticipations.challengeId, challengeId),
          eq(challengeParticipations.userId, userId)
        ));
      
      return participation;
    } catch (error) {
      console.error(`Error fetching participation for challenge ${challengeId}, user ${userId}:`, error);
      return undefined;
    }
  }

  async joinChallenge(challengeId: number, userId: number): Promise<ChallengeParticipation> {
    try {
      const [participation] = await db.insert(challengeParticipations).values({
        challengeId,
        userId,
        joinedAt: new Date(),
        status: "joined"
      }).returning();
      
      return participation;
    } catch (error) {
      console.error(`Error joining challenge ${challengeId} for user ${userId}:`, error);
      throw error;
    }
  }

  async updateChallengeParticipation(id: number, data: Partial<ChallengeParticipation>): Promise<ChallengeParticipation> {
    try {
      const [updatedParticipation] = await db.update(challengeParticipations)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(challengeParticipations.id, id))
        .returning();
      
      return updatedParticipation;
    } catch (error) {
      console.error(`Error updating participation ${id}:`, error);
      throw error;
    }
  }

  async updateChallengeParticipants(challengeId: number, count: number): Promise<Challenge> {
    try {
      const [updatedChallenge] = await db.update(challenges)
        .set({ 
          currentParticipants: count,
          updatedAt: new Date()
        })
        .where(eq(challenges.id, challengeId))
        .returning();
      
      return updatedChallenge;
    } catch (error) {
      console.error(`Error updating participant count for challenge ${challengeId}:`, error);
      throw error;
    }
  }

  async getChallengeComments(challengeId: number): Promise<ChallengeComment[]> {
    try {
      const results = await db.select({
        comment: challengeComments,
        user: users
      }).from(challengeComments)
        .where(eq(challengeComments.challengeId, challengeId))
        .leftJoin(users, eq(challengeComments.userId, users.id))
        .orderBy(asc(challengeComments.createdAt));
      
      return results.map(row => ({
        ...row.comment,
        user: row.user ? {
          id: row.user.id,
          name: row.user.name,
          profileImage: row.user.profileImage,
          role: row.user.role
        } : undefined
      }));
    } catch (error) {
      console.error(`Error fetching comments for challenge ${challengeId}:`, error);
      return [];
    }
  }

  async createChallengeComment(data: InsertChallengeComment): Promise<ChallengeComment> {
    try {
      const [comment] = await db.insert(challengeComments).values({
        ...data,
        createdAt: new Date()
      }).returning();
      
      return comment;
    } catch (error) {
      console.error("Error creating challenge comment:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
