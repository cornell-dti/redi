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
 * Limit: 100 requests per 15 minutes per IP
 */
export const authenticatedRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
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
