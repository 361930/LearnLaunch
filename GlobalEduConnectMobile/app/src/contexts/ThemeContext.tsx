import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme, StatusBar, ColorSchemeName } from 'react-native';
import secureStorage from '../utils/secureStorage';
import { THEME_PREFERENCE_KEY } from '../config/constants';
import { lightTheme, darkTheme, Theme } from '../theme';

// Theme mode options
type ThemeMode = 'light' | 'dark' | 'system';

// Theme context interface
interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colors: Theme['colors'];
  spacing: Theme['spacing'];
  typography: Theme['typography'];
  borderRadius: Theme['borderRadius'];
  shadows: Theme['shadows'];
}

// Create the context
const ThemeContext = createContext<ThemeContextType | null>(null);

// Props for the theme provider
interface ThemeProviderProps {
  children: React.ReactNode;
  initialThemeMode?: ThemeMode;
}

export function ThemeProvider({
  children,
  initialThemeMode = 'system',
}: ThemeProviderProps) {
  // Get the device color scheme
  const deviceColorScheme = useColorScheme();
  
  // Theme mode state
  const [themeMode, setThemeModeState] = useState<ThemeMode>(initialThemeMode);
  
  // Determine if we're using dark mode
  const isDark = themeMode === 'system' 
    ? deviceColorScheme === 'dark'
    : themeMode === 'dark';
  
  // Get the active theme
  const theme = isDark ? darkTheme : lightTheme;
  
  // Save the theme preference to storage
  const saveThemePreference = useCallback(async (mode: ThemeMode) => {
    try {
      await secureStorage.setItem(THEME_PREFERENCE_KEY, mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }, []);
  
  // Set the theme mode and save the preference
  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    saveThemePreference(mode);
  }, [saveThemePreference]);
  
  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await secureStorage.getItem(THEME_PREFERENCE_KEY);
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };
    
    loadThemePreference();
  }, []);
  
  // Update status bar based on theme
  useEffect(() => {
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');
    // For Android
    if (StatusBar.setBackgroundColor) {
      StatusBar.setBackgroundColor(theme.colors.background);
    }
  }, [isDark, theme]);
  
  // Context value
  const contextValue: ThemeContextType = {
    theme,
    isDark,
    themeMode,
    setThemeMode,
    colors: theme.colors,
    spacing: theme.spacing,
    typography: theme.typography,
    borderRadius: theme.borderRadius,
    shadows: theme.shadows,
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use the theme
export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}