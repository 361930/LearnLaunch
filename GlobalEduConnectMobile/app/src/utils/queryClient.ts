/**
 * Network-aware QueryClient for GlobalEduConnect
 * 
 * Provides features:
 * - Offline caching and persistence
 * - Automatic retry on reconnection
 * - Network status detection
 * - Optimistic updates
 */

import { useState, useEffect } from 'react';
import { 
  QueryClient, 
  QueryClientProvider, 
  useMutation, 
  useQuery,
  useInfiniteQuery,
  MutationOptions,
  UseMutationOptions,
  UseQueryOptions,
  UseInfiniteQueryOptions
} from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { API_URL } from '../config/constants';
import secureStorage from './secureStorage';

// Default axios instance for API requests
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  async (config) => {
    // Get auth token from secure storage
    const token = await secureStorage.getItem('auth_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle token refresh if needed
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Get refresh token
        const refreshToken = await secureStorage.getItem('refresh_token');
        
        if (refreshToken) {
          // Call token refresh endpoint
          const response = await axiosInstance.post('/auth/refresh', {
            refreshToken,
          });
          
          // Store new tokens
          await secureStorage.setItem('auth_token', response.data.accessToken);
          await secureStorage.setItem('refresh_token', response.data.refreshToken);
          
          // Update authorization header
          originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
          
          // Retry original request
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Create a QueryClient with default settings optimized for mobile use
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2, // Retry failed queries twice
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: Platform.OS === 'web', // Only refetch on focus on web
      refetchOnReconnect: true, // Refetch when reconnecting
      refetchOnMount: true, // Refetch when component mounts
      onError: (error) => {
        console.error('Query error:', error);
      },
    },
    mutations: {
      retry: 1, // Only retry mutations once
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

// Create persister for offline support
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'GEC_QUERY_CACHE',
  throttleTime: 1000, // Throttle writes to storage
  serialize: (data) => JSON.stringify(data),
  deserialize: (cachedString) => JSON.parse(cachedString),
  maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week in milliseconds
});

/**
 * Custom hook to manage network status
 * @returns Object with network status information
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [netInfo, setNetInfo] = useState<NetInfoState | null>(null);
  
  useEffect(() => {
    // Subscribe to network info updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(Boolean(state.isConnected));
      setNetInfo(state);
    });
    
    // Get initial network state
    NetInfo.fetch().then((state) => {
      setIsOnline(Boolean(state.isConnected));
      setNetInfo(state);
    });
    
    // Unsubscribe on cleanup
    return () => {
      unsubscribe();
    };
  }, []);
  
  return { isOnline, netInfo };
}

/**
 * Network-aware QueryClient Provider component
 */
export function NetworkAwareQueryClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            // Don't persist error states
            return !query.state.error;
          },
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

/**
 * Helper function to make API requests
 * @param method - The HTTP method
 * @param url - API endpoint URL
 * @param data - Request data (for POST, PUT, PATCH)
 * @param config - Additional axios config
 * @returns Promise with response
 */
export async function apiRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  try {
    switch (method) {
      case 'GET':
        return axiosInstance.get<T>(url, config);
      case 'POST':
        return axiosInstance.post<T>(url, data, config);
      case 'PUT':
        return axiosInstance.put<T>(url, data, config);
      case 'PATCH':
        return axiosInstance.patch<T>(url, data, config);
      case 'DELETE':
        return axiosInstance.delete<T>(url, config);
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  } catch (error) {
    // Enhance error with additional information
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error(
          `API Error: ${method} ${url} failed with status ${axiosError.response.status}`,
          axiosError.response.data
        );
      } else if (axiosError.request) {
        console.error(`API Error: No response received for ${method} ${url}`);
      } else {
        console.error(`API Error: ${axiosError.message}`);
      }
    } else {
      console.error(`API Error: ${method} ${url} failed`, error);
    }
    
    throw error;
  }
}

/**
 * Custom hook for network-aware queries
 */
export function useNetworkAwareQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
>(
  queryKey: unknown[],
  queryFn: () => Promise<TQueryFnData>,
  options?: UseQueryOptions<TQueryFnData, TError, TData>
) {
  const { isOnline } = useNetworkStatus();
  
  return useQuery<TQueryFnData, TError, TData>({
    queryKey,
    queryFn,
    ...options,
    // Disable network requests when offline
    networkMode: isOnline ? 'online' : 'always',
    // Only show stale data when offline
    staleTime: isOnline ? options?.staleTime : Infinity,
  });
}

/**
 * Custom hook for network-aware infinite queries
 */
export function useNetworkAwareInfiniteQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
>(
  queryKey: unknown[],
  queryFn: any,
  options?: UseInfiniteQueryOptions<TQueryFnData, TError, TData>
) {
  const { isOnline } = useNetworkStatus();
  
  return useInfiniteQuery<TQueryFnData, TError, TData>({
    queryKey,
    queryFn,
    ...options,
    // Disable network requests when offline
    networkMode: isOnline ? 'online' : 'always',
    // Only show stale data when offline
    staleTime: isOnline ? options?.staleTime : Infinity,
  });
}

/**
 * Custom hook for network-aware mutations
 */
export function useNetworkAwareMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TError, TVariables, TContext>
) {
  const { isOnline } = useNetworkStatus();
  
  return useMutation<TData, TError, TVariables, TContext>({
    mutationFn,
    ...options,
    // Queue mutations when offline
    networkMode: isOnline ? 'online' : 'always',
    retry: isOnline ? options?.retry : 3, // More retries when offline
    retryDelay: options?.retryDelay || ((attempt) => Math.min(1000 * 2 ** attempt, 30000)),
  });
}

export default {
  queryClient,
  NetworkAwareQueryClientProvider,
  useNetworkStatus,
  useNetworkAwareQuery,
  useNetworkAwareInfiniteQuery,
  useNetworkAwareMutation,
  apiRequest,
};