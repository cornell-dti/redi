import { Expo } from 'expo-server-sdk';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../firebaseAdmin';
import {
  registerPushToken,
  removePushToken,
  getPushToken,
  updateNotificationPreferences,
  getNotificationPreferences,
  initializeNotificationPreferences,
} from '../services/deviceTokenService';

// Mock expo-server-sdk
jest.mock('expo-server-sdk');

//Mock FieldValue - must be done before firebase imports
const mockServerTimestamp = jest.fn(() => ({ _methodName: 'serverTimestamp' }));

// Mock firebaseAdmin
jest.mock('../../firebaseAdmin', () => ({
  db: {
    collection: jest.fn(),
  },
}));

// Mock FieldValue from firebase-admin/firestore
jest.mock('firebase-admin/firestore', () => ({
  ...jest.requireActual('firebase-admin/firestore'),
  FieldValue: {
    serverTimestamp: () => ({ _methodName: 'serverTimestamp' }),
  },
}));

describe('Device Token Service', () => {
  let mockCollection: jest.Mock;
  let mockWhere: jest.Mock;
  let mockLimit: jest.Mock;
  let mockGet: jest.Mock;
  let mockUpdate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock chain
    mockUpdate = jest.fn().mockResolvedValue({});
    mockGet = jest.fn();
    mockLimit = jest.fn().mockReturnValue({ get: mockGet });
    mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
    mockCollection = jest.fn().mockReturnValue({ where: mockWhere });

    (db.collection as jest.Mock) = mockCollection;

    // Mock Expo.isExpoPushToken
    (Expo.isExpoPushToken as unknown as jest.Mock) = jest.fn().mockReturnValue(true);
  });

  describe('registerPushToken', () => {
    it('should register a new push token successfully', async () => {
      const mockUserDoc = {
        data: () => ({
          netid: 'test123',
          pushToken: null,
        }),
        ref: { update: mockUpdate },
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [mockUserDoc],
      });

      const result = await registerPushToken(
        'test123',
        'ExponentPushToken[new-token]'
      );

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        pushToken: 'ExponentPushToken[new-token]',
        pushTokenUpdatedAt: { _methodName: 'serverTimestamp' },
      });
    });

    it('should update timestamp if token already registered', async () => {
      const mockUserDoc = {
        data: () => ({
          netid: 'test123',
          pushToken: 'ExponentPushToken[existing-token]',
        }),
        ref: { update: mockUpdate },
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [mockUserDoc],
      });

      const result = await registerPushToken(
        'test123',
        'ExponentPushToken[existing-token]'
      );

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        pushTokenUpdatedAt: { _methodName: 'serverTimestamp' },
      });
    });

    it('should throw error if token format is invalid', async () => {
      (Expo.isExpoPushToken as unknown as jest.Mock).mockReturnValue(false);

      await expect(
        registerPushToken('test123', 'invalid-token')
      ).rejects.toThrow('Invalid push token format');
    });

    it('should throw error if user not found', async () => {
      mockGet.mockResolvedValue({
        empty: true,
        docs: [],
      });

      await expect(
        registerPushToken('nonexistent', 'ExponentPushToken[token]')
      ).rejects.toThrow('User not found');
    });

    it('should handle database errors', async () => {
      mockGet.mockRejectedValue(new Error('Database error'));

      await expect(
        registerPushToken('test123', 'ExponentPushToken[token]')
      ).rejects.toThrow();
    });
  });

  describe('removePushToken', () => {
    it('should remove push token successfully', async () => {
      const mockUserDoc = {
        data: () => ({ netid: 'test123' }),
        ref: { update: mockUpdate },
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [mockUserDoc],
      });

      const result = await removePushToken('test123');

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        pushToken: null,
        pushTokenUpdatedAt: null,
      });
    });

    it('should return false if user not found', async () => {
      mockGet.mockResolvedValue({
        empty: true,
        docs: [],
      });

      const result = await removePushToken('nonexistent');

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockGet.mockRejectedValue(new Error('Database error'));

      const result = await removePushToken('test123');

      expect(result).toBe(false);
    });
  });

  describe('getPushToken', () => {
    it('should return push token if exists', async () => {
      mockGet.mockResolvedValue({
        empty: false,
        docs: [
          {
            data: () => ({
              netid: 'test123',
              pushToken: 'ExponentPushToken[test-token]',
            }),
          },
        ],
      });

      const result = await getPushToken('test123');

      expect(result).toBe('ExponentPushToken[test-token]');
    });

    it('should return null if user has no token', async () => {
      mockGet.mockResolvedValue({
        empty: false,
        docs: [
          {
            data: () => ({
              netid: 'test123',
              pushToken: null,
            }),
          },
        ],
      });

      const result = await getPushToken('test123');

      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      mockGet.mockResolvedValue({
        empty: true,
        docs: [],
      });

      const result = await getPushToken('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockGet.mockRejectedValue(new Error('Database error'));

      const result = await getPushToken('test123');

      expect(result).toBeNull();
    });
  });

  describe('updateNotificationPreferences', () => {
    it('should update notification preferences successfully', async () => {
      const mockUserDoc = {
        data: () => ({
          netid: 'test123',
          notificationPreferences: {
            newMessages: true,
            matchDrops: true,
            mutualNudges: true,
          },
        }),
        ref: { update: mockUpdate },
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [mockUserDoc],
      });

      const result = await updateNotificationPreferences('test123', {
        newMessages: false,
      });

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        notificationPreferences: {
          newMessages: false,
          matchDrops: true,
          mutualNudges: true,
        },
      });
    });

    it('should create preferences if none exist', async () => {
      const mockUserDoc = {
        data: () => ({
          netid: 'test123',
        }),
        ref: { update: mockUpdate },
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [mockUserDoc],
      });

      const result = await updateNotificationPreferences('test123', {
        newMessages: false,
        matchDrops: true,
        mutualNudges: true,
      });

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        notificationPreferences: {
          newMessages: false,
          matchDrops: true,
          mutualNudges: true,
        },
      });
    });

    it('should merge with existing preferences', async () => {
      const mockUserDoc = {
        data: () => ({
          netid: 'test123',
          notificationPreferences: {
            newMessages: true,
            matchDrops: false,
            mutualNudges: true,
          },
        }),
        ref: { update: mockUpdate },
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [mockUserDoc],
      });

      const result = await updateNotificationPreferences('test123', {
        matchDrops: true,
      });

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        notificationPreferences: {
          newMessages: true,
          matchDrops: true,
          mutualNudges: true,
        },
      });
    });

    it('should throw error if user not found', async () => {
      mockGet.mockResolvedValue({
        empty: true,
        docs: [],
      });

      await expect(
        updateNotificationPreferences('nonexistent', { newMessages: false })
      ).rejects.toThrow('User not found');
    });
  });

  describe('getNotificationPreferences', () => {
    it('should return preferences if they exist', async () => {
      mockGet.mockResolvedValue({
        empty: false,
        docs: [
          {
            data: () => ({
              netid: 'test123',
              notificationPreferences: {
                newMessages: false,
                matchDrops: true,
                mutualNudges: true,
              },
            }),
          },
        ],
      });

      const result = await getNotificationPreferences('test123');

      expect(result).toEqual({
        newMessages: false,
        matchDrops: true,
        mutualNudges: true,
      });
    });

    it('should return defaults if no preferences set', async () => {
      mockGet.mockResolvedValue({
        empty: false,
        docs: [
          {
            data: () => ({
              netid: 'test123',
            }),
          },
        ],
      });

      const result = await getNotificationPreferences('test123');

      expect(result).toEqual({
        newMessages: true,
        matchDrops: true,
        mutualNudges: true,
      });
    });

    it('should return defaults if user not found', async () => {
      mockGet.mockResolvedValue({
        empty: true,
        docs: [],
      });

      const result = await getNotificationPreferences('nonexistent');

      expect(result).toEqual({
        newMessages: true,
        matchDrops: true,
        mutualNudges: true,
      });
    });

    it('should return defaults on error', async () => {
      mockGet.mockRejectedValue(new Error('Database error'));

      const result = await getNotificationPreferences('test123');

      expect(result).toEqual({
        newMessages: true,
        matchDrops: true,
        mutualNudges: true,
      });
    });
  });

  describe('initializeNotificationPreferences', () => {
    it('should initialize preferences if none exist', async () => {
      const mockUserDoc = {
        data: () => ({
          netid: 'test123',
        }),
        ref: { update: mockUpdate },
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [mockUserDoc],
      });

      const result = await initializeNotificationPreferences('test123');

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        notificationPreferences: {
          newMessages: true,
          matchDrops: true,
          mutualNudges: true,
        },
      });
    });

    it('should not initialize if preferences already exist', async () => {
      const mockUserDoc = {
        data: () => ({
          netid: 'test123',
          notificationPreferences: {
            newMessages: false,
            matchDrops: true,
            mutualNudges: true,
          },
        }),
        ref: { update: mockUpdate },
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [mockUserDoc],
      });

      const result = await initializeNotificationPreferences('test123');

      expect(result).toBe(true);
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should return false if user not found', async () => {
      mockGet.mockResolvedValue({
        empty: true,
        docs: [],
      });

      const result = await initializeNotificationPreferences('nonexistent');

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockGet.mockRejectedValue(new Error('Database error'));

      const result = await initializeNotificationPreferences('test123');

      expect(result).toBe(false);
    });
  });
});
