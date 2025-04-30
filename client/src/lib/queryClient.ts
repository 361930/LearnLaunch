import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { createNetworkAwareQueryClient, setupNetworkStatusListeners } from "./network-aware-query-client";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Check for offline status before even attempting the request
  if (!navigator.onLine) {
    throw new Error("Cannot make API requests while offline");
  }

  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Add context about offline status to the error
    if (!navigator.onLine) {
      console.warn("Network request failed while offline:", url);
      throw new Error("You are currently offline. Please check your internet connection and try again.");
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // Add better offline experience
      if (!navigator.onLine) {
        console.warn("Query failed because device is offline. Using cached data if available.");
        // Let the query client use stale data
      }
      throw error;
    }
  };

// Create a network-aware query client
const networkAwareClient = createNetworkAwareQueryClient();

// Set up the default query function
networkAwareClient.setDefaultOptions({
  queries: {
    ...networkAwareClient.getDefaultOptions().queries,
    queryFn: getQueryFn({ on401: "throw" }),
  }
});

// Set up listeners for online/offline events
setupNetworkStatusListeners(networkAwareClient);

// Export the configured query client
export const queryClient = networkAwareClient;
