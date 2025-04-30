/**
 * GlobalEduConnect Theme System
 * 
 * Provides comprehensive theming support with:
 * - Light and dark mode themes
 * - Semantic color tokens
 * - Typography scales
 * - Spacing and elevation utilities
 * - High contrast mode for accessibility
 */

// Theme type definition
export type ThemeMode = 'light' | 'dark' | 'system' | 'high-contrast';

// Color palette
export interface ColorTokens {
  // Brand colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  
  // Status colors
  success: string;
  successLight: string;
  successDark: string;
  error: string;
  errorLight: string;
  errorDark: string;
  warning: string;
  warningLight: string;
  warningDark: string;
  info: string;
  infoLight: string;
  infoDark: string;
  
  // Neutral colors
  background: string;
  backgroundSubtle: string;
  backgroundVariant: string;
  card: string;
  cardHover: string;
  surface: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textDisabled: string;
  textInverted: string;
  
  // UI element colors
  border: string;
  borderFocused: string;
  divider: string;
  inputBackground: string;
  placeholder: string;
  disabled: string;
  
  // Overlay colors
  overlay: string;
  shadow: string;
}

// Shadow definition
export interface ShadowConfig {
  shadowOffset: {
    width: number;
    height: number;
  };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

// Shadow tokens
export interface ShadowTokens {
  none: ShadowConfig;
  xs: ShadowConfig;
  sm: ShadowConfig;
  md: ShadowConfig;
  lg: ShadowConfig;
  xl: ShadowConfig;
}

// Theme values
export interface Theme {
  id: string;
  name: string;
  colors: ColorTokens;
  shadows: ShadowTokens;
}

// Spacing scale (in pixels)
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border radiuses
export const radius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Typography scales
export const typography = {
  fontFamily: {
    base: 'System', // Will be replaced with actual font family
    heading: 'System-Bold',
    monospace: 'monospace',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
    display: 36,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: 1.1,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Define shadow presets
const shadows: ShadowTokens = {
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
};

// Light theme
export const lightTheme: Theme = {
  id: 'light',
  name: 'Light',
  colors: {
    // Brand colors
    primary: '#3366FF',        // Primary brand color
    primaryLight: '#D6E4FF',
    primaryDark: '#0039CB',
    secondary: '#00BFA5',      // Secondary brand color
    secondaryLight: '#C8F7F0',
    secondaryDark: '#008C75',
    accent: '#FF6D00',         // Accent color for highlighting
    accentLight: '#FFE2CC',
    accentDark: '#CC5700',
    
    // Status colors
    success: '#03A86B',        // Success state
    successLight: '#C4F7E0',
    successDark: '#027E50',
    error: '#E53935',          // Error state
    errorLight: '#FFD8D6',
    errorDark: '#B2000E',
    warning: '#FFA000',        // Warning state
    warningLight: '#FFE8BD',
    warningDark: '#CC8000',
    info: '#0288D1',           // Info state
    infoLight: '#CCE9F6',
    infoDark: '#01579B',
    
    // Neutral colors
    background: '#F7F9FC',     // App background
    backgroundSubtle: '#EDF1F7',  // Subtle background variant
    backgroundVariant: '#E4E9F2', // Button backgrounds, etc.
    card: '#FFFFFF',           // Card background
    cardHover: '#F5F7FA',      // Card hover state
    surface: '#FFFFFF',        // Surface elements
    
    // Text colors
    text: '#222B45',           // Primary text
    textSecondary: '#6B7A99',  // Secondary text
    textDisabled: '#A6B1CC',   // Disabled text
    textInverted: '#FFFFFF',   // Text on dark backgrounds
    
    // UI element colors
    border: '#D8E1E8',         // Borders
    borderFocused: '#3366FF',  // Focused input border
    divider: '#EDF1F7',        // Divider lines
    inputBackground: '#F7F9FC', // Input background
    placeholder: '#A6B1CC',     // Placeholder text
    disabled: '#E4E9F2',        // Disabled elements
    
    // Overlay colors
    overlay: 'rgba(34, 43, 69, 0.5)', // Modal overlays
    shadow: 'rgba(34, 43, 69, 0.05)',  // Shadows
  },
  shadows,
};

// Dark theme
export const darkTheme: Theme = {
  id: 'dark',
  name: 'Dark',
  colors: {
    // Brand colors
    primary: '#3366FF',        // Primary brand color
    primaryLight: '#1E3A8A',
    primaryDark: '#82B1FF',
    secondary: '#00BFA5',      // Secondary brand color
    secondaryLight: '#00796B',
    secondaryDark: '#64FFDA',
    accent: '#FF6D00',         // Accent color for highlighting
    accentLight: '#993F00',
    accentDark: '#FFAB40',
    
    // Status colors
    success: '#03A86B',        // Success state
    successLight: '#025e3c',
    successDark: '#7AEEBE',
    error: '#E53935',          // Error state
    errorLight: '#991210',
    errorDark: '#FF8A85',
    warning: '#FFA000',        // Warning state
    warningLight: '#996000',
    warningDark: '#FFCF71',
    info: '#0288D1',           // Info state
    infoLight: '#01537A',
    infoDark: '#82CCF7',
    
    // Neutral colors
    background: '#1A1F2E',     // App background
    backgroundSubtle: '#222B45',  // Subtle background variant
    backgroundVariant: '#2E3A59', // Button backgrounds, etc.
    card: '#222B45',           // Card background
    cardHover: '#2E3A59',      // Card hover state
    surface: '#1E2235',        // Surface elements
    
    // Text colors
    text: '#F7F9FC',           // Primary text
    textSecondary: '#C5CEE0',  // Secondary text
    textDisabled: '#8F9BB3',   // Disabled text
    textInverted: '#222B45',   // Text on light backgrounds
    
    // UI element colors
    border: '#3A4668',         // Borders
    borderFocused: '#598BFF',  // Focused input border
    divider: '#2E3A59',        // Divider lines
    inputBackground: '#1E2235', // Input background
    placeholder: '#8F9BB3',     // Placeholder text
    disabled: '#2E3A59',        // Disabled elements
    
    // Overlay colors
    overlay: 'rgba(0, 0, 0, 0.7)', // Modal overlays
    shadow: 'rgba(0, 0, 0, 0.4)',  // Shadows
  },
  shadows,
};

// High contrast theme for accessibility
export const highContrastTheme: Theme = {
  id: 'high-contrast',
  name: 'High Contrast',
  colors: {
    // Brand colors
    primary: '#007AFF',        // More vivid primary color
    primaryLight: '#ADDBFF',
    primaryDark: '#0055CC',
    secondary: '#00CC66',      // More vivid secondary color
    secondaryLight: '#ADFFCF',
    secondaryDark: '#008C47',
    accent: '#FF2D55',         // Vivid accent color
    accentLight: '#FFADBB',
    accentDark: '#CC0025',
    
    // Status colors
    success: '#00CC47',        // Vivid success
    successLight: '#ADFFCC',
    successDark: '#008C31',
    error: '#FF3B30',          // Vivid error
    errorLight: '#FFB9B5',
    errorDark: '#CC1E15',
    warning: '#FFCC00',        // Vivid warning
    warningLight: '#FFFAE6',
    warningDark: '#CC8400',
    info: '#34C4FE',           // Vivid info
    infoLight: '#C1EBFF',
    infoDark: '#0092CC',
    
    // Neutral colors - high contrast
    background: '#000000',     // Pure black background
    backgroundSubtle: '#121212',
    backgroundVariant: '#1E1E1E',
    card: '#121212',
    cardHover: '#1E1E1E',
    surface: '#191919',
    
    // Text colors - high contrast
    text: '#FFFFFF',           // Pure white text
    textSecondary: '#EEEEEE',
    textDisabled: '#999999',
    textInverted: '#000000',   // Pure black text on light backgrounds
    
    // UI element colors
    border: '#444444',
    borderFocused: '#FFCC00',  // Yellow for best visibility
    divider: '#444444',
    inputBackground: '#121212',
    placeholder: '#AAAAAA',
    disabled: '#333333',
    
    // Overlay colors
    overlay: 'rgba(0, 0, 0, 0.8)',
    shadow: 'rgba(0, 0, 0, 0.9)',
  },
  shadows,
};

// The themes available in the app
export const themes: { [key: string]: Theme } = {
  light: lightTheme,
  dark: darkTheme,
  'high-contrast': highContrastTheme,
};

// Helper function to get a color value from a theme
export const getColor = (theme: Theme, colorName: keyof ColorTokens): string => {
  return theme.colors[colorName];
};

// Helper function to get a shadow configuration
export const getShadow = (theme: Theme, shadowSize: keyof ShadowTokens) => {
  const shadowConfig = theme.shadows[shadowSize];
  
  return {
    shadowColor: theme.colors.shadow,
    shadowOffset: shadowConfig.shadowOffset,
    shadowOpacity: shadowConfig.shadowOpacity,
    shadowRadius: shadowConfig.shadowRadius,
    elevation: shadowConfig.elevation,
  };
};

// Helper function to get a spacing value
export const getSpacing = (size: keyof typeof spacing): number => {
  return spacing[size];
};

// Helper function to get a radius value
export const getRadius = (size: keyof typeof radius): number => {
  return radius[size];
};

export default {
  themes,
  lightTheme,
  darkTheme,
  highContrastTheme,
  spacing,
  radius,
  typography,
  getColor,
  getShadow,
  getSpacing,
  getRadius,
};