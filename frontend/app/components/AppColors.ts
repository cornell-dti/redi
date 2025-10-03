// App-wide color constants from Figma design system
export const AppColors = {
  // Backgrounds
  backgroundDefault: '#FFFFFF',
  backgroundDimmer: '#F4F4F4',

  // Foregrounds (Text)
  foregroundDefault: '#1F1F1F',
  foregroundDimmer: '#ABABAB',

  // Accent
  accentDefault: '#FFADAD',

  // Negative (Error/Destructive)
  negativeDefault: '#DB0500',
  negativeDimmer: '#FDEFEF',
} as const;

// Type for color keys
export type AppColorKey = keyof typeof AppColors;
