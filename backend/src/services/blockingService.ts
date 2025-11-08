import { db } from '../../firebaseAdmin';
import {
  BlockedUserDoc,
  BlockedUserDocWrite,
  BlockedUserResponse,
} from '../../types';
import { FieldValue } from 'firebase-admin/firestore';

const BLOCKED_USERS_COLLECTION = 'blockedUsers';

// =============================================================================
// BLOCKING OPERATIONS
// =============================================================================

/**
 * Block a user
 * Creates a block relationship from blocker to blocked user
 * @param blockerNetid - User who is blocking
 * @param blockedNetid - User to be blocked
 * @returns Promise resolving to the created BlockedUserDoc
 * @throws Error if trying to block self or if block already exists
 */
export async function blockUser(
  blockerNetid: string,
  blockedNetid: string
): Promise<BlockedUserDoc> {
  // Validate: cannot block yourself
  if (blockerNetid === blockedNetid) {
    throw new Error('You cannot block yourself');
  }

  const blockId = `${blockerNetid}_${blockedNetid}`;

  // Check if block already exists
  const existingBlock = await db
    .collection(BLOCKED_USERS_COLLECTION)
    .doc(blockId)
    .get();

  if (existingBlock.exists) {
    throw new Error('You have already blocked this user');
  }

  // Create the block document
  const blockDoc: BlockedUserDocWrite = {
    blockerNetid,
    blockedNetid,
    createdAt: FieldValue.serverTimestamp(),
  };

  await db.collection(BLOCKED_USERS_COLLECTION).doc(blockId).set(blockDoc);

  // Return the created block
  const createdBlock = await db
    .collection(BLOCKED_USERS_COLLECTION)
    .doc(blockId)
    .get();

  return createdBlock.data() as BlockedUserDoc;
}

/**
 * Unblock a user
 * Removes the block relationship from blocker to blocked user
 * @param blockerNetid - User who is unblocking
 * @param blockedNetid - User to be unblocked
 * @returns Promise resolving to void
 * @throws Error if block does not exist
 */
export async function unblockUser(
  blockerNetid: string,
  blockedNetid: string
): Promise<void> {
  const blockId = `${blockerNetid}_${blockedNetid}`;

  const blockDoc = await db
    .collection(BLOCKED_USERS_COLLECTION)
    .doc(blockId)
    .get();

  if (!blockDoc.exists) {
    throw new Error('Block relationship does not exist');
  }

  await db.collection(BLOCKED_USERS_COLLECTION).doc(blockId).delete();
}

/**
 * Get all users blocked by a specific user
 * @param blockerNetid - User whose blocked list to retrieve
 * @returns Promise resolving to array of blocked user netids
 */
export async function getBlockedUsers(blockerNetid: string): Promise<string[]> {
  const blocksSnapshot = await db
    .collection(BLOCKED_USERS_COLLECTION)
    .where('blockerNetid', '==', blockerNetid)
    .get();

  return blocksSnapshot.docs.map((doc) => {
    const data = doc.data() as BlockedUserDoc;
    return data.blockedNetid;
  });
}

/**
 * Check if user A has blocked user B
 * @param blockerNetid - Potential blocker
 * @param blockedNetid - Potential blocked user
 * @returns Promise resolving to boolean
 */
export async function isUserBlocked(
  blockerNetid: string,
  blockedNetid: string
): Promise<boolean> {
  const blockId = `${blockerNetid}_${blockedNetid}`;
  const blockDoc = await db
    .collection(BLOCKED_USERS_COLLECTION)
    .doc(blockId)
    .get();

  return blockDoc.exists;
}

/**
 * Check if either user has blocked the other (bidirectional check)
 * Used for matching algorithm to ensure blocked users never match
 * @param netid1 - First user's netid
 * @param netid2 - Second user's netid
 * @returns Promise resolving to boolean (true if either has blocked the other)
 */
