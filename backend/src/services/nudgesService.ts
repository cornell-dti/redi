import { db } from '../../firebaseAdmin';
import {
  NudgeDoc,
  NudgeDocWrite,
  NudgeResponse,
  NudgeStatusResponse,
} from '../../types';
import { FieldValue } from 'firebase-admin/firestore';
import { createNotification } from './notificationsService';

const NUDGES_COLLECTION = 'nudges';
const MATCHES_COLLECTION = 'weeklyMatches';

// =============================================================================
// NUDGE OPERATIONS
// =============================================================================

/**
 * Create a nudge from one user to another
 * Checks for mutual nudge and creates notifications if both have nudged
 * @param fromNetid - User sending the nudge
 * @param toNetid - User receiving the nudge
 * @param promptId - The prompt ID for this week's match
 * @returns Promise resolving to the created NudgeDoc
 */
export async function createNudge(
  fromNetid: string,
  toNetid: string,
  promptId: string
): Promise<NudgeDoc> {
  const nudgeId = `${fromNetid}_${promptId}_${toNetid}`;

  // Check if nudge already exists
  const existingNudge = await db.collection(NUDGES_COLLECTION).doc(nudgeId).get();
  if (existingNudge.exists) {
    throw new Error('You have already nudged this match');
  }

  // Create the nudge document
  const nudgeDoc: NudgeDocWrite = {
    fromNetid,
    toNetid,
    promptId,
    mutual: false,
    createdAt: FieldValue.serverTimestamp(),
  };

  await db.collection(NUDGES_COLLECTION).doc(nudgeId).set(nudgeDoc);

  // Check if reverse nudge exists (mutual nudge detection)
  const reverseNudgeId = `${toNetid}_${promptId}_${fromNetid}`;
  const reverseNudge = await db.collection(NUDGES_COLLECTION).doc(reverseNudgeId).get();

  // If both users have nudged each other, it's mutual!
  if (reverseNudge.exists) {
    // Mark both nudges as mutual
    await db.collection(NUDGES_COLLECTION).doc(nudgeId).update({ mutual: true });
    await db.collection(NUDGES_COLLECTION).doc(reverseNudgeId).update({ mutual: true });

    // Set chatUnlocked flag on both users' match documents
    await unlockChatForMatch(fromNetid, toNetid, promptId);
    await unlockChatForMatch(toNetid, fromNetid, promptId);

    // Create notifications for BOTH users
    await createNotification(
      fromNetid,
      'mutual_nudge',
      'You both nudged each other! 🎉',
      'Start chatting now',
      {
        promptId,
        matchNetid: toNetid,
      }
    );

    await createNotification(
      toNetid,
      'mutual_nudge',
      'You both nudged each other! 🎉',
      'Start chatting now',
      {
        promptId,
        matchNetid: fromNetid,
      }
    );
  }

  // Return the created nudge
  const createdNudge = await db.collection(NUDGES_COLLECTION).doc(nudgeId).get();
  return createdNudge.data() as NudgeDoc;
}

/**
 * Unlock chat between two matched users
 * Sets chatUnlocked flag on the match document
 * @param userNetid - The user whose match document to update
 * @param matchNetid - The matched user's netid
 * @param promptId - The prompt ID
 */
async function unlockChatForMatch(
  userNetid: string,
  matchNetid: string,
  promptId: string
): Promise<void> {
  const matchDocId = `${userNetid}_${promptId}`;
  const matchDoc = await db.collection(MATCHES_COLLECTION).doc(matchDocId).get();

  if (!matchDoc.exists) {
    return;
  }

  const matchData = matchDoc.data();
  if (!matchData) {
    return;
  }

  // Find the index of the matched user
  const matchIndex = matchData.matches.indexOf(matchNetid);
  if (matchIndex === -1) {
    return;
  }

  // Add chatUnlocked array if it doesn't exist
  if (!matchData.chatUnlocked) {
    matchData.chatUnlocked = matchData.matches.map(() => false);
  }

  // Set chatUnlocked to true for this specific match
  matchData.chatUnlocked[matchIndex] = true;

  await db.collection(MATCHES_COLLECTION).doc(matchDocId).update({
    chatUnlocked: matchData.chatUnlocked,
  });
}

/**
 * Get nudge status between two users for a specific prompt
 * @param netid - Current user's netid
 * @param matchNetid - The matched user's netid
 * @param promptId - The prompt ID
 * @returns Promise resolving to NudgeStatusResponse
 */
export async function getNudgeStatus(
  netid: string,
  matchNetid: string,
  promptId: string
): Promise<NudgeStatusResponse> {
  const sentNudgeId = `${netid}_${promptId}_${matchNetid}`;
  const receivedNudgeId = `${matchNetid}_${promptId}_${netid}`;

  const [sentNudge, receivedNudge] = await Promise.all([
    db.collection(NUDGES_COLLECTION).doc(sentNudgeId).get(),
    db.collection(NUDGES_COLLECTION).doc(receivedNudgeId).get(),
  ]);

  const sent = sentNudge.exists;
  const received = receivedNudge.exists;
  const mutual = sent && received && (sentNudge.data()?.mutual || false);

  return {
    sent,
    received,
    mutual,
  };
}

/**
 * Check if two users have mutually nudged each other
 * @param netid1 - First user's netid
 * @param netid2 - Second user's netid
 * @param promptId - The prompt ID
 * @returns Promise resolving to boolean
 */
export async function checkMutualNudge(
  netid1: string,
  netid2: string,
  promptId: string
): Promise<boolean> {
  const status = await getNudgeStatus(netid1, netid2, promptId);
  return status.mutual;
}

/**
 * Convert NudgeDoc to NudgeResponse (for API responses)
 * @param nudgeDoc - The nudge document from Firestore
 * @returns NudgeResponse with ISO string timestamps
 */
export function nudgeToResponse(nudgeDoc: NudgeDoc): NudgeResponse {
  return {
    fromNetid: nudgeDoc.fromNetid,
    toNetid: nudgeDoc.toNetid,
    promptId: nudgeDoc.promptId,
    mutual: nudgeDoc.mutual,
    createdAt: nudgeDoc.createdAt instanceof Date
      ? nudgeDoc.createdAt.toISOString()
      : nudgeDoc.createdAt.toDate().toISOString(),
  };
}
