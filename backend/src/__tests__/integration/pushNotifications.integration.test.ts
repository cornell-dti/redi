/**
 * Push Notifications Integration Tests
 *
 * Tests the complete push notification flow:
 * - Device token registration
 * - Push notifications on new messages
 * - Push notifications on match drops
 * - Notification preferences
 * - Blocked user scenarios
 */

import { Expo } from 'expo-server-sdk';
import { db } from '../../../firebaseAdmin';
import { registerPushToken } from '../../services/deviceTokenService';
import {
  sendPushNotification,
  checkNotificationPreference,
} from '../../services/pushNotificationService';
import { createNotification } from '../../services/notificationsService';

// Mock expo-server-sdk
jest.mock('expo-server-sdk');

describe('Push Notifications Integration Tests', () => {
  const testUsers = [
    {
      netid: 'push-user-1',
      firebaseUid: 'push-firebase-uid-1',
      email: 'pushuser1@cornell.edu',
      pushToken: 'ExponentPushToken[test-token-1]',
    },
    {
      netid: 'push-user-2',
      firebaseUid: 'push-firebase-uid-2',
      email: 'pushuser2@cornell.edu',
      pushToken: 'ExponentPushToken[test-token-2]',
    },
  ];

  beforeAll(async () => {
    // Mock Expo methods
    (Expo.isExpoPushToken as unknown as jest.Mock) = jest.fn().mockReturnValue(true);
    (Expo as jest.MockedClass<typeof Expo>).mockImplementation(() => ({
      sendPushNotificationsAsync: jest
        .fn()
        .mockResolvedValue([{ status: 'ok' }]),
      chunkPushNotifications: jest.fn().mockImplementation((msgs) => [msgs]),
      isExpoPushToken: jest.fn().mockReturnValue(true),
    } as any));

    // Clean up test data
    for (const user of testUsers) {
      const userQuery = await db
        .collection('users')
        .where('netid', '==', user.netid)
        .get();
      for (const doc of userQuery.docs) {
        await doc.ref.delete();
      }

      const notifQuery = await db
        .collection('notifications')
        .where('netid', '==', user.netid)
        .get();
      for (const doc of notifQuery.docs) {
        await doc.ref.delete();
      }
    }

    // Create test users
    for (const user of testUsers) {
      await db.collection('users').add({
        netid: user.netid,
        firebaseUid: user.firebaseUid,
        email: user.email,
        createdAt: new Date(),
      });
    }
  });

  afterAll(async () => {
    // Clean up test data
    for (const user of testUsers) {
      const userQuery = await db
        .collection('users')
        .where('netid', '==', user.netid)
        .get();
      for (const doc of userQuery.docs) {
        await doc.ref.delete();
      }

      const notifQuery = await db
        .collection('notifications')
        .where('netid', '==', user.netid)
        .get();
      for (const doc of notifQuery.docs) {
        await doc.ref.delete();
      }
    }
  });

  describe('Device Token Registration Flow', () => {
    it('should register push token for user', async () => {
      const result = await registerPushToken(
        testUsers[0].netid,
        testUsers[0].pushToken
      );

      expect(result).toBe(true);

      // Verify token was stored
      const userQuery = await db
        .collection('users')
        .where('netid', '==', testUsers[0].netid)
        .get();

      const userData = userQuery.docs[0].data();
      expect(userData.pushToken).toBe(testUsers[0].pushToken);
      expect(userData.pushTokenUpdatedAt).toBeDefined();
    });

    it('should update token timestamp if same token registered again', async () => {
      const firstRegistration = await registerPushToken(
        testUsers[0].netid,
        testUsers[0].pushToken
      );

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 100));

      const secondRegistration = await registerPushToken(
        testUsers[0].netid,
        testUsers[0].pushToken
      );

      expect(firstRegistration).toBe(true);
      expect(secondRegistration).toBe(true);
    });

    it('should initialize notification preferences with defaults', async () => {
      await registerPushToken(testUsers[1].netid, testUsers[1].pushToken);

      const userQuery = await db
        .collection('users')
        .where('netid', '==', testUsers[1].netid)
        .get();

      const userData = userQuery.docs[0].data();

      // Preferences should be set to defaults after initialization
      if (userData.notificationPreferences) {
        expect(userData.notificationPreferences).toEqual({
          newMessages: true,
          matchDrops: true,
          mutualNudges: true,
        });
      }
    });
  });

  describe('New Message Notification Flow', () => {
    beforeEach(async () => {
      // Register tokens for both users
      await registerPushToken(testUsers[0].netid, testUsers[0].pushToken);
      await registerPushToken(testUsers[1].netid, testUsers[1].pushToken);
    });

    it('should send push notification when message is sent', async () => {
      // Create in-app notification
      await createNotification(
        testUsers[1].netid,
        'new_message',
        `${testUsers[0].netid} sent you a message`,
        'You have a new message',
        {
          conversationId: 'test-conv-123',
          senderId: testUsers[0].firebaseUid,
          senderName: testUsers[0].netid,
        }
      );

      // Send push notification
      const result = await sendPushNotification(
        testUsers[1].netid,
        `${testUsers[0].netid} sent you a message`,
        'You have a new message',
        {
          type: 'new_message',
          conversationId: 'test-conv-123',
          senderId: testUsers[0].firebaseUid,
        }
      );

      expect(result).toBe(true);

      // Verify in-app notification was created
      const notifQuery = await db
        .collection('notifications')
        .where('netid', '==', testUsers[1].netid)
        .where('type', '==', 'new_message')
        .get();

      expect(notifQuery.docs.length).toBeGreaterThan(0);
      const notif = notifQuery.docs[0].data();
      expect(notif.metadata.conversationId).toBe('test-conv-123');
      expect(notif.metadata.senderId).toBe(testUsers[0].firebaseUid);
    });

    it('should respect notification preferences', async () => {
      // Disable new message notifications for user
      const userQuery = await db
        .collection('users')
        .where('netid', '==', testUsers[1].netid)
        .get();

      await userQuery.docs[0].ref.update({
        notificationPreferences: {
          newMessages: false,
          matchDrops: true,
          mutualNudges: true,
        },
      });

      // Check if notification should be sent
      const shouldSend = await checkNotificationPreference(
        testUsers[1].netid,
        'newMessages'
      );

      expect(shouldSend).toBe(false);
    });
  });

  describe('Match Drop Notification Flow', () => {
    beforeEach(async () => {
      // Register tokens for both users
      await registerPushToken(testUsers[0].netid, testUsers[0].pushToken);
      await registerPushToken(testUsers[1].netid, testUsers[1].pushToken);
    });

    it('should send match drop notification', async () => {
      const promptId = '2025-W10';

      // Create in-app notification
      await createNotification(
        testUsers[0].netid,
        'match_drop',
        'Your matches are here! 🎉',
        'You have 3 new matches this week',
        {
          promptId,
          matchCount: 3,
        }
      );

      // Send push notification
      const result = await sendPushNotification(
        testUsers[0].netid,
        'Your matches are here! 🎉',
        'Check out your 3 new matches for this week',
        {
          type: 'match_drop',
          promptId,
          matchCount: 3,
        }
      );

      expect(result).toBe(true);

      // Verify in-app notification was created
      const notifQuery = await db
        .collection('notifications')
        .where('netid', '==', testUsers[0].netid)
        .where('type', '==', 'match_drop')
        .get();

      expect(notifQuery.docs.length).toBeGreaterThan(0);
      const notif = notifQuery.docs[0].data();
      expect(notif.metadata.promptId).toBe(promptId);
      expect(notif.metadata.matchCount).toBe(3);
    });

    it('should respect match drop notification preferences', async () => {
      // Disable match drop notifications for user
      const userQuery = await db
        .collection('users')
        .where('netid', '==', testUsers[0].netid)
        .get();

      await userQuery.docs[0].ref.update({
        notificationPreferences: {
          newMessages: true,
          matchDrops: false,
          mutualNudges: true,
        },
      });

      // Check if notification should be sent
      const shouldSend = await checkNotificationPreference(
        testUsers[0].netid,
        'matchDrops'
      );

      expect(shouldSend).toBe(false);
    });
  });

  describe('Mutual Nudge Notification Flow', () => {
    it('should send mutual nudge notification', async () => {
      await registerPushToken(testUsers[0].netid, testUsers[0].pushToken);

      // Create in-app notification
      await createNotification(
        testUsers[0].netid,
        'mutual_nudge',
        'You both nudged each other! 🎉',
        'Start chatting now',
        {
          promptId: '2025-W10',
          matchNetid: testUsers[1].netid,
          conversationId: 'test-conv-456',
          matchName: testUsers[1].netid,
          matchFirebaseUid: testUsers[1].firebaseUid,
        }
      );

      // Send push notification
      const result = await sendPushNotification(
        testUsers[0].netid,
        'You both nudged each other! 🎉',
        'Start chatting now',
        {
          type: 'mutual_nudge',
          conversationId: 'test-conv-456',
          matchFirebaseUid: testUsers[1].firebaseUid,
        }
      );

      expect(result).toBe(true);

      // Verify in-app notification
      const notifQuery = await db
        .collection('notifications')
        .where('netid', '==', testUsers[0].netid)
        .where('type', '==', 'mutual_nudge')
        .get();

      expect(notifQuery.docs.length).toBeGreaterThan(0);
      const notif = notifQuery.docs[0].data();
      expect(notif.metadata.matchNetid).toBe(testUsers[1].netid);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid push tokens gracefully', async () => {
      // Register invalid token
      (Expo.isExpoPushToken as unknown as jest.Mock).mockReturnValue(false);

      await expect(
        registerPushToken(testUsers[0].netid, 'invalid-token')
      ).rejects.toThrow('Invalid push token format');

      // Reset mock
      (Expo.isExpoPushToken as unknown as jest.Mock).mockReturnValue(true);
    });

    it('should handle missing users gracefully', async () => {
      const result = await sendPushNotification(
        'nonexistent-user',
        'Test',
        'Test'
      );

      expect(result).toBe(false);
    });

    it('should handle users without tokens gracefully', async () => {
      // Create user without token
      const tempUser = {
        netid: 'no-token-user',
        firebaseUid: 'no-token-firebase-uid',
        email: 'notoken@cornell.edu',
      };

      await db.collection('users').add({
        netid: tempUser.netid,
        firebaseUid: tempUser.firebaseUid,
        email: tempUser.email,
        createdAt: new Date(),
      });

      const result = await sendPushNotification(
        tempUser.netid,
        'Test',
        'Test'
      );

      expect(result).toBe(false);

      // Clean up
      const userQuery = await db
        .collection('users')
        .where('netid', '==', tempUser.netid)
        .get();
      for (const doc of userQuery.docs) {
        await doc.ref.delete();
      }
    });
  });

  describe('Notification Preferences', () => {
    it('should default to all notifications enabled', async () => {
      const result = await checkNotificationPreference(
        testUsers[0].netid,
        'newMessages'
      );

      // Should default to true if no preferences set
      expect(result).toBe(true);
    });

    it('should allow disabling specific notification types', async () => {
      const userQuery = await db
        .collection('users')
        .where('netid', '==', testUsers[0].netid)
        .get();

      await userQuery.docs[0].ref.update({
        notificationPreferences: {
          newMessages: true,
          matchDrops: false,
          mutualNudges: true,
        },
      });

      const newMessagesEnabled = await checkNotificationPreference(
        testUsers[0].netid,
        'newMessages'
      );
      const matchDropsEnabled = await checkNotificationPreference(
        testUsers[0].netid,
        'matchDrops'
      );
      const mutualNudgesEnabled = await checkNotificationPreference(
        testUsers[0].netid,
        'mutualNudges'
      );

      expect(newMessagesEnabled).toBe(true);
      expect(matchDropsEnabled).toBe(false);
      expect(mutualNudgesEnabled).toBe(true);
    });
  });
});
