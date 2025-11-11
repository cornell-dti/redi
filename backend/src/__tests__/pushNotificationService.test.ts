import { Expo } from 'expo-server-sdk';
import { db } from '../../firebaseAdmin';
import {
  sendPushNotification,
  sendBulkPushNotifications,
  checkNotificationPreference,
  removePushToken,
} from '../services/pushNotificationService';

// Import the exported mocks
import * as ExpoSDK from 'expo-server-sdk';

// Mock firebaseAdmin
jest.mock('../../firebaseAdmin', () => ({
  db: {
    collection: jest.fn(),
  },
}));

// Mock expo-server-sdk with proper instance methods
const mockSendPushNotificationsAsync = jest.fn();
const mockChunkPushNotifications = jest.fn();
const mockIsExpoPushToken = jest.fn();

jest.mock('expo-server-sdk', () => {
  const actualMockSend = jest.fn();
  const actualMockChunk = jest.fn();
  const actualMockIsToken = jest.fn();

  const ExpoMock: any = jest.fn().mockImplementation(() => ({
    sendPushNotificationsAsync: actualMockSend,
    chunkPushNotifications: actualMockChunk,
  }));
  ExpoMock.isExpoPushToken = actualMockIsToken;

  return {
    Expo: ExpoMock,
    __mockSendPushNotificationsAsync: actualMockSend,
    __mockChunkPushNotifications: actualMockChunk,
    __mockIsExpoPushToken: actualMockIsToken,
  };
});

