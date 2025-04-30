import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login, register, getUserProfile } from '../api';
import SecureStorage from '../utils/secureStorage';
import { useToast } from './ToastContext';
import NetInfo from '@react-native-community/netinfo';

// Known secure storage keys for auth-related data
const AUTH_KEYS = {
  TOKEN: 'auth_token',
  USER: 'auth_user',
  REFRESH_TOKEN: 'auth_refresh_token',
};

interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  profileImage?: string;
  username?: string;
  [key: string]: any; // Allow for additional properties
}

interface AuthContextProps {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUserData: (userData: Partial<User>) => void;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
  isOffline: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  name?: string;
  role: string;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateUserData: () => {},
  refreshProfile: async () => {},
  clearError: () => {},
  isOffline: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const { showToast } = useToast();

  // Check network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Load user data from secure storage on mount
  useEffect(() => {
    const loadStoredUser = async () => {
      setIsLoading(true);
      try {
        const storedToken = await SecureStorage.getItem(AUTH_KEYS.TOKEN);
        const storedUser = await SecureStorage.getItem(AUTH_KEYS.USER);

        if (storedToken && storedUser) {
          setUser(JSON.parse(storedUser));
          
          // Refresh user data in background if online
          if (!isOffline) {
            refreshProfile().catch(err => {
              console.error('Background profile refresh failed:', err);
            });
          }
        }
      } catch (err) {
        console.error('Error loading stored auth data:', err);
        setError(err instanceof Error ? err : new Error('Failed to load auth data'));
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredUser();
  }, []);

  // Handle user login
  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (isOffline) {
        throw new Error('Cannot login while offline. Please check your connection.');
      }

      const response = await login({ email, password });
      
      if (!response || !response.token) {
        throw new Error('Invalid response from server');
      }

      // Store token securely
      await SecureStorage.setItem(AUTH_KEYS.TOKEN, response.token, { requireAuthentication: true });
      
      // Store user data
      await SecureStorage.setItem(AUTH_KEYS.USER, JSON.stringify(response.user));
      
      // Store refresh token if available
      if (response.refreshToken) {
        await SecureStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, response.refreshToken, { requireAuthentication: true });
      }

      setUser(response.user);
      showToast('Login successful', 'success');
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(new Error(errorMessage));
      showToast(errorMessage, 'error');
      throw err; // Re-throw to allow proper handling in UI
    } finally {
      setIsLoading(false);
    }
  };

  // Handle user registration
  const handleRegister = async (userData: RegisterData) => {
    setIsLoading(true);
    setError(null);

    try {
      if (isOffline) {
        throw new Error('Cannot register while offline. Please check your connection.');
      }

      const response = await register(userData);
      
      if (!response || !response.token) {
        throw new Error('Invalid response from server');
      }

      // Store token securely
      await SecureStorage.setItem(AUTH_KEYS.TOKEN, response.token, { requireAuthentication: true });
      
      // Store user data
      await SecureStorage.setItem(AUTH_KEYS.USER, JSON.stringify(response.user));
      
      // Store refresh token if available
      if (response.refreshToken) {
        await SecureStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, response.refreshToken, { requireAuthentication: true });
      }

      setUser(response.user);
      showToast('Registration successful', 'success');
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(new Error(errorMessage));
      showToast(errorMessage, 'error');
      throw err; // Re-throw to allow proper handling in UI
    } finally {
      setIsLoading(false);
    }
  };

  // Handle user logout
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      // Clear secure storage
      await SecureStorage.clear(Object.values(AUTH_KEYS));
      
      // Clear state
      setUser(null);
      showToast('Logged out successfully', 'success');
    } catch (err) {
      console.error('Logout error:', err);
      showToast('Logout failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Update user data in state and storage
  const updateUserData = useCallback((userData: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      
      const updatedUser = { ...prevUser, ...userData };
      
      // Update stored user data
      SecureStorage.setItem(AUTH_KEYS.USER, JSON.stringify(updatedUser))
        .catch(err => console.error('Error saving updated user data:', err));
      
      return updatedUser;
    });
  }, []);

  // Refresh user profile from API
  const refreshProfile = async () => {
    if (!user || isOffline) return;

    try {
      const profileData = await getUserProfile();
      updateUserData(profileData);
    } catch (err) {
      console.error('Profile refresh error:', err);
      // Don't show toast for background refreshes
    }
  };

  // Clear authentication errors
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        error,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        updateUserData,
        refreshProfile,
        clearError,
        isOffline,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;