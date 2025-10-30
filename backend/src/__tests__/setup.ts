// Test setup file - runs before all tests

// Mock Firebase Admin SDK first - must be before any imports that use it
jest.mock('../../firebaseAdmin', () => {
  const mockDb = {
    collection: jest.fn(),
  };

  return {
    db: mockDb,
    bucket: {
      file: jest.fn(),
    },
    admin: {
      auth: jest.fn(() => ({
        verifyIdToken: jest.fn(),
        getUser: jest.fn(),
      })),
    },
  };
});

// Mock firebase-admin module
jest.mock('firebase-admin', () => ({
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
    getUser: jest.fn(),
    setCustomUserClaims: jest.fn(),
  })),
  firestore: {
    FieldValue: {
      serverTimestamp: jest.fn(() => new Date()),
      arrayUnion: jest.fn((val) => val),
      arrayRemove: jest.fn((val) => val),
      increment: jest.fn((val) => val),
      delete: jest.fn(),
    },
  },
}));

// Mock rate limiting middleware - mock all rate limiters
jest.mock('../middleware/rateLimiting', () => ({
  publicRateLimit: (req: any, res: any, next: any) => next(),
  authenticatedRateLimit: (req: any, res: any, next: any) => next(),
  adminRateLimit: (req: any, res: any, next: any) => next(),
  authenticationRateLimit: (req: any, res: any, next: any) => next(),
  notificationRateLimit: (req: any, res: any, next: any) => next(),
  uploadRateLimit: (req: any, res: any, next: any) => next(),
  chatRateLimit: (req: any, res: any, next: any) => next(),
  unauthenticatedRateLimit: (req: any, res: any, next: any) => next(), // Legacy, keeping for backward compatibility
}));

// Suppress console output during tests (keeps test output clean)
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

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Clean up after each test
afterEach(() => {
  jest.restoreAllMocks();
});
