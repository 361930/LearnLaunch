import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Appearance, ColorSchemeName, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, highContrastTheme, Theme, ThemeMode } from '../theme';

// Theme context type
export interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isLoading: boolean;
}

// Create context
const ThemeContext = createContext<ThemeContextType | null>(null);

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
}

// Storage key for theme preference
const THEME_STORAGE_KEY = 'gec_theme_preference';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // System color scheme
  const systemColorScheme = useColorScheme();
  
  // Theme state
  const [theme, setTheme] = useState<Theme>(lightTheme);
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Load saved theme preference
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedThemeMode) {
          setThemeModeState(savedThemeMode as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadThemePreference();
  }, []);
  
  // Listen for system theme changes when using 'system' mode
  useEffect(() => {
    if (themeMode === 'system') {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        updateThemeBasedOnMode(themeMode, colorScheme);
      });
      
      return () => {
        subscription.remove();
      };
    }
  }, [themeMode]);
  
  // Update theme when themeMode changes
  useEffect(() => {
    updateThemeBasedOnMode(themeMode, systemColorScheme);
  }, [themeMode, systemColorScheme]);
  
  // Set theme mode and save preference
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };
  
  // Update the active theme based on the selected mode and system preferences
  const updateThemeBasedOnMode = (mode: ThemeMode, systemMode: ColorSchemeName) => {
    switch (mode) {
      case 'light':
        setTheme(lightTheme);
        break;
      case 'dark':
        setTheme(darkTheme);
        break;
      case 'high-contrast':
        setTheme(highContrastTheme);
        break;
      case 'system':
      default:
        // Use system preference or fallback to light
        setTheme(systemMode === 'dark' ? darkTheme : lightTheme);
        break;
    }
  };
  
  // Context value
  const contextValue: ThemeContextType = {
    theme,
    themeMode,
    setThemeMode,
    isLoading,
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for using the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

// HOC to inject theme into class components
export function withTheme<P>(
  Component: React.ComponentType<P & { theme: Theme }>
): React.FC<P> {
  return (props: P) => {
    const { theme } = useTheme();
    return <Component {...props} theme={theme} />;
  };
}

export default ThemeContext;