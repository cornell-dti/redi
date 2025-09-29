// App-wide color constants for consistent theming
export const AppColors = {
  // Primary Colors
  primary: '#FF6B6B',
  primaryLight: '#FF8A8A',
  primaryDark: '#E55555',

  // Secondary Colors
  secondary: '#4CAF50',
  secondaryLight: '#66BB6A',
  secondaryDark: '#388E3C',

  // Accent Colors
  accent: '#2196F3',
  accentLight: '#42A5F5',
  accentDark: '#1976D2',

  // Text Colors
  textPrimary: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textLight: '#FFFFFF',

  // Background Colors
  background: '#F8F9FA',
  backgroundSecondary: '#FFFFFF',
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