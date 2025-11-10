import { db } from "../firebaseAdmin";
import {
  WeeklyMatchDoc,
  WeeklyMatchDocWrite,
  WeeklyMatchResponse,
  ProfileDoc,
} from "../types";
import { FieldValue } from "firebase-admin/firestore";
import { getUsersWhoAnswered } from "./promptsService";
import { getPreferences } from "./preferencesService";
import { UserData, findMatchesForUser } from "./matchingAlgorithm";
import { getBlockedUsersMap } from "./blockingService";

const MATCHES_COLLECTION = "weeklyMatches";
const PROFILES_COLLECTION = "profiles";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate the next Friday at 12:00 AM ET from a given date
 * @param fromDate - The date to calculate from (defaults to now)
 * @returns Date object set to next Friday at 12:00 AM ET
 */
function getNextFridayMidnight(fromDate: Date = new Date()): Date {
  const date = new Date(fromDate);

  // Set to midnight
  date.setHours(0, 0, 0, 0);

  // Get day of week (0 = Sunday, 5 = Friday)
  const dayOfWeek = date.getDay();

  // Calculate days until next Friday
  // If today is Friday (5), add 7 days to get next Friday
  // Otherwise, calculate days until next Friday
  let daysUntilFriday;
  if (dayOfWeek === 5) {
    // If it's Friday, expire next Friday (7 days)
    daysUntilFriday = 7;
  } else if (dayOfWeek < 5) {
    // If before Friday this week, expire this coming Friday
    daysUntilFriday = 5 - dayOfWeek;
  } else {
    // If after Friday (Saturday or Sunday), expire next Friday
    daysUntilFriday = 5 + (7 - dayOfWeek);
  }

  date.setDate(date.getDate() + daysUntilFriday);

  return date;
}

// =============================================================================
// WEEKLY MATCHES OPERATIONS
// =============================================================================

/**
 * Create weekly matches for a user
 * @param netid - User's Cornell NetID
 * @param promptId - The prompt ID for this week
 * @param matches - Array of matched netids (up to 3)
 * @param appendIfExists - If true, appends to existing matches (up to max 3).
 *                         If false, throws error if matches exist. Default: false
 * @returns Promise resolving to the created/updated WeeklyMatchDoc
 * @throws Error if matches already exist and appendIfExists is false
 */
