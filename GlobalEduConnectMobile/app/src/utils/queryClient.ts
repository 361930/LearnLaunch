import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { API_URL } from '../config/constants';
import secureStorage from './secureStorage';

// Network state tracking
let isConnected: boolean = true;

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create AsyncStorage persister for offline support
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'gec_query_cache',
  throttleTime: 1000, // Save cache at most once per second
  serialize: data => JSON.stringify(data),
  deserialize: data => JSON.parse(data),
});

// Query error handler
const handleQueryError = (error: unknown) => {
  // Format error message
  let message = 'An unexpected error occurred';
  
  // Handle Axios errors
  if (error instanceof AxiosError) {
    // Network errors
    if (error.code === 'ECONNABORTED') {
      message = 'Request timed out. Please try again.';
    } else if (!error.response) {
      message = 'Network error. Please check your connection.';
    } else {
      // API errors with responses
      const status = error.response.status;
      
      if (status === 401) {
        message = 'Your session has expired. Please log in again.';
      } else if (status === 403) {
        message = 'You do not have permission to perform this action.';
      } else if (status === 404) {
        message = 'The requested resource was not found.';
      } else if (status === 429) {
        message = 'Too many requests. Please try again later.';
      } else if (status >= 500) {
        message = 'Server error. Please try again later.';
      } else if (error.response.data?.error) {
        // Use server-provided error if available
        message = error.response.data.error;
      }
    }
  }
  
  console.error(`Query error: ${message}`, error);
  
  // Return formatted error
  return new Error(message);
};

// Mutation error handler
const handleMutationError = (error: unknown) => {
  // This uses the same logic as query errors for consistency
  return handleQueryError(error);
};

// Create query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 401, 403, 404
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        
        // Only retry a few times for other errors
        return failureCount < 2 && isConnected;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false,
      onError: handleMutationError,
    },
  },
  queryCache: new QueryCache({
    onError: handleQueryError,
  }),
  mutationCache: new MutationCache({
    onError: handleMutationError,
  }),
});

// Initialize network state listener
export const initializeNetworkMonitoring = () => {
  // Subscribe to network state changes
  const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const newConnectionState = Boolean(state.isConnected);
    
    // Only trigger change if state actually changed
    if (isConnected !== newConnectionState) {
      isConnected = newConnectionState;
      console.log(`Network connectivity changed: ${isConnected ? 'online' : 'offline'}`);
      
      // Refetch queries when coming back online
      if (isConnected) {
        queryClient.invalidateQueries();
      }
    }
  });
  
  return unsubscribe;
};

// Axios request interceptor to add auth token
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await secureStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Axios response interceptor for common error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle token expiration (401)
    if (error.response?.status === 401) {
      try {
        // Clear user session if token is rejected
        await secureStorage.removeItem('auth_token');
        await secureStorage.removeItem('user_data');
        // Clearing the user will trigger a redirection to login in the Auth context
      } catch (storageError) {
        console.error('Error clearing auth data:', storageError);
      }
    }
    
    return Promise.reject(error);
  }
);

// API request function
export const apiRequest = async <T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await axiosInstance({
      method,
      url: endpoint,
      data: ['POST', 'PUT', 'PATCH'].includes(method) ? data : undefined,
      params: method === 'GET' ? data : undefined,
      ...config,
    });
    
    return response.data;
  } catch (error) {
    throw handleQueryError(error);
  }
};

// Default fetch function for react-query
export const defaultFetcher = async <T = any>({ queryKey }: { queryKey: string[] }): Promise<T> => {
  const [endpoint, params] = queryKey;
  return apiRequest<T>('GET', endpoint, params);
};

// Optimistic update helper
export const optimisticUpdate = <T>(
  queryKey: string[],
  updateFn: (oldData: T | undefined) => T
) => {
  queryClient.setQueryData<T>(queryKey, oldData => updateFn(oldData));
};

export { asyncStoragePersister };
export default { queryClient, apiRequest, defaultFetcher, optimisticUpdate, initializeNetworkMonitoring };