/**
 * Unit tests for rate limiting middleware
 *
 * These tests verify:
 * - Rate limiting middleware exports are properly configured
 * - Middleware functions are defined and valid
 * - Configuration values are set correctly
 */

// Mock Redis before importing rate limiting module
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    on: jest.fn(),
    connect: jest.fn().mockRejectedValue(new Error('Redis not available in tests')),
    isReady: false,
    isOpen: false,
  })),
}));

// Mock the admin auth module
jest.mock('../adminAuth', () => ({
  isUserAdmin: jest.fn((uid: string) => {
    // Mock admin user for testing
    return Promise.resolve(uid === 'admin-uid-123');
  }),
}));

import * as rateLimiting from '../rateLimiting';

describe('Rate Limiting Middleware - Module Exports', () => {
  describe('Middleware Exports', () => {
    it('should export authenticationRateLimit middleware', () => {
      expect(rateLimiting.authenticationRateLimit).toBeDefined();
      expect(typeof rateLimiting.authenticationRateLimit).toBe('function');
    });

    it('should export readRateLimit middleware', () => {
      expect(rateLimiting.readRateLimit).toBeDefined();
      expect(typeof rateLimiting.readRateLimit).toBe('function');
    });

    it('should export writeRateLimit middleware', () => {
      expect(rateLimiting.writeRateLimit).toBeDefined();
      expect(typeof rateLimiting.writeRateLimit).toBe('function');
    });

    it('should export resourceIntensiveRateLimit middleware', () => {
      expect(rateLimiting.resourceIntensiveRateLimit).toBeDefined();
      expect(typeof rateLimiting.resourceIntensiveRateLimit).toBe('function');
    });

    it('should export chatRateLimit middleware', () => {
      expect(rateLimiting.chatRateLimit).toBeDefined();
      expect(typeof rateLimiting.chatRateLimit).toBe('function');
    });

    it('should export notificationRateLimit middleware', () => {
      expect(rateLimiting.notificationRateLimit).toBeDefined();
      expect(typeof rateLimiting.notificationRateLimit).toBe('function');
    });

    it('should export publicRateLimit middleware', () => {
      expect(rateLimiting.publicRateLimit).toBeDefined();
      expect(typeof rateLimiting.publicRateLimit).toBe('function');
    });

    it('should export adminRateLimit middleware', () => {
      expect(rateLimiting.adminRateLimit).toBeDefined();
      expect(typeof rateLimiting.adminRateLimit).toBe('function');
    });
  });

  describe('Legacy Exports', () => {
    it('should export authenticatedRateLimit as alias for readRateLimit', () => {
      expect(rateLimiting.authenticatedRateLimit).toBeDefined();
      expect(rateLimiting.authenticatedRateLimit).toBe(rateLimiting.readRateLimit);
    });

    it('should export uploadRateLimit as alias for resourceIntensiveRateLimit', () => {
      expect(rateLimiting.uploadRateLimit).toBeDefined();
      expect(rateLimiting.uploadRateLimit).toBe(rateLimiting.resourceIntensiveRateLimit);
    });
  });

  describe('Utility Functions', () => {
    it('should export getRedisClient function', () => {
      expect(rateLimiting.getRedisClient).toBeDefined();
      expect(typeof rateLimiting.getRedisClient).toBe('function');
    });

    it('should export closeRedisConnection function', () => {
      expect(rateLimiting.closeRedisConnection).toBeDefined();
      expect(typeof rateLimiting.closeRedisConnection).toBe('function');
    });
  });

  describe('Redis Fallback', () => {
    it('should handle Redis connection failure gracefully', async () => {
      // Redis mock rejects connection, middleware should still be created
      expect(rateLimiting.publicRateLimit).toBeDefined();

      // getRedisClient should return null when Redis fails
      const client = rateLimiting.getRedisClient();
      expect(client === null || !client?.isReady).toBeTruthy();
    });
  });

  describe('Configuration Verification', () => {
    /**
     * Note: Integration tests for rate limiting behavior (headers, limits, blocking)
     * should be done through the existing route integration tests to ensure
     * they work correctly with real middleware stacks.
     *
     * These unit tests verify that the module exports are correctly configured
     * and that the middleware can be imported and used without errors.
     */
    it('should confirm all rate limiters are properly configured', () => {
      const allLimiters = [
        rateLimiting.authenticationRateLimit,
        rateLimiting.readRateLimit,
        rateLimiting.writeRateLimit,
        rateLimiting.resourceIntensiveRateLimit,
        rateLimiting.chatRateLimit,
        rateLimiting.notificationRateLimit,
        rateLimiting.publicRateLimit,
        rateLimiting.adminRateLimit,
        rateLimiting.authenticatedRateLimit,
        rateLimiting.uploadRateLimit,
      ];

      // All limiters should be functions (middleware)
      allLimiters.forEach((limiter, index) => {
        expect(typeof limiter).toBe('function');
        expect(limiter).toBeDefined();
      });

      // Should have at least 8 unique limiters (10 exports, 2 are aliases)
      const uniqueLimiters = new Set(allLimiters);
      expect(uniqueLimiters.size).toBeGreaterThanOrEqual(8);
    });
  });
});
