// App-wide color constants from Figma design system
// This object is mutable and will be updated when the theme changes
export const AppColors = {
  // Backgrounds
  backgroundDefault: '#FFFFFF',
  backgroundDimmer: '#F4F4F4',
  backgroundDimmest: '#E5E5E5',

  // Foregrounds (Text)
  foregroundDefault: '#1F1F1F',
  foregroundDimmer: '#929292',

  // Accent (mutable - changes with theme)
  accentDefault: '#1B1B1B',
  accentDimmer: '#505050',
  accentAlpha: '#D9D9D9',

  // Negative (Error/Destructive)
  negativeDefault: '#DB0500',
  negativeDimmer: '#FAD9D9',
  negativeDimmest: '#FDEFEF',
};

// Function to update accent colors (called by ThemeContext)
export const updateAccentColors = (
  accentDefault: string,
  accentDimmer: string,
  accentAlpha: string
) => {
  AppColors.accentDefault = accentDefault;
  AppColors.accentDimmer = accentDimmer;
  AppColors.accentAlpha = accentAlpha;
};

// Type for color keys
export type AppColorKey = keyof typeof AppColors;
