// App-wide color constants for consistent theming
export const AppColors = {
  // Primary Colors
  primary: '#DB0500',
  primaryLight: '#FDEFEF',
  primaryDark: '#E55555',

  // Secondary Colors
  secondary: '#7DFFA5',
  secondaryLight: '#66BB6A',
  secondaryDark: '#388E3C',

  // Accent Colors
  accent: '#2196F3',
  accentLight: '#42A5F5',
  accentDark: '#1976D2',

  // Text Colors
  textPrimary: '#1F1F1F',
  textSecondary: '#666666',
  textTertiary: '#ABABAB',
  textLight: '#FFFFFF',

  // Background Colors
  background: '#FFFFFF',
  backgroundSecondary: '#F7F7F7',
  backgroundTertiary: '#F0F0F0',

  // Border Colors
  border: '#E1E1E1',
  borderLight: '#F0F0F0',
  borderDark: '#CCCCCC',

  // Status Colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Social Media Colors
  instagram: '#E4405F',
  snapchat: '#FFFC00',
  facebook: '#1877F2',
  twitter: '#1DA1F2',

  // Utility Colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  shadow: 'rgba(0, 0, 0, 0.1)',
} as const;

// Type for color keys
export type AppColorKey = keyof typeof AppColors;