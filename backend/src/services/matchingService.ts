import { db } from '../../firebaseAdmin';
import {
  WeeklyMatchDoc,
  WeeklyMatchDocWrite,
  WeeklyMatchResponse,
  ProfileDoc,
  PreferencesDoc,
} from '../../types';
import { FieldValue } from 'firebase-admin/firestore';
import { getUsersWhoAnswered } from './promptsService';
import { getPreferences } from './preferencesService';
import { UserData, findMatchesForUser } from './matchingAlgorithm';

const MATCHES_COLLECTION = 'weeklyMatches';
const PROFILES_COLLECTION = 'profiles';

// =============================================================================
// WEEKLY MATCHES OPERATIONS
// =============================================================================

/**
 * Create weekly matches for a user
 * @param netid - User's Cornell NetID
 * @param promptId - The prompt ID for this week
 * @param matches - Array of matched netids (up to 3)
 * @returns Promise resolving to the created WeeklyMatchDoc
 */
export async function createWeeklyMatch(
  netid: string,
  promptId: string,
  matches: string[]
): Promise<WeeklyMatchDoc> {
  const docId = `${netid}_${promptId}`;

  const matchDoc: WeeklyMatchDocWrite = {
    netid,
    promptId,
    matches: matches.slice(0, 3), // Ensure max 3 matches
    revealed: matches.slice(0, 3).map(() => false), // All matches start unrevealed
    createdAt: FieldValue.serverTimestamp(),
  };

  await db.collection(MATCHES_COLLECTION).doc(docId).set(matchDoc);

  return getWeeklyMatch(netid, promptId) as Promise<WeeklyMatchDoc>;
}

/**
 * Get a user's matches for a specific prompt
 * @param netid - User's Cornell NetID
 * @param promptId - The prompt ID
 * @returns Promise resolving to WeeklyMatchDoc or null if not found
 */
export async function getWeeklyMatch(
  netid: string,
  promptId: string
): Promise<WeeklyMatchDoc | null> {
  const docId = `${netid}_${promptId}`;
  const doc = await db.collection(MATCHES_COLLECTION).doc(docId).get();

  if (!doc.exists) {
    return null;
  }

  return doc.data() as WeeklyMatchDoc;
}

/**
 * Get all matches for a user across all prompts
 * @param netid - User's Cornell NetID
 * @param limit - Maximum number of matches to return (default: 10)
 * @returns Promise resolving to array of WeeklyMatchDoc
 */
export async function getUserMatchHistory(
  netid: string,
  limit: number = 10
): Promise<WeeklyMatchDoc[]> {
  const snapshot = await db
    .collection(MATCHES_COLLECTION)
    .where('netid', '==', netid)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => doc.data() as WeeklyMatchDoc);
}

/**
 * Reveal a specific match for a user
 * @param netid - User's Cornell NetID
 * @param promptId - The prompt ID
 * @param matchIndex - Index of the match to reveal (0-2)
 * @returns Promise resolving to the updated WeeklyMatchDoc
 */
export async function revealMatch(
  netid: string,
  promptId: string,
  matchIndex: number
): Promise<WeeklyMatchDoc> {
  if (matchIndex < 0 || matchIndex > 2) {
    throw new Error('Match index must be between 0 and 2');
  }

  const docId = `${netid}_${promptId}`;
  const matchDoc = await getWeeklyMatch(netid, promptId);

  if (!matchDoc) {
    throw new Error('Match not found');
  }

  if (matchIndex >= matchDoc.matches.length) {
    throw new Error('Match index out of bounds');
  }

  const revealed = [...matchDoc.revealed];
  revealed[matchIndex] = true;

  await db.collection(MATCHES_COLLECTION).doc(docId).update({ revealed });

  return getWeeklyMatch(netid, promptId) as Promise<WeeklyMatchDoc>;
}

/**
 * Convert Firestore match doc to API response format
 * @param doc - WeeklyMatchDoc from Firestore
 * @returns WeeklyMatchResponse with ISO string timestamps
 */
