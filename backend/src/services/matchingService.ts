import { db } from '../../firebaseAdmin';
import {
  WeeklyMatchDoc,
  WeeklyMatchDocWrite,
  WeeklyMatchResponse,
  ProfileDoc,
  PreferencesDoc,
  Gender,
  Year,
} from '../../types';
import { FieldValue } from 'firebase-admin/firestore';
import { getUsersWhoAnswered } from './promptsService';
import { getPreferences } from './preferencesService';

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

      const matches = await findMatchesForUser(
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

/**
 * Find up to 3 compatible matches for a user
 * @param netid - User's Cornell NetID
 * @param userData - User's profile and preferences
 * @param allUsersMap - Map of all users' data
 * @param previousMatches - Set of netids the user has been matched with before
 * @returns Array of up to 3 matched netids
 */
async function findMatchesForUser(
  netid: string,
  userData: UserData,
  allUsersMap: Map<string, UserData>,
  previousMatches: Set<string>
): Promise<string[]> {
  const { profile, preferences } = userData;

  // TypeScript type guard - this should never happen due to check in caller
  if (!profile || !preferences) {
    return [];
  }

  // Calculate compatibility scores for all potential matches
  const compatibilityScores: Array<{ netid: string; score: number }> = [];

  for (const [candidateNetid, candidateData] of allUsersMap.entries()) {
    // Skip self
    if (candidateNetid === netid) continue;

    // Skip if missing data
    if (!candidateData.profile || !candidateData.preferences) continue;

    // Check if mutually compatible
    const isCompatible = checkMutualCompatibility(
      profile,
      preferences,
      candidateData.profile,
      candidateData.preferences
    );

    if (!isCompatible) continue;

    // Check if already matched in previous weeks
    if (previousMatches.has(candidateNetid)) continue;

    // Calculate compatibility score
    const score = calculateCompatibilityScore(
      profile,
      preferences,
      candidateData.profile,
      candidateData.preferences
    );

    compatibilityScores.push({ netid: candidateNetid, score });
  }

  // Sort by compatibility score (descending) and return top 3
  compatibilityScores.sort((a, b) => b.score - a.score);
  return compatibilityScores.slice(0, 3).map((match) => match.netid);
}

/**
 * Check if two users are mutually compatible based on preferences
 * @param profileA - First user's profile
 * @param preferencesA - First user's preferences
 * @param profileB - Second user's profile
 * @param preferencesB - Second user's preferences
 * @returns true if mutually compatible, false otherwise
 */
function checkMutualCompatibility(
  profileA: ProfileDoc,
  preferencesA: PreferencesDoc,
  profileB: ProfileDoc,
  preferencesB: PreferencesDoc
): boolean {
  // Check A's preferences against B's profile
  const aLikesB = checkCompatibility(profileB, preferencesA);

  // Check B's preferences against A's profile
  const bLikesA = checkCompatibility(profileA, preferencesB);

  return aLikesB && bLikesA;
}

/**
 * Check if a profile matches user's preferences
 * @param profile - The profile to check
 * @param preferences - User's preferences
 * @returns true if compatible, false otherwise
 */
function checkCompatibility(
  profile: ProfileDoc,
  preferences: PreferencesDoc
): boolean {
  // Check gender preference
  if (
    preferences.genders.length > 0 &&
    !preferences.genders.includes(profile.gender)
  ) {
    return false;
  }

  // Check age range
  const age = calculateAge(profile.birthdate);
  if (age < preferences.ageRange.min || age > preferences.ageRange.max) {
    return false;
  }

  // Check year preference
  const yearStr = getYearString(profile.year);
  if (preferences.years.length > 0 && !preferences.years.includes(yearStr)) {
    return false;
  }

  // Check school preference (empty array means all schools accepted)
  if (
    preferences.schools.length > 0 &&
    !preferences.schools.includes(profile.school)
  ) {
    return false;
  }

  // Check major preference (empty array means all majors accepted)
  if (preferences.majors.length > 0) {
    const hasMatchingMajor = profile.major.some((userMajor) =>
      preferences.majors.includes(userMajor)
    );
    if (!hasMatchingMajor) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate compatibility score between two users (0-100)
 * Higher score means better match
 * @param profileA - First user's profile
 * @param preferencesA - First user's preferences
 * @param profileB - Second user's profile
 * @param preferencesB - Second user's preferences
 * @returns Compatibility score (0-100)
 */
function calculateCompatibilityScore(
  profileA: ProfileDoc,
  preferencesA: PreferencesDoc,
  profileB: ProfileDoc,
  preferencesB: PreferencesDoc
): number {
  let score = 0;

  // School match (20 points)
  if (profileA.school === profileB.school) {
    score += 20;
  }

  // Major overlap (15 points)
  const majorOverlap = profileA.major.filter((major) =>
    profileB.major.includes(major)
  ).length;
  if (majorOverlap > 0) {
    score += Math.min(15, majorOverlap * 5);
  }

  // Year proximity (15 points)
  const yearDiff = Math.abs(profileA.year - profileB.year);
  score += Math.max(0, 15 - yearDiff * 3);

  // Age proximity within preferences (15 points)
  const ageA = calculateAge(profileA.birthdate);
  const ageB = calculateAge(profileB.birthdate);
  const ageDiff = Math.abs(ageA - ageB);
  score += Math.max(0, 15 - ageDiff * 2);

  // Interest overlap (20 points)
  if (profileA.interests && profileB.interests) {
    const interestOverlap = profileA.interests.filter((interest) =>
      profileB.interests?.includes(interest)
    ).length;
    score += Math.min(20, interestOverlap * 4);
  }

  // Club overlap (15 points)
  if (profileA.clubs && profileB.clubs) {
    const clubOverlap = profileA.clubs.filter((club) =>
      profileB.clubs?.includes(club)
    ).length;
    score += Math.min(15, clubOverlap * 5);
  }

  return score;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

interface UserData {
  profile: ProfileDoc | null;
  preferences: PreferencesDoc | null;
}

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

/**
 * Calculate age from birthdate
 * @param birthdate - Firestore timestamp or Date
 * @returns Age in years
 */
function calculateAge(birthdate: Date | any): number {
  const birth = birthdate instanceof Date ? birthdate : birthdate.toDate();
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Convert numeric year to Year string
 * @param year - Numeric year (e.g., 2025)
 * @returns Year string (e.g., "Senior")
 */
function getYearString(year: number): Year {
  const currentYear = new Date().getFullYear();
  const yearsUntilGrad = year - currentYear;

  if (yearsUntilGrad >= 4) return 'Freshman';
  if (yearsUntilGrad === 3) return 'Sophomore';
  if (yearsUntilGrad === 2) return 'Junior';
  if (yearsUntilGrad === 1) return 'Senior';
  if (yearsUntilGrad === 0) return 'Senior';
  if (yearsUntilGrad < 0) return 'Graduate';

  return 'Graduate';
}
