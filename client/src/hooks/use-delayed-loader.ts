import { useState, useEffect } from 'react';

/**
 * A hook that delays showing loading states to prevent flickering
 * for fast network responses.
 * 
 * @param isLoading Whether the data is currently loading
 * @param delay Delay in milliseconds before showing the loading state
 * @param minDisplay Minimum time in milliseconds to display the loading state once shown
 * @returns Whether the loading state should be displayed
 */
export function useDelayedLoader(
  isLoading: boolean,
  delay: number = 400,
  minDisplay: number = 500
): boolean {
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const [loaderTimer, setLoaderTimer] = useState<number | null>(null);
  const [minDisplayTimer, setMinDisplayTimer] = useState<number | null>(null);

  useEffect(() => {
    // When loading starts
    if (isLoading && !showLoader && !loaderTimer) {
      // Set a delay before showing the loader
      const timer = window.setTimeout(() => {
        setShowLoader(true);
        setLoaderTimer(null);
      }, delay);
      
      setLoaderTimer(timer);
    }
    
    // When loading ends
    if (!isLoading && showLoader) {
      // If minDisplay is set, ensure the loader stays visible for at least that duration
      if (minDisplay > 0 && !minDisplayTimer) {
        const timer = window.setTimeout(() => {
          setShowLoader(false);
          setMinDisplayTimer(null);
        }, minDisplay);
        
        setMinDisplayTimer(timer);
      } else {
        setShowLoader(false);
      }
    }
    
    // When loading ends before the delay timer triggers
    if (!isLoading && !showLoader && loaderTimer) {
      clearTimeout(loaderTimer);
      setLoaderTimer(null);
    }
    
    return () => {
      // Clean up timers on unmount
      if (loaderTimer) clearTimeout(loaderTimer);
      if (minDisplayTimer) clearTimeout(minDisplayTimer);
    };
  }, [isLoading, showLoader, loaderTimer, minDisplayTimer, delay, minDisplay]);
  
  return showLoader;
}