/**
 * App Configuration
 *
 * Environment-specific settings for the application.
 * For production, update WEB_APP_URL to your deployed web URL.
 */

// Web app URL for email link redirects
// Development: Use your local IP address (find with `ipconfig getifaddr en0` on Mac)
// Production: Replace with your deployed URL (e.g., 'https://redi.yourdomain.com')
export const WEB_APP_URL = 'http://10.48.82.113:3000';

// Deep link scheme (must match app.json "scheme" field)
export const DEEP_LINK_SCHEME = 'redi';
