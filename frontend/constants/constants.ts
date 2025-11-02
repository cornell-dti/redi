import Constants from 'expo-constants';

// API URL configured via app.config.js
// Uses localhost for local development, Heroku for production builds
export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:3001';