describe('Push Notification Service', () => {
  let mockCollection: jest.Mock;
  let mockWhere: jest.Mock;
  let mockLimit: jest.Mock;
  let mockGet: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDoc: jest.Mock;

  // Get references to the mocks from the module
  const mockSendPushNotificationsAsync = (ExpoSDK as any).__mockSendPushNotificationsAsync;
  const mockChunkPushNotifications = (ExpoSDK as any).__mockChunkPushNotifications;
  const mockIsExpoPushToken = (ExpoSDK as any).__mockIsExpoPushToken;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock chain
    mockUpdate = jest.fn().mockResolvedValue({});
    mockGet = jest.fn();
    mockLimit = jest.fn().mockReturnValue({ get: mockGet });
    mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
    mockDoc = jest.fn().mockReturnValue({ ref: { update: mockUpdate } });
    mockCollection = jest.fn().mockReturnValue({
      where: mockWhere,
      doc: mockDoc,
    });

    (db.collection as jest.Mock) = mockCollection;

    // Setup default mocks for Expo SDK
    mockIsExpoPushToken.mockReturnValue(true);
    mockSendPushNotificationsAsync.mockResolvedValue([{ status: 'ok' }]);
    mockChunkPushNotifications.mockImplementation((msgs: any) => [msgs]);
  });

  describe('sendPushNotification', () => {
    it('should send push notification successfully', async () => {
      const mockUserData = {
        netid: 'test123',
        pushToken: 'ExponentPushToken[test-token]',
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [
          {
            data: () => mockUserData,
            ref: { update: mockUpdate },
          },
        ],
      });

      const result = await sendPushNotification(
        'test123',
        'Test Title',
        'Test Body',
        { type: 'test' }
      );

      expect(result).toBe(true);
      expect(mockCollection).toHaveBeenCalledWith('users');
      expect(mockWhere).toHaveBeenCalledWith('netid', '==', 'test123');
      expect(mockSendPushNotificationsAsync).toHaveBeenCalled();
    });

    it('should return false if user not found', async () => {
      mockGet.mockResolvedValue({
        empty: true,
        docs: [],
      });

      const result = await sendPushNotification(
        'nonexistent',
        'Test Title',
        'Test Body'
      );

      expect(result).toBe(false);
    });

    it('should return false if user has no push token', async () => {
      mockGet.mockResolvedValue({
        empty: false,
        docs: [
          {
            data: () => ({ netid: 'test123', pushToken: null }),
            ref: { update: mockUpdate },
          },
        ],
      });

      const result = await sendPushNotification(
        'test123',
        'Test Title',
        'Test Body'
      );

      expect(result).toBe(false);
    });

    it('should remove invalid push token', async () => {
      const mockUserData = {
        netid: 'test123',
        pushToken: 'invalid-token',
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [
          {
            data: () => mockUserData,
            ref: { update: mockUpdate },
          },
        ],
      });

      mockIsExpoPushToken.mockReturnValue(false);

      const result = await sendPushNotification(
        'test123',
        'Test Title',
        'Test Body'
      );

      expect(result).toBe(false);
      expect(mockUpdate).toHaveBeenCalledWith({
        pushToken: null,
        pushTokenUpdatedAt: null,
      });
    });

    it('should handle DeviceNotRegistered error', async () => {
      const mockUserData = {
        netid: 'test123',
        pushToken: 'ExponentPushToken[test-token]',
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [
          {
            data: () => mockUserData,
            ref: { update: mockUpdate },
          },
        ],
      });

      mockSendPushNotificationsAsync.mockResolvedValue([
        {
          status: 'error',
          message: 'DeviceNotRegistered',
          details: { error: 'DeviceNotRegistered' },
        },
      ]);

      const result = await sendPushNotification(
        'test123',
        'Test Title',
        'Test Body'
      );

      expect(result).toBe(false);
      expect(mockUpdate).toHaveBeenCalledWith({
        pushToken: null,
        pushTokenUpdatedAt: null,
      });
    });
  });

  describe('sendBulkPushNotifications', () => {
    it('should send bulk notifications successfully', async () => {
      const notifications = [
        {
          netid: 'user1',
          title: 'Title 1',
          body: 'Body 1',
          data: { type: 'test' },
        },
        {
          netid: 'user2',
          title: 'Title 2',
          body: 'Body 2',
          data: { type: 'test' },
        },
      ];

      const mockUsers = [
        {
          data: () => ({
            netid: 'user1',
            pushToken: 'ExponentPushToken[token1]',
          }),
          ref: { update: mockUpdate },
        },
        {
          data: () => ({
            netid: 'user2',
            pushToken: 'ExponentPushToken[token2]',
          }),
          ref: { update: mockUpdate },
        },
      ];

      const mockWhereIn = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: mockUsers }),
      });

      mockCollection.mockReturnValue({
        where: mockWhereIn,
      });

      mockSendPushNotificationsAsync.mockResolvedValue([
        { status: 'ok' },
        { status: 'ok' },
      ]);

      const result = await sendBulkPushNotifications(notifications);

      expect(result).toBe(2);
      expect(mockWhereIn).toHaveBeenCalledWith('netid', 'in', [
        'user1',
        'user2',
      ]);
    });

    it('should skip users without push tokens', async () => {
      const notifications = [
        { netid: 'user1', title: 'Title 1', body: 'Body 1' },
        { netid: 'user2', title: 'Title 2', body: 'Body 2' },
      ];

      const mockUsers = [
        {
          data: () => ({
            netid: 'user1',
            pushToken: 'ExponentPushToken[token1]',
          }),
          ref: { update: mockUpdate },
        },
        {
          data: () => ({ netid: 'user2', pushToken: null }),
          ref: { update: mockUpdate },
        },
      ];

      const mockWhereIn = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: mockUsers }),
      });

      mockCollection.mockReturnValue({
        where: mockWhereIn,
      });

      mockSendPushNotificationsAsync.mockResolvedValue([{ status: 'ok' }]);

      const result = await sendBulkPushNotifications(notifications);

      expect(result).toBe(1);
    });

    it('should return 0 if no valid tokens found', async () => {
      const notifications = [
        { netid: 'user1', title: 'Title 1', body: 'Body 1' },
      ];

      const mockWhereIn = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: [] }),
      });

      mockCollection.mockReturnValue({
        where: mockWhereIn,
      });

      const result = await sendBulkPushNotifications(notifications);

      expect(result).toBe(0);
    });
  });

  describe('checkNotificationPreference', () => {
    it('should return true if preference is enabled', async () => {
      const mockUserData = {
        netid: 'test123',
        notificationPreferences: {
          newMessages: true,
          matchDrops: true,
          mutualNudges: true,
        },
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ data: () => mockUserData }],
      });

      const result = await checkNotificationPreference('test123', 'newMessages');

      expect(result).toBe(true);
    });

    it('should return false if preference is disabled', async () => {
      const mockUserData = {
        netid: 'test123',
        notificationPreferences: {
          newMessages: false,
          matchDrops: true,
          mutualNudges: true,
        },
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ data: () => mockUserData }],
      });

      const result = await checkNotificationPreference('test123', 'newMessages');

      expect(result).toBe(false);
    });

    it('should return true if no preferences set (default opt-out)', async () => {
      const mockUserData = {
        netid: 'test123',
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ data: () => mockUserData }],
      });

      const result = await checkNotificationPreference('test123', 'newMessages');

      expect(result).toBe(true);
    });

    it('should return true if user not found', async () => {
      mockGet.mockResolvedValue({
        empty: true,
        docs: [],
      });

      const result = await checkNotificationPreference('test123', 'newMessages');

      expect(result).toBe(true);
    });
  });

  describe('removePushToken', () => {
    it('should remove push token successfully', async () => {
      mockGet.mockResolvedValue({
        empty: false,
        docs: [
          {
            data: () => ({ netid: 'test123' }),
            ref: { update: mockUpdate },
          },
        ],
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
});
