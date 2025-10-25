import rateLimit from 'express-rate-limit';

/**
 * Rate limiting configuration for different endpoint types
 * Prevents abuse, scraping, brute force, and DoS attacks
 */

/**
 * Strict rate limiting for public endpoints (no authentication required)
 * Used for: user listings, profile browsing, public data access
 * Limit: 20 requests per 15 minutes per IP
 */
export const publicRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip successful requests that don't hit the limit
  skipSuccessfulRequests: false,
  // Skip failed requests (4xx, 5xx)
  skipFailedRequests: false,
});

/**
 * Standard rate limiting for authenticated endpoints
 * Used for: profile updates, preferences, answers
 * Limit: 200 requests per 15 minutes per IP
 *
 * NOTE: Increased from 100 to 200 to accommodate:
 * - Home screen cascade (~20 API calls per load)
 * - Profile navigation and updates
 * - Match fetching and nudge status checks
 * This provides breathing room while batch endpoints are implemented
 */
export const authenticatedRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Relaxed rate limiting for admin endpoints
 * Used for: admin operations, bulk uploads
 * Limit: 1000 requests per 15 minutes per IP
 */
export const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many admin requests, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Very strict rate limiting for sensitive operations
 * Used for: login attempts, user creation, password resets
 * Limit: 5 requests per 15 minutes per IP
 */
export const authenticationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Relaxed rate limiting for notification polling
 * Used for: notification fetching, unread count
 * Limit: 200 requests per 15 minutes per IP
 *
 * Rationale: Notifications are polled every 60 seconds (2 endpoints per poll)
 * This allows ~100 polling cycles per 15 minutes, which is reasonable for
 * users who keep the app open on the notifications screen.
 */
export const notificationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: {
    error: 'Too many notification requests, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiting for image uploads
 * Used for: file uploads
 * Limit: 10 uploads per hour per IP
 */
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: {
    error: 'Too many file uploads, please try again later.',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiting for chat messages
 * Used for: sending messages, creating conversations
 * Limit: 60 messages per minute per IP (prevents spam)
 */
export const chatRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 messages per minute
  message: {
    error: 'You are sending messages too quickly. Please slow down.',
    retryAfter: '1 minute',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