export function matchToResponse(doc: WeeklyMatchDoc): WeeklyMatchResponse {
  return {
    netid: doc.netid,
    promptId: doc.promptId,
    matches: doc.matches,
    revealed: doc.revealed,
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : doc.createdAt.toDate().toISOString(),
  };
}

// =============================================================================
// MATCHING ALGORITHM
// =============================================================================

/**
 * Generate matches for all users who answered a prompt
 * @param promptId - The prompt ID to generate matches for
 * @returns Promise resolving to number of users matched
 */
export async function generateMatchesForPrompt(
  promptId: string
): Promise<number> {
  console.log(`Starting match generation for prompt: ${promptId}`);

  // Get all users who answered the prompt
  const userNetids = await getUsersWhoAnswered(promptId);
  console.log(`Found ${userNetids.length} users who answered the prompt`);

  if (userNetids.length === 0) {
    return 0;
  }

  // Get profiles and preferences for all users
  const userDataMap = await getUserDataMap(userNetids);

  // Track previous matches to avoid duplicates
  const previousMatchesMap = await getPreviousMatchesMap(userNetids);

  // Generate matches for each user
  let matchedCount = 0;
  for (const netid of userNetids) {
    try {
      const userData = userDataMap.get(netid);
      if (!userData || !userData.profile || !userData.preferences) {
        console.log(`Skipping user ${netid}: missing profile or preferences`);
        continue;
      }

      const matches = findMatchesForUser(
        netid,
        userData,
        userDataMap,
        previousMatchesMap.get(netid) || new Set()
      );

      if (matches.length > 0) {
        await createWeeklyMatch(netid, promptId, matches);
        matchedCount++;
        console.log(`Created ${matches.length} matches for user ${netid}`);
      } else {
        console.log(`No compatible matches found for user ${netid}`);
      }
    } catch (error) {
      console.error(`Error generating matches for user ${netid}:`, error);
    }
  }

  console.log(`Match generation complete. Matched ${matchedCount} users.`);
  return matchedCount;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get profiles and preferences for multiple users
 * @param netids - Array of netids
 * @returns Map of netid to user data
 */
async function getUserDataMap(
  netids: string[]
): Promise<Map<string, UserData>> {
  const userDataMap = new Map<string, UserData>();

  // Fetch all profiles
  const profilesSnapshot = await db
    .collection(PROFILES_COLLECTION)
    .where('netid', 'in', netids.slice(0, 10)) // Firestore 'in' limit is 10
    .get();

  const profiles = new Map<string, ProfileDoc>();
  profilesSnapshot.docs.forEach((doc) => {
    const profile = doc.data() as ProfileDoc;
    profiles.set(profile.netid, profile);
  });

  // If more than 10 users, fetch in batches
  if (netids.length > 10) {
    for (let i = 10; i < netids.length; i += 10) {
      const batch = netids.slice(i, i + 10);
      const batchSnapshot = await db
        .collection(PROFILES_COLLECTION)
        .where('netid', 'in', batch)
        .get();

      batchSnapshot.docs.forEach((doc) => {
        const profile = doc.data() as ProfileDoc;
        profiles.set(profile.netid, profile);
      });
    }
  }

  // Fetch all preferences
  for (const netid of netids) {
    const preferences = await getPreferences(netid);
    userDataMap.set(netid, {
      profile: profiles.get(netid) || null,
      preferences,
    });
  }

  return userDataMap;
}

/**
 * Get previous matches for multiple users
 * @param netids - Array of netids
 * @returns Map of netid to set of previously matched netids
 */
async function getPreviousMatchesMap(
  netids: string[]
): Promise<Map<string, Set<string>>> {
  const previousMatchesMap = new Map<string, Set<string>>();

  for (const netid of netids) {
    const matches = await getUserMatchHistory(netid, 20); // Check last 20 weeks
    const matchedNetids = new Set<string>();

    matches.forEach((match) => {
      match.matches.forEach((matchedNetid) => {
        matchedNetids.add(matchedNetid);
      });
    });

    previousMatchesMap.set(netid, matchedNetids);
  }

  return previousMatchesMap;
}
