// Test setup file - runs before all tests

// Mock Firebase Admin SDK first
jest.mock('../../firebaseAdmin', () => {
  const mockDb = {
    collection: jest.fn(),
  };

  return {
    db: mockDb,
    bucket: {
      file: jest.fn(),
    },
  };
});

// Mock rate limiting middleware
jest.mock('../middleware/rateLimiting', () => ({
  authenticatedRateLimit: (req: any, res: any, next: any) => next(),
  unauthenticatedRateLimit: (req: any, res: any, next: any) => next(),
}));

// Suppress console output during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set test environment variables
process.env.NODE_ENV = 'test';
