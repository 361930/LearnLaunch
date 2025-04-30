import { DefaultTheme as PaperDefaultTheme, DarkTheme as PaperDarkTheme } from 'react-native-paper';
import { DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { Dimensions } from 'react-native';

// 8-point spacing grid
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

// Screen dimensions utility
export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Check if device is a tablet
export const isTablet = SCREEN_WIDTH >= 768;

// Breakpoints
export const breakpoints = {
  phone: 0,
  tablet: 768,
};

// Color palette
const colors = {
  // Primary
  primary: '#4C6EF5',
  primaryDark: '#3B5BD9',
  primaryLight: '#7B93F9',

  // Secondary
  secondary: '#FF6B6B',
  secondaryDark: '#E05252',
  secondaryLight: '#FF9999',

  // Neutrals
  black: '#000000',
  darkGrey: '#333333',
  mediumGrey: '#666666',
  lightGrey: '#CCCCCC',
  offWhite: '#F9FAFB',
  white: '#FFFFFF',

  // Status 
  success: '#4CAF50',
  successLight: '#A5D6A7',
  warning: '#FFCC5C',
  warningLight: '#FFE082',
  error: '#F44336',
  errorLight: '#EF9A9A',
  info: '#2196F3',
  infoLight: '#90CAF9',

  // Misc
  accent: '#FF9900',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// Dark theme colors
const darkColors = {
  // Primary
  primary: '#5D7BF7',
  primaryDark: '#3B5BD9',
  primaryLight: '#7B93F9',

  // Secondary
  secondary: '#FF7B7B',
  secondaryDark: '#E05252',
  secondaryLight: '#FF9999',

  // Neutrals
  black: '#FFFFFF',
  darkGrey: '#EEEEEE',
  mediumGrey: '#AAAAAA',
  lightGrey: '#555555',
  offWhite: '#222222',
  white: '#121212',

  // Status
  success: '#66BB6A',
  successLight: '#81C784',
  warning: '#FFCA28',
  warningLight: '#FFD54F',
  error: '#EF5350',
  errorLight: '#E57373',
  info: '#42A5F5',
  infoLight: '#64B5F6',

  // Misc
  accent: '#FFAB40',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.75)',
};

// Typography
export const typography = {
  h1: {
    fontSize: isTablet ? 40 : 32,
    fontWeight: 'bold',
    lineHeight: isTablet ? 48 : 40,
  },
  h2: {
    fontSize: isTablet ? 32 : 28,
    fontWeight: 'bold',
    lineHeight: isTablet ? 40 : 36,
  },
  h3: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: 'bold',
    lineHeight: isTablet ? 36 : 32,
  },
  h4: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    lineHeight: isTablet ? 32 : 28,
  },
  h5: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    lineHeight: isTablet ? 28 : 24,
  },
  h6: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    lineHeight: isTablet ? 24 : 22,
  },
  subtitle1: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    lineHeight: isTablet ? 22 : 20,
  },
  subtitle2: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
    lineHeight: isTablet ? 20 : 18,
  },
  body1: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'normal',
    lineHeight: isTablet ? 24 : 22,
  },
  body2: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: 'normal',
    lineHeight: isTablet ? 20 : 18,
  },
  caption: {
    fontSize: isTablet ? 12 : 10,
    fontWeight: 'normal',
    lineHeight: isTablet ? 16 : 14,
  },
  button: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    lineHeight: isTablet ? 24 : 22,
    textTransform: 'uppercase',
  },
};

// Border radius
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};

// Shadows
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 10,
  },
};

// Light theme configuration
export const LightTheme = {
  ...NavigationDefaultTheme,
  ...PaperDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    ...PaperDefaultTheme.colors,
    primary: colors.primary,
    accent: colors.accent,
    background: colors.offWhite,
    surface: colors.white,
    card: colors.white,
    text: colors.darkGrey,
    error: colors.error,
    disabled: colors.lightGrey,
    placeholder: colors.mediumGrey,
    notification: colors.secondary,
    border: colors.lightGrey,

    // Custom colors for our use
    ...colors,
  },
  typography,
  spacing,
  borderRadius,
  shadows,
  dark: false,
};

// Dark theme configuration
export const DarkTheme = {
  ...NavigationDarkTheme,
  ...PaperDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    ...PaperDarkTheme.colors,
    primary: darkColors.primary,
    accent: darkColors.accent,
    background: darkColors.offWhite,
    surface: darkColors.white,
    card: darkColors.white,
    text: darkColors.darkGrey,
    error: darkColors.error,
    disabled: darkColors.lightGrey,
    placeholder: darkColors.mediumGrey,
    notification: darkColors.secondary,
    border: darkColors.lightGrey,

    // Custom colors for our use
    ...darkColors,
  },
  typography,
  spacing,
  borderRadius,
  shadows,
  dark: true,
};

export type Theme = typeof LightTheme;