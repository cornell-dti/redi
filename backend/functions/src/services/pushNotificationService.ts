import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { db } from '../firebaseAdmin';

// Create a new Expo SDK client
const expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN,
  useFcmV1: true,
});

interface UserDoc {
  netid: string;
  pushToken?: string;
  notificationPreferences?: {
    newMessages: boolean;
    matchDrops: boolean;
    mutualNudges: boolean;
  };
}

/**
 * Send match drop notifications to users who received matches
 * @param userNetids - Array of netids who received matches
 * @param promptId - The prompt ID for the matches
 * @returns Promise resolving to number of successful notifications sent
 */
export async function sendMatchDropNotifications(
  userNetids: string[],
  promptId: string
): Promise<number> {
  try {
    console.log(
      `Sending match drop notifications to ${userNetids.length} users`
    );

    // Fetch user documents in batches (Firestore 'in' limit is 10)
    const allUserDocs: any[] = [];

    for (let i = 0; i < userNetids.length; i += 10) {
      const batch = userNetids.slice(i, i + 10);
      const usersSnapshot = await db
        .collection('users')
        .where('netid', 'in', batch)
        .get();

      allUserDocs.push(...usersSnapshot.docs);
    }

    // Build push notification messages
    const messages: ExpoPushMessage[] = [];
    const messageToUserMap = new Map<number, string>();

    for (const userDoc of allUserDocs) {
      const userData = userDoc.data() as UserDoc;
      const pushToken = userData.pushToken;

      // Check if user has push token
      if (!pushToken) {
        console.log(`No push token for user: ${userData.netid}`);
        continue;
      }

      // Validate push token
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(
          `Invalid push token for user ${userData.netid}: ${pushToken}`
        );
        // Remove invalid token
        await userDoc.ref.update({
          pushToken: null,
          pushTokenUpdatedAt: null,
        });
        continue;
      }

      // Check notification preferences (default to true if not set)
      const preferences = userData.notificationPreferences;
      if (preferences && preferences.matchDrops === false) {
        console.log(
          `User ${userData.netid} has disabled match drop notifications`
        );
        continue;
      }

      // Get match count for this user
      const matchCount = await getMatchCountForUser(userData.netid, promptId);

      // Create push notification message
      messages.push({
        to: pushToken,
        sound: 'default',
        title: 'Your matches are here! 🎉',
        body: `Check out your ${matchCount} new ${matchCount === 1 ? 'match' : 'matches'} for this week`,
        data: {
          type: 'match_drop',
          promptId,
          matchCount,
        },
        priority: 'high',
      });

      messageToUserMap.set(messages.length - 1, userData.netid);
    }

    if (messages.length === 0) {
      console.log('No valid push tokens found for match drop notifications');
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
            console.log(`✅ Match drop notification sent to ${netid}`);
          } else if (ticket.status === 'error') {
            console.error(
              `Error sending match drop notification to ${netid}:`,
              ticket.message
            );

            // If the token is invalid, remove it
            if (
              ticket.details?.error === 'DeviceNotRegistered' ||
              ticket.message?.includes('not registered')
            ) {
              db.collection('users')
                .where('netid', '==', netid)
                .limit(1)
                .get()
                .then((snapshot) => {
                  if (!snapshot.empty) {
                    snapshot.docs[0].ref.update({
                      pushToken: null,
                      pushTokenUpdatedAt: null,
                    });
                  }
                });
            }
          }
        });

        chunkIndex += chunk.length;
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }

    console.log(
      `📊 Match drop notifications: ${successCount}/${messages.length} successful`
    );
    return successCount;
  } catch (error) {
    console.error('Error sending match drop notifications:', error);
    return 0;
  }
}

/**
 * Get the number of matches a user received for a specific prompt
 * @param netid - User's Cornell NetID
 * @param promptId - The prompt ID
 * @returns Promise resolving to match count
 */
async function getMatchCountForUser(
  netid: string,
  promptId: string
): Promise<number> {
  try {
    const docId = `${netid}_${promptId}`;
    const matchDoc = await db.collection('weeklyMatches').doc(docId).get();

    if (!matchDoc.exists) {
      return 0;
    }

    const matchData = matchDoc.data();
    return matchData?.matches?.length || 0;
  } catch (error) {
    console.error(
      `Error getting match count for ${netid} on ${promptId}:`,
      error
    );
    return 0;
  }
}
