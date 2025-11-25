import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { db } from '../../firebaseAdmin';
import { UserDoc } from '../../types';
import { FieldValue } from 'firebase-admin/firestore';

// Create a new Expo SDK client
const expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN,
  useFcmV1: true, // Use FCM V1 API (recommended)
});

/**
 * Send a push notification to a single user
 * @param netid - User's Cornell NetID
 * @param title - Notification title
 * @param body - Notification body
 * @param data - Additional data to send with the notification
 * @returns Promise resolving to success status
 */
export async function sendPushNotification(
  netid: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    // Get user's push token
    const userSnapshot = await db
      .collection('users')
      .where('netid', '==', netid)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      console.warn(`User not found for push notification: ${netid}`);
      return false;
    }

    const userData = userSnapshot.docs[0].data() as UserDoc;
    const pushToken = userData.pushToken;

    if (!pushToken) {
      console.log(`No push token for user: ${netid}`);
      return false;
    }

    // Check if the push token is valid
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(
        `Invalid push token for user ${netid}: ${pushToken}`
      );
      // Remove invalid token
      await userSnapshot.docs[0].ref.update({
        pushToken: null,
        pushTokenUpdatedAt: null,
      });
      return false;
    }

    // Construct push notification message
    const message: ExpoPushMessage = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data: data || {},
      priority: 'high',
      badge: 1, // Show red badge on app icon
    };

    // Send the push notification
    const ticketChunk = await expo.sendPushNotificationsAsync([message]);
    const ticket = ticketChunk[0];

    // Check for errors
    if (ticket.status === 'error') {
      console.error(
        `Error sending push notification to ${netid}:`,
        ticket.message
      );

      // If the token is invalid, remove it
      if (
        ticket.details?.error === 'DeviceNotRegistered' ||
        ticket.message?.includes('not registered')
      ) {
        await userSnapshot.docs[0].ref.update({
          pushToken: null,
          pushTokenUpdatedAt: null,
        });
      }

      return false;
    }

    console.log(`✅ Push notification sent to ${netid}: ${title}`);
    return true;
  } catch (error) {
    console.error(`Error sending push notification to ${netid}:`, error);
    return false;
  }
}

/**
 * Send push notifications to multiple users
 * @param notifications - Array of notification objects with netid, title, body, data
 * @returns Promise resolving to number of successful sends
 */
export async function sendBulkPushNotifications(
  notifications: Array<{
    netid: string;
    title: string;
    body: string;
    data?: Record<string, any>;
  }>
): Promise<number> {
  try {
    // Get all user push tokens
    const netids = notifications.map((n) => n.netid);
    const usersSnapshot = await db
      .collection('users')
      .where('netid', 'in', netids)
      .get();

    // Create a map of netid -> push token
    const tokenMap = new Map<string, { token: string; docRef: any }>();
    usersSnapshot.docs.forEach((doc) => {
      const userData = doc.data() as UserDoc;
      if (userData.pushToken) {
        tokenMap.set(userData.netid, {
          token: userData.pushToken,
          docRef: doc.ref,
        });
      }
    });

    // Construct push notification messages
    const messages: ExpoPushMessage[] = [];
    const messageToUserMap = new Map<number, string>(); // index -> netid

    notifications.forEach((notification, index) => {
      const tokenData = tokenMap.get(notification.netid);
      if (!tokenData) {
        console.log(`No push token for user: ${notification.netid}`);
        return;
      }

      if (!Expo.isExpoPushToken(tokenData.token)) {
        console.error(
          `Invalid push token for user ${notification.netid}: ${tokenData.token}`
        );
        // Remove invalid token
        tokenData.docRef.update({
          pushToken: null,
          pushTokenUpdatedAt: null,
        });
        return;
      }

      messages.push({
        to: tokenData.token,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        priority: 'high',
        badge: 1, // Show red badge on app icon
      });

      messageToUserMap.set(messages.length - 1, notification.netid);
    });

    if (messages.length === 0) {
      console.log('No valid push tokens found for bulk notifications');
      return 0;
    }

    // Send push notifications in chunks
    const chunks = expo.chunkPushNotifications(messages);
    let successCount = 0;
    let chunkIndex = 0;

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);

        // Check for errors in this chunk
        ticketChunk.forEach((ticket, ticketIndex) => {
          const globalIndex = chunkIndex + ticketIndex;
          const netid = messageToUserMap.get(globalIndex);

          if (ticket.status === 'ok') {
            successCount++;
            console.log(`✅ Push notification sent to ${netid}`);
          } else if (ticket.status === 'error') {
            console.error(
              `Error sending push notification to ${netid}:`,
              ticket.message
            );

            // If the token is invalid, remove it
            if (
              ticket.details?.error === 'DeviceNotRegistered' ||
              ticket.message?.includes('not registered')
            ) {
              const tokenData = tokenMap.get(netid!);
              if (tokenData) {
                tokenData.docRef.update({
                  pushToken: null,
                  pushTokenUpdatedAt: null,
                });
              }
            }
          }
        });

        chunkIndex += chunk.length;
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }

    console.log(
      `📊 Bulk push notifications: ${successCount}/${messages.length} successful`
    );
    return successCount;
  } catch (error) {
    console.error('Error sending bulk push notifications:', error);
    return 0;
  }
}

