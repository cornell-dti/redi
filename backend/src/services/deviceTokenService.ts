import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../firebaseAdmin';
import { UserDoc } from '../../types';
import { Expo } from 'expo-server-sdk';

/**
 * Register or update a user's push notification token
 * @param netid - User's Cornell NetID
 * @param pushToken - Expo push notification token
 * @returns Promise resolving to success status
 */
export async function registerPushToken(
  netid: string,
  pushToken: string
): Promise<boolean> {
  try {
    // Validate the push token format
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Invalid push token format: ${pushToken}`);
      throw new Error('Invalid push token format');
    }

    // Find user document
    const userSnapshot = await db
      .collection('users')
      .where('netid', '==', netid)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      console.error(`User not found when registering push token: ${netid}`);
      throw new Error('User not found');
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data() as UserDoc;

    // Check if token is already registered
    if (userData.pushToken === pushToken) {
      console.log(`Push token already registered for user: ${netid}`);
      // Update the timestamp anyway to track last seen
      await userDoc.ref.update({
        pushTokenUpdatedAt: FieldValue.serverTimestamp(),
      });
      return true;
    }

    // Update user document with new push token
    await userDoc.ref.update({
      pushToken,
      pushTokenUpdatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`✅ Push token registered for user: ${netid}`);
    return true;
  } catch (error) {
    console.error(`Error registering push token for ${netid}:`, error);
    throw error;
  }
}

/**
 * Remove a user's push notification token
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
 * Get a user's push notification token
 * @param netid - User's Cornell NetID
 * @returns Promise resolving to push token or null
 */
export async function getPushToken(netid: string): Promise<string | null> {
  try {
    const userSnapshot = await db
      .collection('users')
      .where('netid', '==', netid)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return null;
    }

    const userData = userSnapshot.docs[0].data() as UserDoc;
    return userData.pushToken || null;
  } catch (error) {
    console.error(`Error getting push token for ${netid}:`, error);
    return null;
  }
}

/**
 * Update user's notification preferences
 * @param netid - User's Cornell NetID
 * @param preferences - Notification preferences object
 * @returns Promise resolving to success status
 */
export async function updateNotificationPreferences(
  netid: string,
  preferences: {
    newMessages?: boolean;
    matchDrops?: boolean;
    mutualNudges?: boolean;
  }
): Promise<boolean> {
  try {
    const userSnapshot = await db
      .collection('users')
      .where('netid', '==', netid)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      console.error(
        `User not found when updating notification preferences: ${netid}`
      );
      throw new Error('User not found');
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data() as UserDoc;

    // Merge with existing preferences
    const currentPreferences = userData.notificationPreferences || {
      newMessages: true,
      matchDrops: true,
      mutualNudges: true,
    };

    const updatedPreferences = {
      ...currentPreferences,
      ...preferences,
    };

    await userDoc.ref.update({
      notificationPreferences: updatedPreferences,
    });

    console.log(`✅ Notification preferences updated for user: ${netid}`);
    return true;
  } catch (error) {
    console.error(
      `Error updating notification preferences for ${netid}:`,
      error
    );
    throw error;
  }
}

/**
 * Get user's notification preferences
 * @param netid - User's Cornell NetID
 * @returns Promise resolving to preferences object
 */
export async function getNotificationPreferences(netid: string): Promise<{
  newMessages: boolean;
  matchDrops: boolean;
  mutualNudges: boolean;
}> {
  try {
    const userSnapshot = await db
      .collection('users')
      .where('netid', '==', netid)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      // Return default preferences
      return {
        newMessages: true,
        matchDrops: true,
        mutualNudges: true,
      };
    }

    const userData = userSnapshot.docs[0].data() as UserDoc;
    return (
      userData.notificationPreferences || {
        newMessages: true,
        matchDrops: true,
        mutualNudges: true,
      }
    );
  } catch (error) {
    console.error(
      `Error getting notification preferences for ${netid}:`,
      error
    );
    // Return default preferences on error
    return {
      newMessages: true,
      matchDrops: true,
      mutualNudges: true,
    };
  }
}

/**
 * Initialize default notification preferences for a user
 * @param netid - User's Cornell NetID
 * @returns Promise resolving to success status
 */
export async function initializeNotificationPreferences(
  netid: string
): Promise<boolean> {
  try {
    const userSnapshot = await db
      .collection('users')
      .where('netid', '==', netid)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return false;
    }

    const userData = userSnapshot.docs[0].data() as UserDoc;

    // Only initialize if preferences don't exist
    if (!userData.notificationPreferences) {
      await userSnapshot.docs[0].ref.update({
        notificationPreferences: {
          newMessages: true,
          matchDrops: true,
          mutualNudges: true,
        },
      });
      console.log(`Initialized notification preferences for user: ${netid}`);
    }

    return true;
  } catch (error) {
    console.error(
      `Error initializing notification preferences for ${netid}:`,
      error
    );
    return false;
  }
}
