/**
 * Application-wide constants
 */

// API configuration
export const API_URL = 'http://localhost:3001/api';
export const SOCKET_URL = 'http://localhost:3001';

// Authentication constants
export const AUTH_TOKEN_KEY = 'auth_token';
export const USER_DATA_KEY = 'user_data';
export const REFRESH_TOKEN_KEY = 'refresh_token';

// App theme constants
export const THEME_PREFERENCE_KEY = 'theme_preference';
export const ACCESSIBILITY_SETTINGS_KEY = 'accessibility_settings';

// Timeouts and retry strategy
export const API_TIMEOUT = 30000; // 30 seconds
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAY = 1000; // 1 second

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_LIST_LIMIT = 20;

// Media constants
export const AVATAR_SIZE = {
  SMALL: 30,
  MEDIUM: 50,
  LARGE: 80,
};

// Image upload limits
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Input validation
export const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRES_LOWERCASE: true,
    REQUIRES_UPPERCASE: true,
    REQUIRES_NUMBER: true,
    REQUIRES_SPECIAL: true,
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    ALLOWED_CHARS: /^[a-zA-Z0-9._-]+$/,
  },
  EMAIL: {
    MAX_LENGTH: 100,
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
};

// User roles
export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
}

// Class difficulty levels
export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

// Enrollment status options
export enum EnrollmentStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DROPPED = 'dropped',
}

// Languages supported in the app
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ru', name: 'Russian' },
  { code: 'pt', name: 'Portuguese' },
];

// Common academic subjects
export const SUBJECT_CATEGORIES = [
  'Mathematics',
  'Science',
  'Computer Science',
  'Languages',
  'Literature',
  'History',
  'Geography',
  'Art',
  'Music',
  'Physical Education',
  'Economics',
  'Business',
  'Philosophy',
  'Psychology',
  'Sociology',
  'Political Science',
  'Engineering',
  'Medicine',
  'Law',
  'Environmental Science',
];

// Error messages
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your internet connection and try again.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  SERVER: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_FAILED: 'Please check your input and try again.',
  DEFAULT: 'Something went wrong. Please try again.',
};

// Animation durations
export const ANIMATION = {
  SHORT: 200,
  MEDIUM: 400,
  LONG: 800,
};