/**
 * Check user's notification preferences before sending
 * @param netid - User's Cornell NetID
 * @param notificationType - Type of notification to check
 * @returns Promise resolving to boolean indicating if notification should be sent
 */
export async function checkNotificationPreference(
  netid: string,
  notificationType: 'newMessages' | 'matchDrops' | 'mutualNudges'
): Promise<boolean> {
  try {
    const userSnapshot = await db
      .collection('users')
      .where('netid', '==', netid)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return true; // Default to allowing if user not found
    }

    const userData = userSnapshot.docs[0].data() as UserDoc;
    const preferences = userData.notificationPreferences;

    // If no preferences set, default to true (opt-out model)
    if (!preferences) {
      return true;
    }

    // Check specific preference
    return preferences[notificationType] !== false;
  } catch (error) {
    console.error('Error checking notification preference:', error);
    return true; // Default to allowing on error
  }
}

/**
 * Remove push token for a user (e.g., on logout or token invalidation)
 * @param netid - User's Cornell NetID
 * @returns Promise resolving to success status
 */
export async function removePushToken(netid: string): Promise<boolean> {
  try {
    const userSnapshot = await db
      .collection('users')
      .where('netid', '==', netid)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      console.warn(`User not found when removing push token: ${netid}`);
      return false;
    }

    await userSnapshot.docs[0].ref.update({
      pushToken: null,
      pushTokenUpdatedAt: null,
    });

    console.log(`Push token removed for user: ${netid}`);
    return true;
  } catch (error) {
    console.error(`Error removing push token for ${netid}:`, error);
    return false;
  }
}

/**
 * Send a broadcast notification to all users with valid push tokens
 * AND create in-app notifications in Firestore
 * @param title - Notification title
 * @param body - Notification body
 * @returns Promise resolving to result with success count, total count, and errors
 */
