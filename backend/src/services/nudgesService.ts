import { db } from '../../firebaseAdmin';
import {
  NudgeDoc,
  NudgeDocWrite,
  NudgeResponse,
  NudgeStatusResponse,
} from '../../types';
import { FieldValue } from 'firebase-admin/firestore';
import { createNotification } from './notificationsService';
import { getFirebaseUidFromNetid } from '../middleware/authorization';

const NUDGES_COLLECTION = 'nudges';
const MATCHES_COLLECTION = 'weeklyMatches';
const CONVERSATIONS_COLLECTION = 'conversations';

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
  const existingNudge = await db
    .collection(NUDGES_COLLECTION)
    .doc(nudgeId)
    .get();
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
  const reverseNudge = await db
    .collection(NUDGES_COLLECTION)
    .doc(reverseNudgeId)
    .get();

  // If both users have nudged each other, it's mutual!
  if (reverseNudge.exists) {
    // Mark both nudges as mutual
    await db
      .collection(NUDGES_COLLECTION)
      .doc(nudgeId)
      .update({ mutual: true });
    await db
      .collection(NUDGES_COLLECTION)
      .doc(reverseNudgeId)
      .update({ mutual: true });

    // Set chatUnlocked flag on both users' match documents
    await unlockChatForMatch(fromNetid, toNetid, promptId);
    await unlockChatForMatch(toNetid, fromNetid, promptId);

    // Create or get conversation between the two users
    const conversationId = await createOrGetConversation(fromNetid, toNetid);

    // Get user names for notification metadata
    const [fromFirebaseUid, toFirebaseUid] = await Promise.all([
      getFirebaseUidFromNetid(fromNetid),
      getFirebaseUidFromNetid(toNetid),
    ]);

    const [fromUserProfile, toUserProfile] = await Promise.all([
      fromFirebaseUid ? getUserProfile(fromFirebaseUid) : null,
      toFirebaseUid ? getUserProfile(toFirebaseUid) : null,
    ]);

    // Create notifications for BOTH users with conversationId
    await createNotification(
      fromNetid,
      'mutual_nudge',
      'You both nudged each other! 🎉',
      'Start chatting now',
      {
        promptId,
        matchNetid: toNetid,
        conversationId: conversationId || undefined,
        matchName: toUserProfile?.name,
        matchFirebaseUid: toFirebaseUid || undefined,
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
        conversationId: conversationId || undefined,
        matchName: fromUserProfile?.name,
        matchFirebaseUid: fromFirebaseUid || undefined,
      }
    );
  }

  // Return the created nudge
  const createdNudge = await db
    .collection(NUDGES_COLLECTION)
    .doc(nudgeId)
    .get();
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
  // Query by netid and promptId to support both algorithm-generated and manually created matches
  const matchSnapshot = await db
    .collection(MATCHES_COLLECTION)
    .where('netid', '==', userNetid)
    .where('promptId', '==', promptId)
    .limit(1)
    .get();

  if (matchSnapshot.empty) {
    return;
  }

  const matchDoc = matchSnapshot.docs[0];
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

  await matchDoc.ref.update({
    chatUnlocked: matchData.chatUnlocked,
  });
}

/**
 * Helper function to get user's profile data for chat
 * @param firebaseUid - User's Firebase UID
 * @returns User profile with name and image
 */
async function getUserProfile(firebaseUid: string): Promise<{
  firebaseUid: string;
  netid: string;
  name: string;
  image: string | null;
} | null> {
  try {
    const userSnapshot = await db
      .collection('users')
      .where('firebaseUid', '==', firebaseUid)
      .get();

    if (userSnapshot.empty) {
      return null;
    }

    const userData = userSnapshot.docs[0].data();

    // Get profile data for name and image
    const profileSnapshot = await db
      .collection('profiles')
      .where('netid', '==', userData.netid)
      .get();

    const profileData = !profileSnapshot.empty
      ? profileSnapshot.docs[0].data()
      : null;

    return {
      firebaseUid,
      netid: userData.netid,
      name: profileData?.firstName || userData.netid,
      image: profileData?.pictures?.[0] || null,
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Create or get existing conversation between two users (by netid)
 * @param netid1 - First user's netid
 * @param netid2 - Second user's netid
 * @returns Conversation ID or null if creation failed
 */
async function createOrGetConversation(
  netid1: string,
  netid2: string
): Promise<string | null> {
  try {
    // Get Firebase UIDs for both users
    const [firebaseUid1, firebaseUid2] = await Promise.all([
      getFirebaseUidFromNetid(netid1),
      getFirebaseUidFromNetid(netid2),
    ]);

    if (!firebaseUid1 || !firebaseUid2) {
      console.error('Could not find Firebase UIDs for users');
      return null;
    }

    // Check if conversation already exists
    const participantIds = [firebaseUid1, firebaseUid2].sort();
    const existingConversation = await db
      .collection(CONVERSATIONS_COLLECTION)
      .where('participantIds', '==', participantIds)
      .limit(1)
      .get();

    if (!existingConversation.empty) {
      return existingConversation.docs[0].id;
    }

    // Get both user profiles
    const [user1Profile, user2Profile] = await Promise.all([
      getUserProfile(firebaseUid1),
      getUserProfile(firebaseUid2),
    ]);

    if (!user1Profile || !user2Profile) {
      console.error('Could not get user profiles');
      return null;
    }

    // Create new conversation
    const newConversation = {
      participantIds,
      participants: {
        [firebaseUid1]: {
          name: user1Profile.name,
          image: user1Profile.image,
          netid: user1Profile.netid,
        },
        [firebaseUid2]: {
          name: user2Profile.name,
          image: user2Profile.image,
          netid: user2Profile.netid,
        },
      },
      lastMessage: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const conversationDoc = await db
      .collection(CONVERSATIONS_COLLECTION)
      .add(newConversation);
    return conversationDoc.id;
  } catch (error) {
    console.error('Error creating conversation:', error);
    return null;
  }
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
    createdAt:
      nudgeDoc.createdAt instanceof Date
        ? nudgeDoc.createdAt.toISOString()
        : nudgeDoc.createdAt.toDate().toISOString(),
  };
}
