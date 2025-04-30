import { pgTable, text, serial, integer, boolean, timestamp, json, primaryKey, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User table with role-based access
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["student", "teacher", "admin"] }).notNull().default("student"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  preferredLanguage: text("preferred_language").default("en"),
  timezone: text("timezone").default("UTC"),
  status: text("status", { enum: ["active", "pending", "blocked"] }).default("active"),
  privacySettings: text("privacy_settings", { enum: ["public", "private", "semi-public"] }).default("public"),
  lastLoginAt: timestamp("last_login_at"),
  country: text("country"),
  blockedFromCountries: json("blocked_from_countries").$type<string[]>().default([]),
});

export const usersRelations = relations(users, ({ many }) => ({
  studentProfiles: many(studentProfiles),
  teacherProfiles: many(teacherProfiles),
  donationsReceived: many(donations, { relationName: "receiverDonations" }),
  donationsMade: many(donations, { relationName: "senderDonations" }),
  classesEnrolled: many(classEnrollments),
  classesCreated: many(classes, { relationName: "createdClasses" }),
  teacherRatings: many(teacherRatings),
  classRatings: many(classRatings),
  reports: many(reports, { relationName: "reportAuthor" }),
  reportedItems: many(reports, { relationName: "reportedUser" }),
  studentForums: many(forumPosts, { relationName: "studentForumAuthor" }),
  teacherForums: many(forumPosts, { relationName: "teacherForumAuthor" }),
  favorites: many(favorites),
  challengesCreated: many(challenges, { relationName: "createdChallenges" }),
  challengeParticipations: many(challengeParticipations),
  challengeComments: many(challengeComments),
}));

// Student profile additional information
export const studentProfiles = pgTable("student_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subjects: text("subjects").notNull(),
  interests: text("interests").notNull(),
  gradeLevel: text("grade_level"),
  bio: text("bio"),
});

export const studentProfilesRelations = relations(studentProfiles, ({ one }) => ({
  user: one(users, { fields: [studentProfiles.userId], references: [users.id] }),
}));

// Teacher profile additional information
export const teacherProfiles = pgTable("teacher_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expertise: text("expertise").notNull(),
  level: text("level", { enum: ["beginner", "intermediate", "advanced", "expert"] }).notNull(),
  bio: text("bio").notNull(),
  demoVideoUrl: text("demo_video_url"),
  avgRating: doublePrecision("avg_rating").default(0),
  totalRatings: integer("total_ratings").default(0),
  isAnonymous: boolean("is_anonymous").default(false),
  donationEnabled: boolean("donation_enabled").default(true),
});

export const teacherProfilesRelations = relations(teacherProfiles, ({ one, many }) => ({
  user: one(users, { fields: [teacherProfiles.userId], references: [users.id] }),
  ratings: many(teacherRatings),
}));

// Classes (live and pre-recorded)
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  teacherId: integer("teacher_id").notNull().references(() => users.id),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  isLive: boolean("is_live").default(true),
  isRecorded: boolean("is_recorded").default(false),
  recordingUrl: text("recording_url"),
  category: text("category").notNull(),
  tags: json("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  maxAttendees: integer("max_attendees"),
  language: text("language").default("en"),
  thumbnailUrl: text("thumbnail_url"),
  avgRating: doublePrecision("avg_rating").default(0),
  totalRatings: integer("total_ratings").default(0),
});

export const classesRelations = relations(classes, ({ one, many }) => ({
  teacher: one(users, { fields: [classes.teacherId], references: [users.id], relationName: "createdClasses" }),
  enrollments: many(classEnrollments),
  ratings: many(classRatings),
}));

// Student enrollments in classes
export const classEnrollments = pgTable("class_enrollments", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  studentId: integer("student_id").notNull().references(() => users.id),
  enrollmentDate: timestamp("enrollment_date").defaultNow().notNull(),
  attendanceStatus: text("attendance_status", { enum: ["registered", "attended", "no-show"] }).default("registered"),
  completionStatus: text("completion_status", { enum: ["not-started", "in-progress", "completed"] }).default("not-started"),
});

export const classEnrollmentsRelations = relations(classEnrollments, ({ one }) => ({
  class: one(classes, { fields: [classEnrollments.classId], references: [classes.id] }),
  student: one(users, { fields: [classEnrollments.studentId], references: [users.id] }),
}));

// Teacher ratings
export const teacherRatings = pgTable("teacher_ratings", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  studentId: integer("student_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teacherRatingsRelations = relations(teacherRatings, ({ one }) => ({
  teacher: one(teacherProfiles, { fields: [teacherRatings.teacherId], references: [teacherProfiles.userId] }),
  student: one(users, { fields: [teacherRatings.studentId], references: [users.id] }),
}));