export async function sendBroadcastNotification(
  title: string,
  body: string
): Promise<{
  successCount: number;
  totalUsers: number;
  errors: Array<{ netid: string; error: string }>;
}> {
  try {
    // Get all users with push tokens
    const usersSnapshot = await db
      .collection('users')
      .where('pushToken', '!=', null)
      .get();

    console.log(
      `📡 Broadcasting notification to ${usersSnapshot.size} users with push tokens`
    );

    if (usersSnapshot.empty) {
      console.log('No users with push tokens found');
      return { successCount: 0, totalUsers: 0, errors: [] };
    }

    // Create in-app notifications in Firestore for all users
    // Use batch writes for efficiency (max 500 per batch)
    const BATCH_SIZE = 500;
    const allUsers: UserDoc[] = usersSnapshot.docs.map((doc) =>
      doc.data() as UserDoc
    );

    console.log(
      `💾 Creating ${allUsers.length} in-app notifications in Firestore...`
    );

    // Split into batches and write to Firestore
    for (let i = 0; i < allUsers.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const batchUsers = allUsers.slice(i, i + BATCH_SIZE);

      batchUsers.forEach((userData) => {
        const notificationRef = db.collection('notifications').doc();
        batch.set(notificationRef, {
          netid: userData.netid,
          type: 'admin_broadcast',
          title,
          message: body,
          read: false,
          metadata: {},
          createdAt: FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();
      console.log(
        `✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}: Created ${batchUsers.length} in-app notifications`
      );
    }

    console.log(
      `✅ All in-app notifications created in Firestore. Now sending push notifications...`
    );

    // Construct push notification messages
    const messages: ExpoPushMessage[] = [];
    const userTokenMap = new Map<number, { netid: string; docRef: any }>();

    usersSnapshot.docs.forEach((doc) => {
      const userData = doc.data() as UserDoc;
      const pushToken = userData.pushToken;

      if (!pushToken) {
        return;
      }

      // Validate the push token
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(
          `Invalid push token for user ${userData.netid}: ${pushToken}`
        );
        // Remove invalid token
        doc.ref.update({
          pushToken: null,
          pushTokenUpdatedAt: null,
        });
        return;
      }

      const messageIndex = messages.length;
      messages.push({
        to: pushToken,
        sound: 'default',
        title,
        body,
        data: {
          type: 'admin_broadcast',
          timestamp: new Date().toISOString(),
        },
        priority: 'high',
        badge: 1, // Show red badge on app icon
      });

      userTokenMap.set(messageIndex, {
        netid: userData.netid,
        docRef: doc.ref,
      });
    });

    if (messages.length === 0) {
      console.log('No valid push tokens found after validation');
      return { successCount: 0, totalUsers: usersSnapshot.size, errors: [] };
    }

    console.log(`✅ Prepared ${messages.length} valid messages for sending`);

    // Send push notifications in chunks (Expo recommends max 100 per request)
    const chunks = expo.chunkPushNotifications(messages);
    let successCount = 0;
    let messageIndex = 0;
    const errors: Array<{ netid: string; error: string }> = [];

    for (const chunk of chunks) {
      try {
        console.log(`📤 Sending chunk of ${chunk.length} notifications...`);
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);

        // Check for errors in this chunk
        ticketChunk.forEach((ticket, ticketIndex) => {
          const globalIndex = messageIndex + ticketIndex;
          const userInfo = userTokenMap.get(globalIndex);

          if (!userInfo) {
            console.error(`No user info found for message index ${globalIndex}`);
            return;
          }

          if (ticket.status === 'ok') {
            successCount++;
            console.log(`✅ Broadcast notification sent to ${userInfo.netid}`);
          } else if (ticket.status === 'error') {
            const errorMsg = ticket.message || 'Unknown error';
            console.error(
              `❌ Error sending broadcast notification to ${userInfo.netid}:`,
              errorMsg
            );
            errors.push({ netid: userInfo.netid, error: errorMsg });

            // If the token is invalid, remove it
            if (
              ticket.details?.error === 'DeviceNotRegistered' ||
              ticket.message?.includes('not registered')
            ) {
              userInfo.docRef.update({
                pushToken: null,
                pushTokenUpdatedAt: null,
              });
            }
          }
        });

        messageIndex += chunk.length;
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
        // Mark all messages in this chunk as failed
        chunk.forEach((_, ticketIndex) => {
          const globalIndex = messageIndex + ticketIndex;
          const userInfo = userTokenMap.get(globalIndex);
          if (userInfo) {
            errors.push({
              netid: userInfo.netid,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        });
        messageIndex += chunk.length;
      }
    }

    console.log(
      `📊 Broadcast complete: ${successCount}/${messages.length} notifications sent successfully`
    );

    return {
      successCount,
      totalUsers: messages.length,
      errors,
    };
  } catch (error) {
    console.error('Error sending broadcast notification:', error);
    throw error;
  }
}
