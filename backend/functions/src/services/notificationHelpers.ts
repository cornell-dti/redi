import { db } from "../firebaseAdmin";
import {
  sendBulkPushNotifications,
  checkNotificationPreference,
} from "./pushNotificationService";
import { createNotification } from "./notificationsService";

/**
 * Send push notifications to all users who received matches
 * @param promptId - The prompt ID for which matches were generated
 * @returns Number of notifications sent
 */
export async function sendMatchDropNotifications(
  promptId: string
): Promise<number> {
  try {
    console.log(`📱 Starting match drop notifications for prompt: ${promptId}`);

    // Get all users who have matches for this prompt
    const matchesSnapshot = await db
      .collection("weeklyMatches")
      .where("promptId", "==", promptId)
      .get();

    if (matchesSnapshot.empty) {
      console.log("No matches found to notify");
      return 0;
    }

    // Group by user and count matches
    const userMatchCounts = new Map<string, number>();
    matchesSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const netid = data.netid;
      const matchCount = data.matches?.length || 0;

      if (matchCount > 0) {
        userMatchCounts.set(netid, matchCount);
      }
    });

    console.log(`Preparing notifications for ${userMatchCounts.size} users`);

    // Create notifications array
    const notifications: Array<{
      netid: string;
      title: string;
      body: string;
      data?: Record<string, any>;
    }> = [];

    // Check preferences and prepare notifications
    for (const [netid, matchCount] of userMatchCounts.entries()) {
      try {
        // Check if user has match drop notifications enabled
        const prefEnabled = await checkNotificationPreference(
          netid,
          "matchDrops"
        );

        if (!prefEnabled) {
          console.log(
            `User ${netid} has match drops notifications disabled`
          );
          continue;
        }

        // Create in-app notification
        await createNotification(
          netid,
          "match_drop",
          "New matches available!",
          `You have ${matchCount} new ${matchCount === 1 ? "match" : "matches"} this week`,
          {
            promptId,
            matchCount,
          }
        );

        // Prepare push notification
        notifications.push({
          netid,
          title: "New matches available!",
          body: `You have ${matchCount} new ${matchCount === 1 ? "match" : "matches"} this week`,
          data: {
            type: "match_drop",
            promptId,
            matchCount,
          },
        });

        console.log(
          `✅ Prepared notification for ${netid} (${matchCount} matches)`
        );
      } catch (error) {
        console.error(`Error preparing notification for ${netid}:`, error);
        // Continue with other users even if one fails
      }
    }

    // Send bulk push notifications
    if (notifications.length > 0) {
      console.log(
        `📤 Sending ${notifications.length} push notifications...`
      );
      const sentCount = await sendBulkPushNotifications(notifications);
      console.log(
        `✅ Sent ${sentCount}/${notifications.length} match drop push notifications`
      );
      return sentCount;
    } else {
      console.log("No notifications to send (all users have disabled match drops)");
      return 0;
    }
  } catch (error) {
    console.error("Error sending match drop notifications:", error);
    throw error;
  }
}
