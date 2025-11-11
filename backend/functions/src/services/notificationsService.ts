import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebaseAdmin';
import { NotificationDocWrite } from '../types';

const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * Create in-app match drop notifications for all users who received matches
 * @param userNetids - Array of netids who received matches
 * @param promptId - The prompt ID for the matches
 * @returns Promise resolving to number of notifications created
 */
export async function createMatchDropNotifications(
  userNetids: string[],
  promptId: string
): Promise<number> {
  try {
    console.log(
      `Creating match drop in-app notifications for ${userNetids.length} users`
    );

    let successCount = 0;
    const batch = db.batch();
    let batchCount = 0;

    for (const netid of userNetids) {
      try {
        // Get match count for this user
        const matchCount = await getMatchCountForUser(netid, promptId);

        if (matchCount === 0) {
          console.log(`User ${netid} has no matches, skipping notification`);
          continue;
        }

        // Create notification document
        const notificationDoc: NotificationDocWrite = {
          netid,
          type: 'match_drop',
          title: 'Your matches are here! 🎉',
          message: `You have ${matchCount} new ${matchCount === 1 ? 'match' : 'matches'} this week`,
          read: false,
          metadata: {
            promptId,
            matchCount,
          },
          createdAt: FieldValue.serverTimestamp(),
        };

        const notificationRef = db.collection(NOTIFICATIONS_COLLECTION).doc();
        batch.set(notificationRef, notificationDoc);
        batchCount++;
        successCount++;

        // Firestore batch limit is 500
        if (batchCount >= 500) {
          await batch.commit();
          batchCount = 0;
        }
      } catch (error) {
        console.error(
          `Error creating match drop notification for ${netid}:`,
          error
        );
      }
    }

    // Commit remaining batch
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(
      `✅ Created ${successCount} match drop in-app notifications`
    );
    return successCount;
  } catch (error) {
    console.error('Error creating match drop notifications:', error);
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
