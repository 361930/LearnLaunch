import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login, register, getCurrentUser } from '../api';

type User = {
  id: number;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  profilePicture?: string;
  bio?: string;
  createdAt: string;
  isDemo?: boolean;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    role: string;
    name?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        
        // Try to get token from storage
        const token = await AsyncStorage.getItem('auth_token');
        
        if (token) {
          // Token exists, try to get current user
          const userData = await getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        // Clear any invalid auth data
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('user_data');
        setError('Session expired. Please login again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const loginUser = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { token, user } = await login(email, password);
      
      // Store token and user data
      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
      
      setUser(user);
    } catch (error: any) {
      console.error('Login error:', error);
      setError(
        error.response?.data?.message || 
        'Login failed. Please check your credentials and try again.'
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (userData: {
    email: string;
    password: string;
    role: string;
    name?: string;
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { token, user } = await register(userData);
      
      // Store token and user data
      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
      
      setUser(user);
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(
        error.response?.data?.message || 
        'Registration failed. Please try again later.'
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logoutUser = async () => {
    try {
      setIsLoading(true);
      
      // Clear authentication data
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
      
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to logout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login: loginUser,
        register: registerUser,
        logout: logoutUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;