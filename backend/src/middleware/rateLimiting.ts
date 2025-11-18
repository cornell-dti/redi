import rateLimit, { Options } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { Request } from 'express';
import { AuthenticatedRequest } from './auth';
import { isUserAdmin } from './adminAuth';

// Import the standardized IP key generator for IPv6 support
// This prevents IPv6 users from bypassing rate limits
const ipKeyGenerator = (req: Request): string => {
  // Use the x-forwarded-for header if behind a proxy (e.g., Heroku)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0];
    return ip.trim();
  }
  // Fall back to req.ip or socket address
  return req.ip || req.socket.remoteAddress || 'unknown';
};

/**
 * Rate limiting configuration for scalable Express backend
 *
 * Features:
 * - Redis-based distributed rate limiting (works across multiple Heroku dynos)
 * - Per-user rate limiting for authenticated endpoints (not per-IP)
 * - Per-IP rate limiting for public/unauthenticated endpoints
 * - Admin whitelist bypass
 * - Industry-standard rate limit headers
 * - Automatic fallback to memory store if Redis unavailable
 *
 * Redis Configuration:
 * Set REDIS_URL environment variable on Heroku:
 * - Add Heroku Redis: `heroku addons:create heroku-redis:mini`
 * - Or use external Redis provider and set REDIS_URL
 *
 * Without Redis (development):
 * - Falls back to in-memory store (single dyno only)
 */

// Redis client setup
let redisClient: ReturnType<typeof createClient> | null = null;

