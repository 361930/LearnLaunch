/**
 * GlobalEduConnect Theme System
 * 
 * A comprehensive theming system with light and dark mode support.
 * Includes colors, typography, spacing, border radius, and shadows.
 */

// Font families
const fontFamilies = {
  regular: 'System',
  medium: 'System-Medium',
  semiBold: 'System-SemiBold',
  bold: 'System-Bold',
};

// Base sizes for typography
const baseTypography = {
  fontFamilies,
  weights: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },
};

// Shared spacing system
const baseSpacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Shared border radius
const baseBorderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
};

// Light theme colors
const lightColors = {
  // Primary brand colors
  primary: '#0074E4',
  primaryLight: '#0A84FF',
  primaryDark: '#0059B3',
  
  // Secondary brand colors
  secondary: '#8A54FF',
  secondaryLight: '#A578FF',
  secondaryDark: '#6E35E3',
  
  // Accent colors
  accent: '#FF6B00',
  accentLight: '#FF8A3D',
  accentDark: '#E04D00',
  
  // Semantic & Feedback colors
  success: '#26A869',
  successLight: '#30BF7A',
  successDark: '#1C8C55',
  
  warning: '#F9A825',
  warningLight: '#FFB547',
  warningDark: '#DA8C13',
  
  error: '#DC3545',
  errorLight: '#E25563',
  errorDark: '#B72C3A',
  
  info: '#0288D1',
  infoLight: '#29A1E6',
  infoDark: '#0277BD',
  
  // Neutral colors
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  black: '#000000',
  
  // Functional colors
  text: '#111827',
  textSecondary: '#4B5563',
  textTertiary: '#6B7280',
  textDisabled: '#9CA3AF',
  textInverse: '#FFFFFF',
  
  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  backgroundTertiary: '#F3F4F6',
  
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  
  // Special cases
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

// Dark theme colors
const darkColors = {
  // Primary brand colors
  primary: '#0A84FF',
  primaryLight: '#42A5FF',
  primaryDark: '#0064D1',
  
  // Secondary brand colors
  secondary: '#9D6AFF',
  secondaryLight: '#B68CFF',
  secondaryDark: '#8450EB',
  
  // Accent colors
  accent: '#FF8C30',
  accentLight: '#FFA05C',
  accentDark: '#E47A1D',
  
  // Semantic & Feedback colors
  success: '#30BF7A',
  successLight: '#48D892',
  successDark: '#26A869',
  
  warning: '#FFB547',
  warningLight: '#FFCA7A',
  warningDark: '#F0A62A',
  
  error: '#F25767',
  errorLight: '#F57A87',
  errorDark: '#D43D4D',
  
  info: '#29A1E6',
  infoLight: '#51B6F0',
  infoDark: '#0288D1',
  
  // Neutral colors
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  black: '#000000',
  
  // Functional colors
  text: '#FFFFFF',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  textDisabled: '#6B7280',
  textInverse: '#111827',
  
  background: '#121212',
  backgroundSecondary: '#1F1F1F',
  backgroundTertiary: '#2C2C2C',
  
  border: '#383838',
  borderStrong: '#505050',
  
  // Special cases
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: 'rgba(0, 0, 0, 0.3)',
};

// Light theme shadow definitions
const lightShadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: lightColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: lightColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: lightColors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: lightColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 8,
  },
  xl: {
    shadowColor: lightColors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 12,
  },
};

// Dark theme shadow definitions (stronger to stand out more in dark mode)
const darkShadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: darkColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: darkColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: darkColors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: darkColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  xl: {
    shadowColor: darkColors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 12,
  },
};

// Typography objects with component specific styles
const typography = {
  ...baseTypography,
  heading1: {
    fontFamily: fontFamilies.bold,
    fontSize: baseTypography.sizes.xxxl,
    fontWeight: baseTypography.weights.bold,
    lineHeight: baseTypography.lineHeights.tight,
  },
  heading2: {
    fontFamily: fontFamilies.bold,
    fontSize: baseTypography.sizes.xxl,
    fontWeight: baseTypography.weights.bold,
    lineHeight: baseTypography.lineHeights.tight,
  },
  heading3: {
    fontFamily: fontFamilies.semiBold,
    fontSize: baseTypography.sizes.xl,
    fontWeight: baseTypography.weights.semiBold,
    lineHeight: baseTypography.lineHeights.tight,
  },
  heading4: {
    fontFamily: fontFamilies.semiBold,
    fontSize: baseTypography.sizes.lg,
    fontWeight: baseTypography.weights.semiBold,
    lineHeight: baseTypography.lineHeights.tight,
  },
  heading5: {
    fontFamily: fontFamilies.medium,
    fontSize: baseTypography.sizes.md,
    fontWeight: baseTypography.weights.medium,
    lineHeight: baseTypography.lineHeights.tight,
  },
  heading6: {
    fontFamily: fontFamilies.medium,
    fontSize: baseTypography.sizes.sm,
    fontWeight: baseTypography.weights.medium,
    lineHeight: baseTypography.lineHeights.tight,
  },
  body1: {
    fontFamily: fontFamilies.regular,
    fontSize: baseTypography.sizes.md,
    fontWeight: baseTypography.weights.regular,
    lineHeight: baseTypography.lineHeights.normal,
  },
  body2: {
    fontFamily: fontFamilies.regular,
    fontSize: baseTypography.sizes.sm,
    fontWeight: baseTypography.weights.regular,
    lineHeight: baseTypography.lineHeights.normal,
  },
  button: {
    fontFamily: fontFamilies.medium,
    fontSize: baseTypography.sizes.md,
    fontWeight: baseTypography.weights.medium,
    lineHeight: baseTypography.lineHeights.tight,
  },
  caption: {
    fontFamily: fontFamilies.regular,
    fontSize: baseTypography.sizes.xs,
    fontWeight: baseTypography.weights.regular,
    lineHeight: baseTypography.lineHeights.normal,
  },
  overline: {
    fontFamily: fontFamilies.medium,
    fontSize: baseTypography.sizes.xs,
    fontWeight: baseTypography.weights.medium,
    lineHeight: baseTypography.lineHeights.normal,
    textTransform: 'uppercase',
  },
};

// Export the theme interface
export interface Theme {
  colors: typeof lightColors;
  typography: typeof typography;
  spacing: typeof baseSpacing;
  borderRadius: typeof baseBorderRadius;
  shadows: typeof lightShadows;
}

// Export light theme
export const lightTheme: Theme = {
  colors: lightColors,
  typography,
  spacing: baseSpacing,
  borderRadius: baseBorderRadius,
  shadows: lightShadows,
};

// Export dark theme
export const darkTheme: Theme = {
  colors: darkColors,
  typography,
  spacing: baseSpacing,
  borderRadius: baseBorderRadius,
  shadows: darkShadows,
};

// Helper functions to access theme properties
export const getColor = (theme: Theme, color: keyof Theme['colors']) => theme.colors[color];
export const getSpacing = (theme: Theme, spacing: keyof Theme['spacing']) => theme.spacing[spacing];
export const getBorderRadius = (theme: Theme, radius: keyof Theme['borderRadius']) => theme.borderRadius[radius];
export const getShadow = (theme: Theme, shadow: keyof Theme['shadows']) => theme.shadows[shadow];

// Default export for easy importing
export default {
  light: lightTheme,
  dark: darkTheme,
};