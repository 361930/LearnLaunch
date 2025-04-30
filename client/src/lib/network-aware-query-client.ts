import { QueryClient, DefaultOptions } from '@tanstack/react-query';

/**
 * Creates a network-aware query client that adjusts refetch behavior
 * based on the device's online status.
 */
export function createNetworkAwareQueryClient(): QueryClient {
  const isOnline = () => navigator.onLine;
  
  // Define default options for the query client
  const defaultOptions: DefaultOptions = {
    queries: {
      // Don't refetch on window focus when offline
      refetchOnWindowFocus: () => isOnline(),
      
      // Use stale data when offline to avoid empty states
      staleTime: isOnline() ? 1000 * 60 * 5 : Infinity, // 5 minutes when online, infinite when offline
      
      // Retry failed queries only when online
      retry: (failureCount, error) => {
        if (!isOnline()) return false;
        return failureCount < 3;
      },
      
      // Custom error handler that handles network errors with more context
      onError: (error: unknown) => {
        // Only log network errors in production to keep the console clean in development
        if (import.meta.env.PROD) {
          if (error instanceof Error) {
            if ('TypeError: Failed to fetch' === error.toString() || error.message.includes('network')) {
              console.warn('Network error detected. Waiting for reconnection...');
            } else {
              console.error('Query error:', error);
            }
          }
        }
      },
    },
    mutations: {
      // Don't retry mutations when offline
      retry: (failureCount, error) => {
        if (!isOnline()) return false;
        return failureCount < 2;
      },
      
      // Custom error handler for mutations
      onError: (error: unknown) => {
        if (import.meta.env.PROD) {
          if (!isOnline()) {
            console.warn('Cannot perform mutation while offline.');
          } else if (error instanceof Error) {
            console.error('Mutation error:', error);
          }
        }
      },
    },
  };
  
  // Create and return the configured query client
  return new QueryClient({ defaultOptions });
}

/**
 * Registers event listeners for online/offline status changes
 * to invalidate and refetch queries when the network status changes.
 */
export function setupNetworkStatusListeners(queryClient: QueryClient): void {
  // When the app comes back online, invalidate all queries to get fresh data
  window.addEventListener('online', () => {
    console.log('🌐 Application is online. Refreshing data...');
    queryClient.invalidateQueries();
  });
  
  // When the app goes offline, pause all background fetching
  window.addEventListener('offline', () => {
    console.log('📴 Application is offline. Using cached data.');
    // We don't need to do anything as the retry logic will prevent refetches
  });
}