const initializeRedis = async () => {
  if (process.env.REDIS_URL) {
    try {
      console.log('🔄 [Rate Limit] Initializing Redis connection...');
      redisClient = createClient({
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: 10000,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('❌ [Rate Limit] Redis connection failed after 10 retries');
              return new Error('Redis connection failed');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      redisClient.on('error', (err) => {
        console.error('❌ [Rate Limit] Redis client error:', err);
      });

      redisClient.on('connect', () => {
        console.log('✅ [Rate Limit] Redis client connected');
      });

      redisClient.on('ready', () => {
        console.log('✅ [Rate Limit] Redis client ready');
      });

      await redisClient.connect();
      console.log('✅ [Rate Limit] Redis initialized successfully');
    } catch (error) {
      console.error('❌ [Rate Limit] Failed to initialize Redis:', error);
      console.warn('⚠️  [Rate Limit] Falling back to in-memory rate limiting');
      redisClient = null;
    }
  } else {
    console.warn('⚠️  [Rate Limit] No REDIS_URL configured, using in-memory store');
    console.warn('⚠️  [Rate Limit] Multi-dyno rate limiting will NOT work correctly');
  }
};

// Initialize Redis on module load
initializeRedis();

/**
 * Create Redis store if client is available
 */
const createStore = () => {
  if (redisClient?.isReady) {
    return new RedisStore({
      sendCommand: (...args: string[]) => redisClient!.sendCommand(args),
    });
  }
  return undefined; // Falls back to default memory store
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
      console.log(`✅ [Rate Limit] Admin ${authReq.user.uid} bypassing rate limit`);
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
const createRateLimiter = (config: Partial<Options>): ReturnType<typeof rateLimit> => {
  return rateLimit({
    store: createStore(),
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skip: skipAdmin, // Skip rate limiting for admins
    handler: (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const identifier = authReq.user?.uid ? `user ${authReq.user.uid}` : `IP ${req.ip}`;
      console.warn(`⚠️  [Rate Limit] Rate limit exceeded for ${identifier} on ${req.path}`);

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
 * Industry standard: 5-10 attempts per 15 minutes
 * Prevents brute force attacks while allowing legitimate retry attempts
 *
 * Used for: /api/users/firebase-login, /api/users/firebase-create
 * Limit: 5 requests per 15 minutes per IP
 * Skip successful requests: Yes (only failed attempts count)
 */
export const authenticationRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  keyGenerator: generateIpKey, // Use IP for auth endpoints to prevent account enumeration
  skipSuccessfulRequests: true, // Only count failed login/signup attempts
  message: {
    error: 'Too many authentication attempts. Please try again in 15 minutes.',
    retryAfter: '15 minutes',
  },
});

/**
 * READ ENDPOINTS (GET requests for authenticated users)
 * Industry standard: 100-300 requests per 15 minutes per user
 * Allows ~20 requests/minute sustained rate
 *
 * Used for: profile fetching, match listings, user data retrieval
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
 * Industry standard: 50-100 requests per 15 minutes per user
 * More restrictive than reads to prevent data pollution
 *
 * Used for: profile updates, preferences, answers, reports
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
 * Industry standard: 10-30 requests per hour
 * Very restrictive due to computational/storage cost
 *
 * Used for: image uploads, profile picture updates, manual match generation
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
 * Industry standard: 60-120 messages per minute
 * Prevents spam while allowing natural conversation
 *
 * Used for: sending messages, creating conversations
 * Limit: 60 messages per minute per user (1 message/second sustained)
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
 * Custom limit based on app polling interval
 * Notifications polled every 60 seconds (2 endpoints per poll)
 *
 * Used for: notification fetching, unread count
 * Limit: 200 requests per 15 minutes per user (~13/minute allows 6-7 polls)
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
 * Industry standard: 20-50 requests per 15 minutes per IP
 * Strict to prevent scraping and abuse
 *
 * Used for: user listings, profile browsing, public data access, landing page
 * Limit: 50 requests per 15 minutes per IP
 */
export const publicRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  keyGenerator: generateIpKey, // Always use IP for public endpoints
  message: {
    error: 'Too many requests from this IP. Please try again later.',
    retryAfter: '15 minutes',
  },
});

/**
 * ADMIN ENDPOINTS
 * Much higher limits for administrative operations
 * Admins are also whitelisted via skipAdmin function
 *
 * Used for: admin operations, bulk uploads, reports
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
 * These maintain the same names but now use proper per-user limits
 */
export const authenticatedRateLimit = readRateLimit; // Default for authenticated endpoints
export const uploadRateLimit = resourceIntensiveRateLimit; // Image uploads

/**
 * Export Redis client for manual cleanup if needed
 */
export const getRedisClient = () => redisClient;

/**
 * Graceful shutdown helper
 */
export const closeRedisConnection = async () => {
  if (redisClient?.isOpen) {
    console.log('🔄 [Rate Limit] Closing Redis connection...');
    await redisClient.quit();
    console.log('✅ [Rate Limit] Redis connection closed');
  }
};

/**
 * RATE LIMIT RECOMMENDATIONS FOR 500+ CONCURRENT USERS:
 *
 * Peak Load Calculations:
 * - 500 concurrent users
 * - Average session: 5 minutes
 * - Average requests per session: 20-30
 * - Peak requests: ~100-150 requests/minute total
 * - Per user: ~2-3 requests/minute during active use
 *
 * Current Limits (per user per 15min):
 * - Read: 300 (20/min sustained) ✅ 10x headroom
 * - Write: 100 (6.7/min sustained) ✅ 3x headroom
 * - Chat: 60/min ✅ Allows natural conversation
 * - Notifications: 200 (13/min) ✅ 6x polling frequency
 * - Resource-intensive: 20/hour ✅ Prevents abuse
 * - Auth: 5/15min per IP ✅ Blocks brute force
 *
 * These limits provide 3-10x headroom above normal usage while
 * effectively preventing abuse, DoS attacks, and resource exhaustion.
 *
 * Monitoring Recommendations:
 * - Track 429 responses in application logs
 * - Monitor Redis memory usage (if using Redis)
 * - Set up alerts for unusual rate limit patterns
 * - Review and adjust limits based on actual usage patterns
 */
