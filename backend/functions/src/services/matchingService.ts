import * as admin from 'firebase-admin';
import { UserData, findMatchesForUser } from './matchingAlgorithm';
import { PreferencesDoc } from '../types';

const MATCHES_COLLECTION = 'weeklyMatches';
const PROFILES_COLLECTION = 'profiles';
const PREFERENCES_COLLECTION = 'preferences';
const ANSWERS_COLLECTION = 'weeklyPromptAnswers';

/**
 * Generate matches for all users who answered a prompt
 * @param promptId - The prompt ID to generate matches for
 * @param db - Firestore database instance
 * @return Promise resolving to number of users matched
 */
export async function generateMatchesForPrompt(
  promptId: string,
  db: admin.firestore.Firestore
): Promise<number> {
  console.log(`Starting match generation for prompt: ${promptId}`);

  // Get all users who answered the prompt
  const answersSnapshot = await db
    .collection(ANSWERS_COLLECTION)
    .where('promptId', '==', promptId)
    .get();

  const userNetids = answersSnapshot.docs.map(
    (doc) => doc.data().netid as string
  );

  console.log(`Found ${userNetids.length} users who answered the prompt`);

  if (userNetids.length === 0) {
    return 0;
  }

  // Get profiles and preferences for all users
  const userDataMap = await getUserDataMap(userNetids, db);

  // Track previous matches to avoid duplicates
  const previousMatchesMap = await getPreviousMatchesMap(userNetids, db);

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
        await createWeeklyMatch(netid, promptId, matches, db);
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

/**
 * Create weekly matches for a user
 * @param netid - User's Cornell NetID
 * @param promptId - The prompt ID for this week
 * @param matches - Array of matched netids (up to 3)
 * @param db - Firestore database instance
 */
async function createWeeklyMatch(
  netid: string,
  promptId: string,
  matches: string[],
  db: admin.firestore.Firestore
): Promise<void> {
  const docId = `${netid}_${promptId}`;

  const matchDoc = {
    netid,
    promptId,
    matches: matches.slice(0, 3), // Ensure max 3 matches
    revealed: matches.slice(0, 3).map(() => false), // All matches start unrevealed
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection(MATCHES_COLLECTION).doc(docId).set(matchDoc);
}

/**
 * Get profiles and preferences for multiple users
 * @param netids - Array of netids
 * @param db - Firestore database instance
 * @return Map of netid to user data
 */
async function getUserDataMap(
  netids: string[],
  db: admin.firestore.Firestore
): Promise<Map<string, UserData>> {
  const userDataMap = new Map<string, UserData>();

  // Fetch profiles in batches (Firestore 'in' limit is 10)
  const profiles = new Map<string, any>();

  for (let i = 0; i < netids.length; i += 10) {
    const batch = netids.slice(i, i + 10);
    const profilesSnapshot = await db
      .collection(PROFILES_COLLECTION)
      .where('netid', 'in', batch)
      .get();

    profilesSnapshot.docs.forEach((doc) => {
      const profile = doc.data();
      profiles.set(profile.netid, profile);
    });
  }

  // Fetch preferences for each user
  for (const netid of netids) {
    const preferencesDoc = await db
      .collection(PREFERENCES_COLLECTION)
      .doc(netid)
      .get();

    userDataMap.set(netid, {
      profile: profiles.get(netid) || null,
      preferences: preferencesDoc.exists
        ? (preferencesDoc.data() as PreferencesDoc)
        : null,
    });
  }

  return userDataMap;
}

/**
 * Get previous matches for multiple users
 * @param netids - Array of netids
 * @param db - Firestore database instance
 * @return Map of netid to set of previously matched netids
 */
async function getPreviousMatchesMap(
  netids: string[],
  db: admin.firestore.Firestore
): Promise<Map<string, Set<string>>> {
  const previousMatchesMap = new Map<string, Set<string>>();

  for (const netid of netids) {
    const matchesSnapshot = await db
      .collection(MATCHES_COLLECTION)
      .where('netid', '==', netid)
      .orderBy('createdAt', 'desc')
      .limit(20) // Check last 20 weeks
      .get();

    const matchedNetids = new Set<string>();

    matchesSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.matches && Array.isArray(data.matches)) {
        data.matches.forEach((matchedNetid: string) => {
          matchedNetids.add(matchedNetid);
        });
      }
    });

    previousMatchesMap.set(netid, matchedNetids);
  }

  return previousMatchesMap;
}
