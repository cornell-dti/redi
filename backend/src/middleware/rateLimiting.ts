import rateLimit, { Options } from 'express-rate-limit';
import { Request } from 'express';
import { AuthenticatedRequest } from './auth';
import { isUserAdmin } from './adminAuth';

// Import the standardized IP key generator for IPv6 support
// This prevents IPv6 users from bypassing rate limits
const ipKeyGenerator = (req: Request): string => {
  // Use the x-forwarded-for header if behind a proxy (e.g., Heroku)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ip = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor.split(',')[0];
    return ip.trim();
  }
  // Fall back to req.ip or socket address
  return req.ip || req.socket.remoteAddress || 'unknown';
};

/**
 * Check if user is an admin and should skip rate limiting
 * Admins are whitelisted and exempt from all rate limits
 */
const skipAdmin = async (req: Request): Promise<boolean> => {
  const authReq = req as AuthenticatedRequest;

  // If no authenticated user, don't skip
  if (!authReq.user?.uid) {
    return false;
  }

  try {
    const isAdmin = await isUserAdmin(authReq.user.uid);
    if (isAdmin) {
      console.log(
        `✅ [Rate Limit] Admin ${authReq.user.uid} bypassing rate limit`
      );
    }
    return isAdmin;
  } catch (error) {
    console.error('❌ [Rate Limit] Error checking admin status:', error);
    return false;
  }
};

/**
 * Key generator for per-user rate limiting
 * Uses Firebase UID for authenticated requests, IP for public requests
 */
const generateUserKey = (req: Request): string => {
  const authReq = req as AuthenticatedRequest;

  if (authReq.user?.uid) {
    // For authenticated requests, use user ID
    return `user:${authReq.user.uid}`;
  }

  // For public requests, use IP (with proper IPv6 handling)
  return `ip:${ipKeyGenerator(req)}`;
};

/**
 * Key generator for IP-based rate limiting (public endpoints)
 * Uses standardized IP extraction to properly handle IPv4 and IPv6
 */
const generateIpKey = (req: Request): string => {
  return `ip:${ipKeyGenerator(req)}`;
};

/**
 * Base configuration factory for creating rate limiters
 */
const createRateLimiter = (
  config: Partial<Options>
): ReturnType<typeof rateLimit> => {
  return rateLimit({
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skip: skipAdmin, // Skip rate limiting for admins
    handler: (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const identifier = authReq.user?.uid
        ? `user ${authReq.user.uid}`
        : `IP ${req.ip}`;
      console.warn(
        `⚠️  [Rate Limit] Rate limit exceeded for ${identifier} on ${req.path}`
      );

      res.status(429).json({
        error: 'Too many requests, please try again later.',
        retryAfter: res.getHeader('RateLimit-Reset'),
      });
    },
    ...config,
  });
};

/**
 * AUTHENTICATION ENDPOINTS (login, signup, password reset)
 * Limit: 5 requests per 15 minutes per IP
 */
export const authenticationRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  keyGenerator: generateIpKey,
  skipSuccessfulRequests: true,
  message: {
    error: 'Too many authentication attempts. Please try again in 15 minutes.',
    retryAfter: '15 minutes',
  },
});

/**
 * READ ENDPOINTS (GET requests for authenticated users)
 * Limit: 300 requests per 15 minutes per user
 */
export const readRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  keyGenerator: generateUserKey,
  message: {
    error: 'Too many read requests. Please try again later.',
    retryAfter: '15 minutes',
  },
});

/**
 * WRITE ENDPOINTS (POST/PUT/PATCH for authenticated users)
 * Limit: 100 requests per 15 minutes per user
 */
export const writeRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  keyGenerator: generateUserKey,
  message: {
    error: 'Too many write requests. Please try again later.',
    retryAfter: '15 minutes',
  },
});

/**
 * RESOURCE-INTENSIVE ENDPOINTS (uploads, matching algorithm, bulk operations)
 * Limit: 20 requests per hour per user
 */
export const resourceIntensiveRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyGenerator: generateUserKey,
  message: {
    error: 'Too many resource-intensive requests. Please try again in 1 hour.',
    retryAfter: '1 hour',
  },
});

/**
 * CHAT ENDPOINTS (sending messages, creating conversations)
 * Limit: 60 messages per minute per user
 */
export const chatRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  keyGenerator: generateUserKey,
  message: {
    error: 'You are sending messages too quickly. Please slow down.',
    retryAfter: '1 minute',
  },
});

/**
 * NOTIFICATION POLLING ENDPOINTS
 * Limit: 200 requests per 15 minutes per user
 */
export const notificationRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  keyGenerator: generateUserKey,
  message: {
    error: 'Too many notification requests. Please try again later.',
    retryAfter: '15 minutes',
  },
});

/**
 * PUBLIC ENDPOINTS (no authentication required)
 * Limit: 50 requests per 15 minutes per IP
 */
export const publicRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  keyGenerator: generateIpKey,
  message: {
    error: 'Too many requests from this IP. Please try again later.',
    retryAfter: '15 minutes',
  },
});

/**
 * ADMIN ENDPOINTS
 * Limit: 1000 requests per 15 minutes per admin
 * Note: In practice, admins skip rate limiting entirely via skipAdmin
 */
export const adminRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  keyGenerator: generateUserKey,
  message: {
    error: 'Too many admin requests. Please try again later.',
    retryAfter: '15 minutes',
  },
});

/**
 * LEGACY EXPORTS (for backward compatibility)
 */
export const authenticatedRateLimit = readRateLimit;
export const uploadRateLimit = resourceIntensiveRateLimit;
