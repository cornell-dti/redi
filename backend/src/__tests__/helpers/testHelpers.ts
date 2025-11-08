/**
 * Test helper utilities
 * Provides common utilities for setting up tests, mocking, and assertions
 */

import request from 'supertest';
import express from 'express';
import admin from 'firebase-admin';
import { db } from '../../../firebaseAdmin';
import { createMockDecodedToken, createMockAdminToken } from './factories';

/**
 * Mock Firebase Admin Auth for authenticated requests
 * Returns a function that can be used to mock verifyIdToken
 */
export const mockFirebaseAuth = (userOverrides: any = {}) => {
  const mockAuth = {
    verifyIdToken: jest
      .fn()
      .mockResolvedValue(createMockDecodedToken(userOverrides)),
    getUser: jest.fn().mockResolvedValue({
      uid: userOverrides.uid || 'firebase-uid-123',
      email: userOverrides.email || 'test@cornell.edu',
      customClaims: userOverrides.customClaims || {},
    }),
  };

  // Mock admin.auth() to return our mock
  (admin.auth as jest.Mock) = jest.fn(() => mockAuth);

  return mockAuth;
};

/**
 * Mock Firebase Admin Auth for admin requests
 */
export const mockFirebaseAdminAuth = (adminOverrides: any = {}) => {
  const mockAuth = {
    verifyIdToken: jest
      .fn()
      .mockResolvedValue(createMockAdminToken(adminOverrides)),
    getUser: jest.fn().mockResolvedValue({
      uid: adminOverrides.uid || 'admin-uid-123',
      email: adminOverrides.email || 'admin@cornell.edu',
      customClaims: { admin: true, ...(adminOverrides.customClaims || {}) },
    }),
  };

  (admin.auth as jest.Mock) = jest.fn(() => mockAuth);

  return mockAuth;
};

/**
 * Create a valid JWT token string for testing (not a real token)
 */
export const createMockToken = (
  tokenType: 'user' | 'admin' = 'user'
): string => {
  return `mock-${tokenType}-token-${Date.now()}`;
};

/**
 * Create authorization header for authenticated requests
 */
export const createAuthHeader = (tokenType: 'user' | 'admin' = 'user') => {
  return {
    authorization: `Bearer ${createMockToken(tokenType)}`,
  };
};

/**
 * Helper to make authenticated GET request
 */
export const authenticatedGet = (
  app: express.Application,
  url: string,
  tokenType: 'user' | 'admin' = 'user'
) => {
  return request(app).get(url).set(createAuthHeader(tokenType));
};

/**
 * Helper to make authenticated POST request
 */
export const authenticatedPost = (
  app: express.Application,
  url: string,
  body: any,
  tokenType: 'user' | 'admin' = 'user'
) => {
  return request(app).post(url).set(createAuthHeader(tokenType)).send(body);
};

/**
 * Helper to make authenticated PATCH request
 */
export const authenticatedPatch = (
  app: express.Application,
  url: string,
  body: any,
  tokenType: 'user' | 'admin' = 'user'
) => {
  return request(app).patch(url).set(createAuthHeader(tokenType)).send(body);
};

/**
 * Helper to make authenticated DELETE request
 */
export const authenticatedDelete = (
  app: express.Application,
  url: string,
  tokenType: 'user' | 'admin' = 'user'
) => {
  return request(app).delete(url).set(createAuthHeader(tokenType));
};

/**
 * Helper to make unauthenticated request (no auth header)
 */
export const unauthenticatedGet = (app: express.Application, url: string) => {
  return request(app).get(url);
};

export const unauthenticatedPost = (
  app: express.Application,
  url: string,
  body: any
) => {
  return request(app).post(url).send(body);
};

/**
 * Wait for a specified amount of time (for testing time-based logic)
 */
export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock time to advance forward (useful for testing spam prevention)
 */
export const mockDateNow = (date: Date) => {
  jest.spyOn(global.Date, 'now').mockReturnValue(date.getTime());
};

/**
 * Restore original Date.now
 */
export const restoreDateNow = () => {
  jest.spyOn(global.Date, 'now').mockRestore();
};

/**
 * Clean up all mocks after a test
 */
export const cleanupMocks = () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
};

/**
 * Validate ISO date string format
 */
export const isValidISODate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Assert that response contains expected report fields
 */
export const assertReportResponse = (report: any) => {
  expect(report).toHaveProperty('id');
  expect(report).toHaveProperty('reporterNetid');
  expect(report).toHaveProperty('reportedNetid');
  expect(report).toHaveProperty('reason');
  expect(report).toHaveProperty('description');
  expect(report).toHaveProperty('status');
  expect(report).toHaveProperty('createdAt');
  expect(isValidISODate(report.createdAt)).toBe(true);
};

/**
 * Assert that response contains expected block fields
 */
export const assertBlockResponse = (block: any) => {
  expect(block).toHaveProperty('blockerNetid');
  expect(block).toHaveProperty('blockedNetid');
  expect(block).toHaveProperty('createdAt');
  expect(isValidISODate(block.createdAt)).toBe(true);
};

/**
 * Create a simple Express app for testing routes
 */
export const createTestApp = (router: express.Router): express.Application => {
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
};
