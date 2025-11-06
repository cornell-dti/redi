import Constants from 'expo-constants';

// API URL configured via app.config.js
// Uses localhost for local development, Heroku for production builds
// Multiple fallbacks to ensure production builds never use localhost
const getApiBaseUrl = (): string => {
  // First, try to get from Expo config (should be set by app.config.js)
  const configUrl = Constants.expoConfig?.extra?.apiBaseUrl;

  if (configUrl) {
    return configUrl;
  }

  // Fallback: If running in Expo Go or development, use localhost
  // Otherwise use production URL
  if (Constants.appOwnership === 'expo' || __DEV__) {
    console.warn('Using localhost fallback - this should only happen in development');
    return 'http://localhost:3001';
  }

  // Final fallback for production builds
  console.warn('Using hardcoded production URL fallback');
  return 'https://redi-app-8ea0a6e9c3d9.herokuapp.com';
};

export const API_BASE_URL = getApiBaseUrl();

// Log API configuration on app startup for debugging
// This helps diagnose production build issues
console.log('========================================');
console.log('API Configuration:');
console.log('API_BASE_URL:', API_BASE_URL);
console.log('Expo Config Extra:', Constants.expoConfig?.extra);
console.log('Release Channel:', Constants.expoConfig?.releaseChannel);
console.log('App Ownership:', Constants.appOwnership);
console.log('Is DEV:', __DEV__);
console.log('========================================');
