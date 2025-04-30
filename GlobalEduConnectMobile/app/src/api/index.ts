import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure the base URL of the API
const API_URL = process.env.API_URL || 'http://localhost:3000/api';

// Create an Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle token expiration
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      // You could also trigger a navigation to the login screen here
    }
    
    return Promise.reject(error.response?.data || error);
  }
);

// Auth API
export const login = async (credentials: { email: string; password: string }) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const register = async (userData: { 
  email: string; 
  password: string; 
  name?: string; 
  role: string 
}) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const logout = async () => {
  await AsyncStorage.removeItem('authToken');
  await AsyncStorage.removeItem('user');
  return { success: true };
};

export const getUserProfile = async () => {
  const response = await api.get('/user/profile');
  return response.data;
};

export const updateUserProfile = async (profileData: any) => {
  const response = await api.patch('/user/profile', profileData);
  return response.data;
};

// Classes API
export const getClasses = async (params?: {
  search?: string;
  subject?: string;
  language?: string;
  difficulty?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get('/classes', { params });
  return response.data;
};

export const getClassById = async (classId: number) => {
  const response = await api.get(`/classes/${classId}`);
  return response.data;
};

export const joinClass = async (classId: number) => {
  const response = await api.post(`/classes/${classId}/enroll`);
  return response.data;
};

export const getEnrolledClasses = async () => {
  const response = await api.get('/user/enrollments');
  return response.data;
};

export const getTeachingClasses = async () => {
  const response = await api.get('/user/teaching');
  return response.data;
};

export const rateClass = async (classId: number, data: { rating: number; review: string }) => {
  const response = await api.post(`/classes/${classId}/ratings`, data);
  return response.data;
};

// Messages API
export const getMessages = async (classId: number) => {
  const response = await api.get(`/classes/${classId}/messages`);
  return response.data;
};

export const sendMessage = async (classId: number, content: string) => {
  const response = await api.post(`/classes/${classId}/messages`, { content });
  return response.data;
};

export const markMessagesAsRead = async (classId: number) => {
  const response = await api.post(`/classes/${classId}/messages/read`);
  return response.data;
};

// Search API
export const searchClasses = async (query: string) => {
  const response = await api.get('/search/classes', { params: { query } });
  return response.data;
};

export const searchTeachers = async (query: string) => {
  const response = await api.get('/search/teachers', { params: { query } });
  return response.data;
};

// Favorites API
export const getFavoriteTeachers = async () => {
  const response = await api.get('/user/favorites/teachers');
  return response.data;
};

export const addFavoriteTeacher = async (teacherId: number) => {
  const response = await api.post(`/user/favorites/teachers/${teacherId}`);
  return response.data;
};

export const removeFavoriteTeacher = async (teacherId: number) => {
  const response = await api.delete(`/user/favorites/teachers/${teacherId}`);
  return response.data;
};

// Challenges API
export const getChallenges = async () => {
  const response = await api.get('/challenges');
  return response.data;
};

export const getChallengeById = async (challengeId: number) => {
  const response = await api.get(`/challenges/${challengeId}`);
  return response.data;
};

export const joinChallenge = async (challengeId: number) => {
  const response = await api.post(`/challenges/${challengeId}/join`);
  return response.data;
};

export const updateChallengeProgress = async (
  challengeId: number, 
  progress: { completed: boolean; progress: number }
) => {
  const response = await api.patch(`/challenges/${challengeId}/progress`, progress);
  return response.data;
};

// Donations API
export const getDonationOptions = async (userId: number) => {
  const response = await api.get(`/donations/options/${userId}`);
  return response.data;
};

export const makeDonation = async (
  userId: number, 
  data: { amount: number; message?: string }
) => {
  const response = await api.post(`/donations/${userId}`, data);
  return response.data;
};

// Report API
export const reportUser = async (
  userId: number, 
  data: { reason: string; details: string }
) => {
  const response = await api.post(`/reports/user/${userId}`, data);
  return response.data;
};

export const reportClass = async (
  classId: number, 
  data: { reason: string; details: string }
) => {
  const response = await api.post(`/reports/class/${classId}`, data);
  return response.data;
};

export default api;