export async function createWeeklyMatch(
  netid: string,
  promptId: string,
  matches: string[],
  appendIfExists = false
): Promise<WeeklyMatchDoc> {
  const docId = `${netid}_${promptId}`;

  // Check if document already exists
  const existingDoc = await db.collection(MATCHES_COLLECTION).doc(docId).get();

  if (existingDoc.exists) {
    if (!appendIfExists) {
      const existingData = existingDoc.data() as WeeklyMatchDoc;
      const existingMatchesList = existingData.matches.join(", ");
      console.warn(
        `⚠️  Matches already exist for ${netid} on prompt ${promptId}. ` +
          `Existing matches: ${existingMatchesList}`
      );
      throw new Error(
        `Matches already exist for ${netid} on prompt ${promptId}. ` +
          "Use appendIfExists=true to add more matches."
      );
    }

    // APPEND MODE: Merge new matches with existing ones
    const existingData = existingDoc.data() as WeeklyMatchDoc;

    // Combine existing and new matches, remove duplicates, limit to 3
    const combinedMatches = [...existingData.matches];
    const newMatchesAdded: string[] = [];

    for (const newMatch of matches) {
      if (!combinedMatches.includes(newMatch) && combinedMatches.length < 3) {
        combinedMatches.push(newMatch);
        newMatchesAdded.push(newMatch);
      }
    }

    if (newMatchesAdded.length === 0) {
      console.log(
        `ℹ️  No new matches added for ${netid} on prompt ${promptId}. ` +
          "Either duplicates or already at max (3)."
      );
      return getWeeklyMatch(netid, promptId) as Promise<WeeklyMatchDoc>;
    }

    // Update revealed array to match new length
    const updatedRevealed = [
      ...existingData.revealed,
      ...newMatchesAdded.map(() => false),
    ];

    // Update chatUnlocked array if it exists
    const updatedChatUnlocked = existingData.chatUnlocked
      ? [...existingData.chatUnlocked, ...newMatchesAdded.map(() => false)]
      : undefined;

    const addedMatchesList = newMatchesAdded.join(", ");
    console.log(
      `➕ Appending ${newMatchesAdded.length} new match(es) for ${netid} ` +
        `on prompt ${promptId}. Added: ${addedMatchesList}. ` +
        `Total matches: ${combinedMatches.length}`
    );

    const updateData: Partial<WeeklyMatchDoc> = {
      matches: combinedMatches,
      revealed: updatedRevealed,
    };

    if (updatedChatUnlocked) {
      updateData.chatUnlocked = updatedChatUnlocked;
    }

    await db.collection(MATCHES_COLLECTION).doc(docId).update(updateData);

    return getWeeklyMatch(netid, promptId) as Promise<WeeklyMatchDoc>;
  }

  // Document doesn't exist - create new
  // Calculate expiration date (next Friday at 12:00 AM ET)
  const expiresAt = getNextFridayMidnight();

  const matchDoc: WeeklyMatchDocWrite = {
    netid,
    promptId,
    matches: matches.slice(0, 3), // Ensure max 3 matches
    revealed: matches.slice(0, 3).map(() => false), // All matches start unrevealed
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: expiresAt, // Matches expire next Friday at midnight
  };

  console.log(
    `✅ Creating new matches for ${netid} on prompt ${promptId}: ${matches.slice(0, 3).join(", ")}`
  );

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
  // Query by netid and promptId to support both algorithm-generated and manually created matches
  const snapshot = await db
    .collection(MATCHES_COLLECTION)
    .where("netid", "==", netid)
    .where("promptId", "==", promptId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as WeeklyMatchDoc;
}

/**
 * Get all matches for a user across all prompts
 * Only returns non-expired matches (where expiresAt > now)
 * @param netid - User's Cornell NetID
 * @param limit - Maximum number of matches to return (default: 10)
 * @returns Promise resolving to array of WeeklyMatchDoc
 */
export async function getUserMatchHistory(
  netid: string,
  limit = 10
): Promise<WeeklyMatchDoc[]> {
  const now = new Date();

  const snapshot = await db
    .collection(MATCHES_COLLECTION)
    .where("netid", "==", netid)
    .where("expiresAt", ">", now)
    .orderBy("expiresAt", "desc")
    .orderBy("createdAt", "desc")
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
    throw new Error("Match index must be between 0 and 2");
  }

  const matchDoc = await getWeeklyMatch(netid, promptId);

  if (!matchDoc) {
    throw new Error("Match not found");
  }

  if (matchIndex >= matchDoc.matches.length) {
    throw new Error("Match index out of bounds");
  }

  const revealed = [...matchDoc.revealed];
  revealed[matchIndex] = true;

  // Query to find the document and update it (supports both ID formats)
  const snapshot = await db
    .collection(MATCHES_COLLECTION)
    .where("netid", "==", netid)
    .where("promptId", "==", promptId)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    await snapshot.docs[0].ref.update({ revealed });
  }

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
    chatUnlocked: doc.chatUnlocked,
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : doc.createdAt.toDate().toISOString(),
    expiresAt:
      doc.expiresAt instanceof Date
        ? doc.expiresAt.toISOString()
        : doc.expiresAt.toDate().toISOString(),
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

  // Track previous matches to avoid duplicates (excluding current prompt)
  const previousMatchesMap = await getPreviousMatchesMap(userNetids, promptId);

  // Get blocked users map (bidirectional blocking)
  const blockedUsersMap = await getBlockedUsersMap(userNetids);
  console.log(`Fetched blocking relationships for ${userNetids.length} users`);

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
        previousMatchesMap.get(netid) || new Set(),
        blockedUsersMap.get(netid) || new Set()
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

  // Update prompt status to completed
  await db.collection("weeklyPrompts").doc(promptId).update({
    status: "completed",
    matchesGeneratedAt: FieldValue.serverTimestamp(),
    active: false,
  });

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
    .where("netid", "in", netids.slice(0, 10)) // Firestore 'in' limit is 10
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
        .where("netid", "in", batch)
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
 * Get previous matches for multiple users (excluding current prompt)
 * @param netids - Array of netids
 * @param currentPromptId - Current prompt ID to exclude from previous matches
 * @returns Map of netid to set of previously matched netids (excluding current prompt)
 */
async function getPreviousMatchesMap(
  netids: string[],
  currentPromptId: string
): Promise<Map<string, Set<string>>> {
  const previousMatchesMap = new Map<string, Set<string>>();

  for (const netid of netids) {
    const matches = await getUserMatchHistory(netid, 20); // Check last 20 weeks
    const matchedNetids = new Set<string>();

    matches.forEach((match) => {
      // ONLY include matches from the CURRENT prompt (prevents within-prompt duplicates)
      // Exclude matches from OTHER prompts (allows same users to match across different prompts)
      if (match.promptId !== currentPromptId) {
        return;
      }

      match.matches.forEach((matchedNetid) => {
        matchedNetids.add(matchedNetid);
      });
    });

    previousMatchesMap.set(netid, matchedNetids);
  }

  return previousMatchesMap;
}
