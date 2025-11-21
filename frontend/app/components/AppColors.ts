// App-wide color constants from Figma design system
// This object is mutable and will be updated when the theme changes
export const AppColors = {
  // Backgrounds
  backgroundDefault: '#FFFFFF',
  backgroundDimmer: '#F4F4F4',
  backgroundDimmest: '#E5E5E5',

  // Foregrounds (Text)
  foregroundDefault: '#1F1F1F',
  foregroundDimmer: '#7A7A7A',

  // Accent (mutable - changes with theme)
  accentDefault: '#1B1B1B',
  accentDimmer: '#505050',
  accentAlpha: '#D9D9D9',

  // Negative (Error/Destructive)
  negativeDefault: '#DB0500',
  negativeDimmer: '#FAD9D9',
  negativeDimmest: '#FDEFEF',

  // Surfaces
  surfaceWhite: '#FFFFFF',
  surfaceBlack: '#000000',

  // Overlays
  overlayDark: 'rgba(0, 0, 0, 0.35)',
  overlayLight: 'rgba(255, 255, 255, 0.08)',

  // Borders
  borderDefault: '#E0E0E0',
  borderDimmer: '#DDDDDD',

  // Shadows
  shadowDefault: '#000000',

  // Utility
  transparent: 'transparent',
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

// Function to update all theme colors (light/dark mode)
export const updateThemeColors = (colors: Partial<typeof AppColors>) => {
  // Update each property individually to avoid Reanimated issues
  // Reanimated blocks Object.assign on objects passed to worklets
  if (colors.backgroundDefault !== undefined) AppColors.backgroundDefault = colors.backgroundDefault;
  if (colors.backgroundDimmer !== undefined) AppColors.backgroundDimmer = colors.backgroundDimmer;
  if (colors.backgroundDimmest !== undefined) AppColors.backgroundDimmest = colors.backgroundDimmest;
  if (colors.foregroundDefault !== undefined) AppColors.foregroundDefault = colors.foregroundDefault;
  if (colors.foregroundDimmer !== undefined) AppColors.foregroundDimmer = colors.foregroundDimmer;
  if (colors.overlayDark !== undefined) AppColors.overlayDark = colors.overlayDark;
  if (colors.overlayLight !== undefined) AppColors.overlayLight = colors.overlayLight;
  if (colors.borderDefault !== undefined) AppColors.borderDefault = colors.borderDefault;
  if (colors.borderDimmer !== undefined) AppColors.borderDimmer = colors.borderDimmer;

  console.log('🔄 Updated AppColors individually');
};

// Type for color keys
export type AppColorKey = keyof typeof AppColors;