// Class ratings
export const classRatings = pgTable("class_ratings", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  studentId: integer("student_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const classRatingsRelations = relations(classRatings, ({ one }) => ({
  class: one(classes, { fields: [classRatings.classId], references: [classes.id] }),
  student: one(users, { fields: [classRatings.studentId], references: [users.id] }),
}));

// Favorite teachers
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  teacherId: integer("teacher_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const favoritesRelations = relations(favorites, ({ one }) => ({
  student: one(users, { fields: [favorites.studentId], references: [users.id] }),
  teacher: one(users, { fields: [favorites.teacherId], references: [users.id] }),
}));

// Donations (Buy Me a Coffee)
export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  amount: doublePrecision("amount").notNull(),
  currency: text("currency").default("USD").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isAnonymous: boolean("is_anonymous").default(false),
});

export const donationsRelations = relations(donations, ({ one }) => ({
  sender: one(users, { fields: [donations.senderId], references: [users.id], relationName: "donationsMade" }),
  receiver: one(users, { fields: [donations.receiverId], references: [users.id], relationName: "donationsReceived" }),
}));

// Reports (for users, classes, etc.)
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").notNull().references(() => users.id),
  reportedUserId: integer("reported_user_id").references(() => users.id),
  reportedClassId: integer("reported_class_id").references(() => classes.id),
  reportType: text("report_type", { enum: ["abuse", "inappropriate-content", "other"] }).notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: ["pending", "reviewed", "resolved", "dismissed"] }).default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  adminNotes: text("admin_notes"),
});

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, { fields: [reports.reporterId], references: [users.id], relationName: "reportAuthor" }),
  reportedUser: one(users, { fields: [reports.reportedUserId], references: [users.id], relationName: "reportedUser" }),
  reportedClass: one(classes, { fields: [reports.reportedClassId], references: [classes.id] }),
  reviewer: one(users, { fields: [reports.reviewedBy], references: [users.id] }),
}));

// Forum posts for community (separate for students and teachers)
export const forumPosts = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull().references(() => users.id),
  forumType: text("forum_type", { enum: ["student", "teacher"] }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  parentId: integer("parent_id"),
});

export const forumPostsRelations = relations(forumPosts, ({ one, many }) => {
  return {
    author: one(users, { fields: [forumPosts.authorId], references: [users.id] }),
    parent: one(forumPosts, { fields: [forumPosts.parentId], references: [forumPosts.id] }),
    replies: many(forumPosts, { relationName: "replies" })
  };
});

// Announcements (admin-wide)
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  targetRole: text("target_role", { enum: ["all", "student", "teacher"] }).default("all"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  isPinned: boolean("is_pinned").default(false),
});

export const announcementsRelations = relations(announcements, ({ one }) => ({
  admin: one(users, { fields: [announcements.adminId], references: [users.id] }),
}));

// Chat messages
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isRead: boolean("is_read").default(false),
});

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  sender: one(users, { fields: [chatMessages.senderId], references: [users.id] }),
  receiver: one(users, { fields: [chatMessages.receiverId], references: [users.id] }),
}));

