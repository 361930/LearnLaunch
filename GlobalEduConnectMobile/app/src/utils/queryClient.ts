import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache time for offline data
const OFFLINE_CACHE_TIME = 1000 * 60 * 60 * 24 * 7; // 7 days

// Maximum age of stale data to be considered valid when offline
const OFFLINE_STALE_TIME = 1000 * 60 * 60 * 24 * 3; // 3 days

// Create a custom query client that handles offline behavior
export const createNetworkAwareQueryClient = (notifyError?: (error: Error) => void) => {
  // Track network state
  let isOnline = true;
  
  // Setup network monitoring
  NetInfo.addEventListener(state => {
    isOnline = !!state.isConnected;
  });
  
  // Configure the QueryClient with offline behavior
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // When offline, use stale data indefinitely
        staleTime: () => isOnline ? 1000 * 60 : OFFLINE_STALE_TIME,
        // Keep cache longer when offline
        cacheTime: () => isOnline ? 1000 * 60 * 5 : OFFLINE_CACHE_TIME,
        // Retry fewer times when offline
        retry: (failureCount, error) => {
          if (!isOnline) return false; // Don't retry when offline
          if (error instanceof Error && error.message === 'Network Error') return false;
          return failureCount < 3;
        },
        // Don't refetch on window focus when offline
        refetchOnWindowFocus: () => isOnline,
        // When offline, return stale data even if an error occurred
        retryOnMount: () => isOnline,
      },
      mutations: {
        // Retry mutations when online
        retry: (failureCount, error) => {
          if (!isOnline) return false; // Don't retry when offline
          if (error instanceof Error && error.message === 'Network Error') return false;
          return failureCount < 2;
        },
      },
    },
    // Handle query errors
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Only notify about errors from queries that aren't retrying
        if (!query.getState().isError) return;
        
        // Notify about the error if callback provided
        if (notifyError && error instanceof Error) {
          notifyError(error);
        }
        
        console.error(`Query error: ${error.message}`);
      },
    }),
    // Handle mutation errors
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        // Only notify about errors that aren't being handled by the mutation directly
        if (mutation.options.onError) return;
        
        // Notify about the error if callback provided
        if (notifyError && error instanceof Error) {
          notifyError(error);
        }
        
        console.error(`Mutation error: ${error.message}`);
      },
    }),
  });
  
  // Enable React Query offline persistence
  enableQueryOfflinePersistence(queryClient);
  
  return queryClient;
};

// Helper to enable React Query persistence for offline support
const enableQueryOfflinePersistence = async (queryClient: QueryClient) => {
  // Create a custom persister that uses AsyncStorage
  const createAsyncStoragePersister = () => {
    return {
      persistClient: async (client: object) => {
        try {
          await AsyncStorage.setItem(
            'REACT_QUERY_OFFLINE_CACHE',
            JSON.stringify(client)
          );
        } catch (error) {
          console.error('Error persisting query cache:', error);
        }
      },
      restoreClient: async () => {
        try {
          const cacheString = await AsyncStorage.getItem('REACT_QUERY_OFFLINE_CACHE');
          if (cacheString) {
            return JSON.parse(cacheString);
          }
        } catch (error) {
          console.error('Error restoring query cache:', error);
        }
        return null;
      },
      removeClient: async () => {
        try {
          await AsyncStorage.removeItem('REACT_QUERY_OFFLINE_CACHE');
        } catch (error) {
          console.error('Error removing query cache:', error);
        }
      },
    };
  };

  try {
    // This would normally be configured with persistQueryClient,
    // but instead we're demonstrating the concepts
    const persistor = createAsyncStoragePersister();
    
    // Restore persisted cache on app start
    const persistedCache = await persistor.restoreClient();
    if (persistedCache) {
      queryClient.setQueryData(persistedCache);
    }
    
    // Setup event listeners to persist cache on updates
    // In a real implementation, you'd use persistQueryClient from the library
    queryClient.getQueryCache().subscribe(() => {
      persistor.persistClient(queryClient.getQueryCache().getAll());
    });
  } catch (error) {
    console.error('Error setting up query persistence:', error);
  }
};

// Default query client instance
export const queryClient = createNetworkAwareQueryClient();