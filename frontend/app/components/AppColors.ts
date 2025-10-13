// App-wide color constants from Figma design system
export const AppColors = {
  // Backgrounds
  backgroundDefault: '#FFFFFF',
  backgroundDimmer: '#F4F4F4',
  backgroundDimmest: '#E5E5E5',

  // Foregrounds (Text)
  foregroundDefault: '#1F1F1F',
  foregroundDimmer: '#929292',

  // Accent
  accentDefault: '#1B1B1B',
  accentDimmer: '#505050',

  // Negative (Error/Destructive)
  negativeDefault: '#DB0500',
  negativeDimmer: '#FAD9D9',
  negativeDimmest: '#FDEFEF',
} as const;

// Type for color keys
export type AppColorKey = keyof typeof AppColors;
