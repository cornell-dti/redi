import request from 'supertest';
import express from 'express';
import pushTokensRouter from '../pushTokens';
import * as deviceTokenService from '../../services/deviceTokenService';

// Mock the services
jest.mock('../../services/deviceTokenService');

// Mock Firebase Admin
const mockVerifyIdToken = jest.fn();
const mockAuth = {
  verifyIdToken: mockVerifyIdToken,
};

jest.mock('firebase-admin', () => ({
  __esModule: true,
  default: {
    auth: () => mockAuth,
  },
  auth: () => mockAuth,
}));

// Create express app for testing
const app = express();
app.use(express.json());

// Mock db as app.locals.db
app.locals.db = {
  collection: jest.fn().mockReturnValue({
    where: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        get: jest.fn(),
      }),
    }),
  }),
};

app.use(pushTokensRouter);

// Mock user data
const mockUser = {
  uid: 'test-firebase-uid-123',
  email: 'test@cornell.edu',
};

const mockUserData = {
  netid: 'test123',
  email: 'test@cornell.edu',
  firebaseUid: 'test-firebase-uid-123',
};

describe('Push Tokens Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyIdToken.mockResolvedValue(mockUser);
  });

  describe('POST /api/users/push-token', () => {
    it('should register push token successfully', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        empty: false,
        docs: [{ data: () => mockUserData }],
      });

      app.locals.db.collection = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            get: mockGet,
          }),
        }),
      });

      (deviceTokenService.registerPushToken as jest.Mock).mockResolvedValue(
        true
      );

      const response = await request(app)
        .post('/api/users/push-token')
        .set('Authorization', 'Bearer valid-token')
        .send({ pushToken: 'ExponentPushToken[test-token]' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Push token registered successfully',
      });

      expect(deviceTokenService.registerPushToken).toHaveBeenCalledWith(
        'test123',
        'ExponentPushToken[test-token]'
      );
    });

    it('should return 400 if pushToken is missing', async () => {
      const response = await request(app)
        .post('/api/users/push-token')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'pushToken is required');
    });

    it('should return 400 if pushToken is invalid format', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        empty: false,
        docs: [{ data: () => mockUserData }],
      });

      app.locals.db.collection = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            get: mockGet,
          }),
        }),
      });

      (deviceTokenService.registerPushToken as jest.Mock).mockRejectedValue(
        new Error('Invalid push token format')
      );

      const response = await request(app)
        .post('/api/users/push-token')
        .set('Authorization', 'Bearer valid-token')
        .send({ pushToken: 'invalid-token' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid push token format');
    });

    it('should return 404 if user not found', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        empty: true,
        docs: [],
      });

      app.locals.db.collection = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            get: mockGet,
          }),
        }),
      });

      const response = await request(app)
        .post('/api/users/push-token')
        .set('Authorization', 'Bearer valid-token')
        .send({ pushToken: 'ExponentPushToken[test-token]' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/users/push-token')
        .send({ pushToken: 'ExponentPushToken[test-token]' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/users/push-token', () => {
    it('should remove push token successfully', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        empty: false,
        docs: [{ data: () => mockUserData }],
      });

      app.locals.db.collection = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            get: mockGet,
          }),
        }),
      });

      (deviceTokenService.removePushToken as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/users/push-token')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Push token removed successfully',
      });

      expect(deviceTokenService.removePushToken).toHaveBeenCalledWith('test123');
    });

    it('should return 404 if user not found', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        empty: true,
        docs: [],
      });

      app.locals.db.collection = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            get: mockGet,
          }),
        }),
      });

      const response = await request(app)
        .delete('/api/users/push-token')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .delete('/api/users/push-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/users/notification-preferences', () => {
    it('should return notification preferences', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        empty: false,
        docs: [{ data: () => mockUserData }],
      });

      app.locals.db.collection = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            get: mockGet,
          }),
        }),
      });

      const mockPreferences = {
        newMessages: true,
        matchDrops: false,
        mutualNudges: true,
      };

      (
        deviceTokenService.getNotificationPreferences as jest.Mock
      ).mockResolvedValue(mockPreferences);

      const response = await request(app)
        .get('/api/users/notification-preferences')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockPreferences);
      expect(
        deviceTokenService.getNotificationPreferences
      ).toHaveBeenCalledWith('test123');
    });

    it('should return 404 if user not found', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        empty: true,
        docs: [],
      });

      app.locals.db.collection = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            get: mockGet,
          }),
        }),
      });

      const response = await request(app)
        .get('/api/users/notification-preferences')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/users/notification-preferences')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/users/notification-preferences', () => {
    it('should update notification preferences successfully', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        empty: false,
        docs: [{ data: () => mockUserData }],
      });

      app.locals.db.collection = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            get: mockGet,
          }),
        }),
      });

      const updatedPreferences = {
        newMessages: false,
        matchDrops: true,
        mutualNudges: true,
      };

      (
        deviceTokenService.updateNotificationPreferences as jest.Mock
      ).mockResolvedValue(true);
      (
        deviceTokenService.getNotificationPreferences as jest.Mock
      ).mockResolvedValue(updatedPreferences);

      const response = await request(app)
        .put('/api/users/notification-preferences')
        .set('Authorization', 'Bearer valid-token')
        .send({ newMessages: false })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Notification preferences updated successfully',
        preferences: updatedPreferences,
      });

      expect(
        deviceTokenService.updateNotificationPreferences
      ).toHaveBeenCalledWith('test123', { newMessages: false });
    });

    it('should update multiple preferences at once', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        empty: false,
        docs: [{ data: () => mockUserData }],
      });

      app.locals.db.collection = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            get: mockGet,
          }),
        }),
      });

      const updatedPreferences = {
        newMessages: false,
        matchDrops: false,
        mutualNudges: true,
      };

      (
        deviceTokenService.updateNotificationPreferences as jest.Mock
      ).mockResolvedValue(true);
      (
        deviceTokenService.getNotificationPreferences as jest.Mock
      ).mockResolvedValue(updatedPreferences);

      const response = await request(app)
        .put('/api/users/notification-preferences')
        .set('Authorization', 'Bearer valid-token')
        .send({ newMessages: false, matchDrops: false })
        .expect(200);

      expect(
        deviceTokenService.updateNotificationPreferences
      ).toHaveBeenCalledWith('test123', {
        newMessages: false,
        matchDrops: false,
      });
    });

    it('should return 400 if no preferences provided', async () => {
      const response = await request(app)
        .put('/api/users/notification-preferences')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty(
        'error',
        'At least one notification preference must be provided'
      );
    });

    it('should return 400 if preference values are not boolean', async () => {
      const response = await request(app)
        .put('/api/users/notification-preferences')
        .set('Authorization', 'Bearer valid-token')
        .send({ newMessages: 'yes' })
        .expect(400);

      expect(response.body).toHaveProperty(
        'error',
        'Notification preferences must be boolean values'
      );
    });

    it('should return 404 if user not found', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        empty: true,
        docs: [],
      });

      app.locals.db.collection = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            get: mockGet,
          }),
        }),
      });

      const response = await request(app)
        .put('/api/users/notification-preferences')
        .set('Authorization', 'Bearer valid-token')
        .send({ newMessages: false })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .put('/api/users/notification-preferences')
        .send({ newMessages: false })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