// Settings for accessibility options
export const accessibilitySettings = pgTable("accessibility_settings", {
  userId: integer("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  increasedFontSize: boolean("increased_font_size").default(false),
  highContrast: boolean("high_contrast").default(false),
  colorBlindMode: boolean("color_blind_mode").default(false),
  reducedMotion: boolean("reduced_motion").default(false),
  screenReaderOptimized: boolean("screen_reader_optimized").default(false),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accessibilitySettingsRelations = relations(accessibilitySettings, ({ one }) => ({
  user: one(users, { fields: [accessibilitySettings.userId], references: [users.id] }),
}));

// Export all insert schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, updatedAt: true, lastLoginAt: true, blockedFromCountries: true });

export const insertStudentProfileSchema = createInsertSchema(studentProfiles)
  .omit({ id: true });

export const insertTeacherProfileSchema = createInsertSchema(teacherProfiles)
  .omit({ id: true, avgRating: true, totalRatings: true });

export const insertClassSchema = createInsertSchema(classes)
  .omit({ id: true, createdAt: true, updatedAt: true, avgRating: true, totalRatings: true });

export const insertClassEnrollmentSchema = createInsertSchema(classEnrollments)
  .omit({ id: true, enrollmentDate: true });

export const insertTeacherRatingSchema = createInsertSchema(teacherRatings)
  .omit({ id: true, createdAt: true });

export const insertClassRatingSchema = createInsertSchema(classRatings)
  .omit({ id: true, createdAt: true });

export const insertFavoriteSchema = createInsertSchema(favorites)
  .omit({ id: true, createdAt: true });

export const insertDonationSchema = createInsertSchema(donations)
  .omit({ id: true, createdAt: true });

export const insertReportSchema = createInsertSchema(reports)
  .omit({ id: true, createdAt: true, reviewedAt: true, status: true });

export const insertForumPostSchema = createInsertSchema(forumPosts)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertAnnouncementSchema = createInsertSchema(announcements)
  .omit({ id: true, createdAt: true });

export const insertChatMessageSchema = createInsertSchema(chatMessages)
  .omit({ id: true, createdAt: true, isRead: true });

export const insertAccessibilitySettingsSchema = createInsertSchema(accessibilitySettings)
  .omit({ updatedAt: true });

// Export TypeScript types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type StudentProfile = typeof studentProfiles.$inferSelect;
export type InsertStudentProfile = z.infer<typeof insertStudentProfileSchema>;

export type TeacherProfile = typeof teacherProfiles.$inferSelect;
export type InsertTeacherProfile = z.infer<typeof insertTeacherProfileSchema>;

export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;

export type ClassEnrollment = typeof classEnrollments.$inferSelect;
export type InsertClassEnrollment = z.infer<typeof insertClassEnrollmentSchema>;

export type TeacherRating = typeof teacherRatings.$inferSelect;
export type InsertTeacherRating = z.infer<typeof insertTeacherRatingSchema>;

export type ClassRating = typeof classRatings.$inferSelect;
export type InsertClassRating = z.infer<typeof insertClassRatingSchema>;

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;

export type Donation = typeof donations.$inferSelect;
export type InsertDonation = z.infer<typeof insertDonationSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type AccessibilitySettings = typeof accessibilitySettings.$inferSelect;
export type InsertAccessibilitySettings = z.infer<typeof insertAccessibilitySettingsSchema>;

// Challenge Table
export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  difficulty: text("difficulty", { enum: ["beginner", "intermediate", "advanced", "expert"] }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  maxParticipants: integer("max_participants"),
  currentParticipants: integer("current_participants").default(0).notNull(),
  tags: json("tags").$type<string[]>().default([]),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  creator: one(users, { fields: [challenges.creatorId], references: [users.id] }),
  participations: many(challengeParticipations),
  comments: many(challengeComments),
}));

// Challenge Participation Table
export const challengeParticipations = pgTable("challenge_participations", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  status: text("status", { enum: ["joined", "in-progress", "completed", "dropped"] }).default("joined"),
  completedAt: timestamp("completed_at"),
  submissionUrl: text("submission_url"),
  submissionText: text("submission_text"),
  publiclyShared: boolean("publicly_shared").default(true),
  shareUrls: json("share_urls").$type<{
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    other?: string;
  }>(),
});

export const challengeParticipationsRelations = relations(challengeParticipations, ({ one, many }) => ({
  challenge: one(challenges, { fields: [challengeParticipations.challengeId], references: [challenges.id] }),
  user: one(users, { fields: [challengeParticipations.userId], references: [users.id] }),
  comments: many(challengeComments, { relationName: "participationComments" }),
}));

// Challenge Comments Table
export const challengeComments = pgTable("challenge_comments", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id),
  participationId: integer("participation_id").references(() => challengeParticipations.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isPublic: boolean("is_public").default(true),
});

export const challengeCommentsRelations = relations(challengeComments, ({ one }) => ({
  challenge: one(challenges, { fields: [challengeComments.challengeId], references: [challenges.id] }),
  user: one(users, { fields: [challengeComments.userId], references: [users.id] }),
  participation: one(challengeParticipations, { 
    fields: [challengeComments.participationId], 
    references: [challengeParticipations.id],
    relationName: "participationComments" 
  }),
}));

// Export insert schemas for challenges
export const insertChallengeSchema = createInsertSchema(challenges)
  .omit({ id: true, createdAt: true, updatedAt: true, currentParticipants: true });

export const insertChallengeParticipationSchema = createInsertSchema(challengeParticipations)
  .omit({ id: true, joinedAt: true, completedAt: true });

export const insertChallengeCommentSchema = createInsertSchema(challengeComments)
  .omit({ id: true, createdAt: true });

// Export types for challenges
export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;

export type ChallengeParticipation = typeof challengeParticipations.$inferSelect;
export type InsertChallengeParticipation = z.infer<typeof insertChallengeParticipationSchema>;

export type ChallengeComment = typeof challengeComments.$inferSelect;
export type InsertChallengeComment = z.infer<typeof insertChallengeCommentSchema>;
