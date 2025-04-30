// User Types
export interface User {
  id: number;
  email: string;
  username: string;
  name: string;
  role: "student" | "teacher" | "admin";
  status: "active" | "pending" | "blocked";
  profileImage?: string;
  preferredLanguage?: string;
  timezone?: string;
  privacySettings?: "public" | "semi-public" | "private";
  bio?: string;
  blockedFromCountries?: string[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface StudentProfile {
  id: number;
  userId: number;
  subjects: string;
  interests: string;
  gradeLevel?: string;
  bio?: string;
}

export interface TeacherProfile {
  id: number;
  userId: number;
  expertise: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  bio: string;
  avgRating: number;
  totalRatings: number;
  demoVideoUrl?: string;
  isAnonymous: boolean;
  donationEnabled: boolean;
}

// Class Types
export interface Class {
  id: number;
  teacherId: number;
  title: string;
  description: string;
  category: string;
  startTime?: string;
  endTime?: string;
  isLive: boolean;
  maxAttendees?: number;
  price?: number;
  currency?: string;
  language: string;
  level: string;
  thumbnail?: string;
  avgRating: number;
  totalRatings: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClassEnrollment {
  id: number;
  classId: number;
  studentId: number;
  status: "enrolled" | "completed" | "cancelled";
  enrollmentDate: string;
  progress?: number;
  lastAccessedAt?: string;
  class?: Class;
}

// Rating Types
export interface Rating {
  id: number;
  studentId: number;
  rating: number;
  review?: string;
  createdAt: string;
}

export interface TeacherRating extends Rating {
  teacherId: number;
}

export interface ClassRating extends Rating {
  classId: number;
}

// Forum Types
export interface ForumPost {
  id: number;
  authorId: number;
  forumType: "student" | "teacher";
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  parentId?: number;
  replies?: ForumPost[];
  author?: User;
}

// Announcement Types
export interface Announcement {
  id: number;
  adminId: number;
  title: string;
  content: string;
  targetRole: "all" | "student" | "teacher";
  createdAt: string;
  expiresAt?: string;
  isPinned: boolean;
  admin?: User;
}

// Chat Types
export interface ChatMessage {
  id: number;
  senderId: number;
  receiverId: number;
  message: string;
  createdAt: string;
  isRead: boolean;
  sender?: User;
  receiver?: User;
}

// Report Types
export interface Report {
  id: number;
  reporterId: number;
  reportedUserId?: number;
  reportedClassId?: number;
  reportType: "abuse" | "inappropriate-content" | "other";
  description: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: number;
  adminNotes?: string;
}

// Donation Types
export interface Donation {
  id: number;
  senderId: number;
  receiverId: number;
  amount: number;
  currency: string;
  message?: string;
  createdAt: string;
  isAnonymous: boolean;
}

// Accessibility Settings
export interface AccessibilitySettings {
  userId: number;
  increasedFontSize: boolean;
  highContrast: boolean;
  colorBlindMode: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  updatedAt: string;
}

// Challenge Types
export interface Challenge {
  id: number;
  creatorId: number;
  title: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  startDate: string;
  endDate: string;
  isActive: boolean;
  maxParticipants?: number;
  currentParticipants: number;
  tags: string[];
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  creator?: User;
}

export interface ChallengeParticipation {
  id: number;
  challengeId: number;
  userId: number;
  joinedAt: string;
  status: "joined" | "in-progress" | "completed" | "dropped";
  completedAt?: string;
  submissionUrl?: string;
  submissionText?: string;
  publiclyShared: boolean;
  shareUrls?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    other?: string;
  };
  challenge?: Challenge;
  user?: User;
}

export interface ChallengeComment {
  id: number;
  challengeId: number;
  userId: number;
  participationId?: number;
  content: string;
  createdAt: string;
  isPublic: boolean;
  user?: User;
}