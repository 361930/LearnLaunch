import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { LightTheme, DarkTheme, Theme } from '../theme';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextProps {
  theme: Theme;
  themeType: ThemeType;
  setThemeType: (type: ThemeType) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: LightTheme,
  themeType: 'system',
  setThemeType: () => {},
  isDarkMode: false,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const colorScheme = useColorScheme();
  const [themeType, setThemeType] = useState<ThemeType>('system');
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme) {
          setThemeType(savedTheme as ThemeType);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };

    loadTheme();
  }, []);

  // Update isDarkMode based on theme type and system preference
  useEffect(() => {
    if (themeType === 'system') {
      setIsDarkMode(colorScheme === 'dark');
    } else {
      setIsDarkMode(themeType === 'dark');
    }
  }, [themeType, colorScheme]);

  // Save theme preference when it changes
  useEffect(() => {
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem('theme', themeType);
      } catch (error) {
        console.error('Failed to save theme preference:', error);
      }
    };

    saveTheme();
  }, [themeType]);

  const toggleTheme = () => {
    setThemeType(isDarkMode ? 'light' : 'dark');
  };

  const updateThemeType = (type: ThemeType) => {
    setThemeType(type);
  };

  const theme = isDarkMode ? DarkTheme : LightTheme;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeType,
        setThemeType: updateThemeType,
        isDarkMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;