export async function areUsersBlocked(
  netid1: string,
  netid2: string
): Promise<boolean> {
  const blockId1 = `${netid1}_${netid2}`;
  const blockId2 = `${netid2}_${netid1}`;

  const [block1, block2] = await Promise.all([
    db.collection(BLOCKED_USERS_COLLECTION).doc(blockId1).get(),
    db.collection(BLOCKED_USERS_COLLECTION).doc(blockId2).get(),
  ]);

  return block1.exists || block2.exists;
}

/**
 * Get blocked users map for matching algorithm
 * Returns a map of netid -> Set of netids they have blocked or been blocked by
 * This is used to efficiently filter out blocked users during matching
 * @param netids - Array of netids to check
 * @returns Promise resolving to Map<string, Set<string>>
 */
export async function getBlockedUsersMap(
  netids: string[]
): Promise<Map<string, Set<string>>> {
  const blockedMap = new Map<string, Set<string>>();

  // Initialize empty sets for all users
  netids.forEach((netid) => {
    blockedMap.set(netid, new Set<string>());
  });

  // Fetch all blocks where any of the netids are involved (as blocker or blocked)
  const [blockerDocs, blockedDocs] = await Promise.all([
    // Get blocks where user is the blocker
    db
      .collection(BLOCKED_USERS_COLLECTION)
      .where('blockerNetid', 'in', netids.slice(0, 10)) // Firestore 'in' limit is 10
      .get(),
    // Get blocks where user is blocked
    db
      .collection(BLOCKED_USERS_COLLECTION)
      .where('blockedNetid', 'in', netids.slice(0, 10)) // Firestore 'in' limit is 10
      .get(),
  ]);

  // Process blocks where user is the blocker
  blockerDocs.forEach((doc) => {
    const data = doc.data() as BlockedUserDoc;
    const set = blockedMap.get(data.blockerNetid);
    if (set) {
      set.add(data.blockedNetid);
    }
  });

  // Process blocks where user is blocked (bidirectional blocking)
  blockedDocs.forEach((doc) => {
    const data = doc.data() as BlockedUserDoc;
    const set = blockedMap.get(data.blockedNetid);
    if (set) {
      set.add(data.blockerNetid); // Add blocker to blocked user's set
    }
  });

  // If we have more than 10 netids, we need to batch the queries
  if (netids.length > 10) {
    for (let i = 10; i < netids.length; i += 10) {
      const batch = netids.slice(i, i + 10);

      const [batchBlockerDocs, batchBlockedDocs] = await Promise.all([
        db
          .collection(BLOCKED_USERS_COLLECTION)
          .where('blockerNetid', 'in', batch)
          .get(),
        db
          .collection(BLOCKED_USERS_COLLECTION)
          .where('blockedNetid', 'in', batch)
          .get(),
      ]);

      batchBlockerDocs.forEach((doc) => {
        const data = doc.data() as BlockedUserDoc;
        const set = blockedMap.get(data.blockerNetid);
        if (set) {
          set.add(data.blockedNetid);
        }
      });

      batchBlockedDocs.forEach((doc) => {
        const data = doc.data() as BlockedUserDoc;
        const set = blockedMap.get(data.blockedNetid);
        if (set) {
          set.add(data.blockerNetid);
        }
      });
    }
  }

  return blockedMap;
}

/**
 * Convert BlockedUserDoc to BlockedUserResponse (for API responses)
 * @param blockDoc - The block document from Firestore
 * @returns BlockedUserResponse with ISO string timestamps
 */
export function blockedUserToResponse(
  blockDoc: BlockedUserDoc
): BlockedUserResponse {
  return {
    blockerNetid: blockDoc.blockerNetid,
    blockedNetid: blockDoc.blockedNetid,
    createdAt:
      blockDoc.createdAt instanceof Date
        ? blockDoc.createdAt.toISOString()
        : blockDoc.createdAt.toDate().toISOString(),
  };
}
