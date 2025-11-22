import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../firebaseAdmin';
import {
  ProfileDoc,
  WeeklyMatchDoc,
  WeeklyMatchDocWrite,
  WeeklyMatchResponse,
} from '../../types';
import { getBlockedUsersMap } from './blockingService';
import { UserData, findMatchesForUser } from './matchingAlgorithm';
import { getPreferences } from './preferencesService';
import { getUsersWhoAnswered } from './promptsService';

const MATCHES_COLLECTION = 'weeklyMatches';
const PROFILES_COLLECTION = 'profiles';

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
  appendIfExists: boolean = false
): Promise<WeeklyMatchDoc> {
  const docId = `${netid}_${promptId}`;

  // Check if document already exists
  const existingDoc = await db.collection(MATCHES_COLLECTION).doc(docId).get();

  if (existingDoc.exists) {
    if (!appendIfExists) {
      const existingData = existingDoc.data() as WeeklyMatchDoc;
      const existingMatchesList = existingData.matches.join(', ');
      console.warn(
        `⚠️  Matches already exist for ${netid} on prompt ${promptId}. ` +
          `Existing matches: ${existingMatchesList}`
      );
      throw new Error(
        `Matches already exist for ${netid} on prompt ${promptId}. ` +
          `Use appendIfExists=true to add more matches.`
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
          `Either duplicates or already at max (3).`
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

    const addedMatchesList = newMatchesAdded.join(', ');
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
    `✅ Creating new matches for ${netid} on prompt ${promptId}: ${matches.slice(0, 3).join(', ')}`
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
    .where('netid', '==', netid)
    .where('promptId', '==', promptId)
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
  limit: number = 10
): Promise<WeeklyMatchDoc[]> {
  const now = new Date();

  const snapshot = await db
    .collection(MATCHES_COLLECTION)
    .where('netid', '==', netid)
    .where('expiresAt', '>', now)
    .orderBy('expiresAt', 'desc')
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

  // Calculate document ID (same format as createWeeklyMatch)
  const docId = `${netid}_${promptId}`;
  const docRef = db.collection(MATCHES_COLLECTION).doc(docId);

  // Use transaction to prevent race conditions during concurrent reveals
  await db.runTransaction(async (transaction) => {
    // Use document reference directly (not query) for proper transaction handling
    const doc = await transaction.get(docRef);

    if (!doc.exists) {
      throw new Error('Match not found');
    }

    const matchDoc = doc.data() as WeeklyMatchDoc;

    if (matchIndex >= matchDoc.matches.length) {
      throw new Error('Match index out of bounds');
    }

    // Create updated revealed array
    const revealed = [...matchDoc.revealed];
    revealed[matchIndex] = true;

    // Update within transaction (atomic read-modify-write)
    transaction.update(docRef, { revealed });
  });

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
 * Generate mutual matches for all users who answered a prompt
 * Uses two-phase algorithm to guarantee 100% mutuality
 * @param promptId - The prompt ID to generate matches for
 * @returns Promise resolving to number of users matched
 */
export async function generateMatchesForPrompt(
  promptId: string
): Promise<number> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Starting TWO-PHASE MUTUAL match generation for prompt: ${promptId}`);
  console.log(`${'='.repeat(60)}\n`);

  // Get all users who answered the prompt
  const userNetids = await getUsersWhoAnswered(promptId);
  console.log(`📊 Found ${userNetids.length} users who answered the prompt\n`);

  if (userNetids.length === 0) {
    console.log('⚠️  No users to match');
    return 0;
  }

  // Get profiles and preferences for all users
  const userDataMap = await getUserDataMap(userNetids);

  // Track previous matches to avoid duplicates across ALL prompts (excluding current prompt)
  const previousMatchesMap = await getPreviousMatchesMap(userNetids, promptId);

  // Get blocked users map (bidirectional blocking)
  const blockedUsersMap = await getBlockedUsersMap(userNetids);
  console.log(`🚫 Fetched blocking relationships for ${userNetids.length} users\n`);

  // =============================================================================
  // PHASE 1: Calculate potential matches for all users
  // =============================================================================
  console.log(`${'='.repeat(60)}`);
  console.log('PHASE 1: Calculating potential matches for all users...');
  console.log(`${'='.repeat(60)}\n`);

  const potentialMatches = new Map<string, string[]>();
  let usersSkipped = 0;

  for (const netid of userNetids) {
    try {
      const userData = userDataMap.get(netid);
      if (!userData || !userData.profile || !userData.preferences) {
        console.log(`⚠️  Skipping ${netid}: missing profile or preferences`);
        usersSkipped++;
        potentialMatches.set(netid, []);
        continue;
      }

      // Use existing findMatchesForUser function
      const matches = findMatchesForUser(
        netid,
        userData,
        userDataMap,
        previousMatchesMap.get(netid) || new Set(),
        blockedUsersMap.get(netid) || new Set()
      );

      // Filter out any empty strings, nulls, or invalid values
      const validMatches = matches.filter(
        (m) =>
          m && // Not null/undefined
          typeof m === 'string' && // Is a string
          m.trim() !== '' && // Not empty or whitespace
          m !== netid // Not matching with self
      );

      potentialMatches.set(netid, validMatches);

      if (validMatches.length > 0) {
        console.log(`  ${netid}: ${validMatches.length} potential matches → [${validMatches.join(', ')}]`);
      } else {
        console.log(`  ${netid}: 0 potential matches`);
      }
    } catch (error) {
      console.error(`❌ Error finding matches for ${netid}:`, error);
      potentialMatches.set(netid, []);
    }
  }

  console.log(`\n✓ Phase 1 complete. Processed ${userNetids.length - usersSkipped} users, skipped ${usersSkipped}\n`);

  // =============================================================================
  // PHASE 1.5: Retry with relaxed criteria for users with 0 matches
  // =============================================================================
  console.log(`${'='.repeat(60)}`);
  console.log('PHASE 1.5: Retrying with relaxed criteria for users with 0 matches...');
  console.log(`${'='.repeat(60)}\n`);

  let usersRetried = 0;
  let usersFoundMatchesRelaxed = 0;

  for (const netid of userNetids) {
    const currentMatches = potentialMatches.get(netid) || [];

    // Only retry if user got 0 matches in strict mode
    if (currentMatches.length === 0) {
      try {
        const userData = userDataMap.get(netid);
        if (!userData || !userData.profile || !userData.preferences) {
          continue; // Already logged in Phase 1
        }

        usersRetried++;

        // Use findMatchesForUser with relaxed=true
        const relaxedMatches = findMatchesForUser(
          netid,
          userData,
          userDataMap,
          previousMatchesMap.get(netid) || new Set(),
          blockedUsersMap.get(netid) || new Set(),
          true // RELAXED MODE
        );

        // Filter out any empty strings, nulls, or invalid values
        const validMatches = relaxedMatches.filter(
          (m) =>
            m && // Not null/undefined
            typeof m === 'string' && // Is a string
            m.trim() !== '' && // Not empty or whitespace
            m !== netid // Not matching with self
        );

        if (validMatches.length > 0) {
          potentialMatches.set(netid, validMatches);
          usersFoundMatchesRelaxed++;
          console.log(`  ♻️  ${netid}: Found ${validMatches.length} relaxed matches → [${validMatches.join(', ')}]`);
        } else {
          console.log(`  ⚠️  ${netid}: Still 0 matches even with relaxed criteria`);
        }
      } catch (error) {
        console.error(`❌ Error finding relaxed matches for ${netid}:`, error);
      }
    }
  }

  console.log(`\n✓ Phase 1.5 complete.`);
  console.log(`  Users retried with relaxed criteria: ${usersRetried}`);
  console.log(`  Users who found matches via relaxed mode: ${usersFoundMatchesRelaxed}\n`);

  // =============================================================================
  // PHASE 2: Create only mutual pairs
  // =============================================================================
  console.log(`${'='.repeat(60)}`);
  console.log('PHASE 2: Creating mutual matches...');
  console.log(`${'='.repeat(60)}\n`);

  const finalMatches = new Map<string, string[]>();
  const processedPairs = new Set<string>(); // Track processed pairs to avoid duplicates
  let mutualPairsFound = 0;
  let nonMutualPairsSkipped = 0;

  // Initialize all users with empty arrays
  for (const netid of userNetids) {
    finalMatches.set(netid, []);
  }

  for (const [userA, userAMatches] of potentialMatches) {
    for (const userB of userAMatches) {
      // Create unique pair identifier (sorted to handle both directions)
      const pairId = [userA, userB].sort().join('-');

      // Skip if we've already processed this pair
      if (processedPairs.has(pairId)) {
        continue;
      }

      // Check if B also has A in their potential matches
      const userBMatches = potentialMatches.get(userB) || [];

      if (userBMatches.includes(userA)) {
        // MUTUAL MATCH FOUND!
        const userAFinal = finalMatches.get(userA) || [];
        const userBFinal = finalMatches.get(userB) || [];

        // CRITICAL: Only add match if BOTH users have room (guarantees mutuality)
        if (userAFinal.length < 3 && userBFinal.length < 3) {
          console.log(`  ✓ Mutual match: ${userA} ↔ ${userB}`);
          userAFinal.push(userB);
          userBFinal.push(userA);
          finalMatches.set(userA, userAFinal);
          finalMatches.set(userB, userBFinal);
          mutualPairsFound++;
        } else {
          console.log(
            `  ⚠️  Mutual but skipped (limit): ${userA} ↔ ${userB} ` +
              `(A has ${userAFinal.length}, B has ${userBFinal.length})`
          );
        }

        // Mark this pair as processed regardless (don't retry)
        processedPairs.add(pairId);
      } else {
        // Non-mutual pair - skip it
        console.log(`  ✗ Non-mutual: ${userA} → ${userB} (but ${userB} ↛ ${userA})`);
        nonMutualPairsSkipped++;
      }
    }
  }

  console.log(`\n✓ Phase 2 complete.`);
  console.log(`  Mutual pairs created: ${mutualPairsFound}`);
  console.log(`  Non-mutual pairs skipped: ${nonMutualPairsSkipped}\n`);

  // =============================================================================
  // STATISTICS
  // =============================================================================
  console.log(`${'='.repeat(60)}`);
  console.log('MATCH GENERATION STATISTICS');
  console.log(`${'='.repeat(60)}\n`);

  let users0Matches = 0;
  let users1Match = 0;
  let users2Matches = 0;
  let users3Matches = 0;

  for (const [, matches] of finalMatches) {
    const count = matches.length;
    if (count === 0) users0Matches++;
    else if (count === 1) users1Match++;
    else if (count === 2) users2Matches++;
    else if (count === 3) users3Matches++;
  }

  console.log(`Total users processed: ${userNetids.length}`);
  console.log(`Users with 0 matches: ${users0Matches}`);
  console.log(`Users with 1 match: ${users1Match}`);
  console.log(`Users with 2 matches: ${users2Matches}`);
  console.log(`Users with 3 matches: ${users3Matches}`);
  console.log(`Total mutual pairs: ${mutualPairsFound}\n`);

  // =============================================================================
  // PHASE 3: Write to Firestore
  // =============================================================================
  console.log(`${'='.repeat(60)}`);
  console.log('PHASE 3: Writing matches to Firestore...');
  console.log(`${'='.repeat(60)}\n`);

  let matchedCount = 0;
  let writeErrors = 0;

  for (const [netid, matches] of finalMatches) {
    if (matches.length > 0) {
      try {
        await createWeeklyMatch(netid, promptId, matches);
        console.log(`  ✓ Wrote ${matches.length} matches for ${netid}: [${matches.join(', ')}]`);
        matchedCount++;
      } catch (error) {
        console.error(`  ✗ Failed to write matches for ${netid}:`, error);
        writeErrors++;
      }
    } else {
      console.log(`  ⚠️  No matches for ${netid} - skipping write`);
    }
  }

  console.log(`\n✓ Phase 3 complete.`);
  console.log(`  Successfully wrote: ${matchedCount} users`);
  console.log(`  Write errors: ${writeErrors}\n`);

  // Update prompt status to completed
  try {
    const promptRef = db.collection('weeklyPrompts').doc(promptId);
    const promptDoc = await promptRef.get();
    if (promptDoc.exists) {
      await promptRef.update({
        status: 'completed',
        matchesGeneratedAt: FieldValue.serverTimestamp(),
        active: false,
      });
      console.log(`✓ Updated prompt ${promptId} status to completed\n`);
    }
  } catch (error) {
    console.warn(`⚠️  Could not update prompt ${promptId} status:`, error);
  }

  console.log(`${'='.repeat(60)}`);
  console.log('MATCH GENERATION COMPLETE');
  console.log(`${'='.repeat(60)}\n`);
  console.log(`✅ ${matchedCount} users successfully matched with guaranteed mutuality\n`);

  return matchedCount;
}

/**
 * Validate that all matches are mutual
 * Use this for testing and post-generation verification
 * @param promptId - The prompt ID to validate
 * @returns Promise resolving to validation result with any errors found
 */
export async function validateMatchMutuality(promptId: string): Promise<{
  isValid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Validating match mutuality for prompt: ${promptId}`);
  console.log(`${'='.repeat(60)}\n`);

  // Fetch all match documents for this prompt
  const matchesSnapshot = await db
    .collection(MATCHES_COLLECTION)
    .where('promptId', '==', promptId)
    .get();

  const allMatches = new Map<string, string[]>();

  // Build map of all matches
  matchesSnapshot.forEach((doc) => {
    const data = doc.data() as WeeklyMatchDoc;
    const netid = data.netid;
    const matches = data.matches || [];

    // Check for empty strings or null values
    const invalidValues = matches.filter(
      (m: any) => !m || typeof m !== 'string' || m.trim() === ''
    );

    if (invalidValues.length > 0) {
      errors.push(
        `${netid} has invalid match values: ${JSON.stringify(invalidValues)}`
      );
    }

    allMatches.set(netid, matches);
  });

  console.log(`📊 Found ${allMatches.size} users with matches\n`);

  // Check mutuality
  let mutualPairsChecked = 0;
  for (const [userA, userAMatches] of allMatches) {
    for (const userB of userAMatches) {
      const userBMatches = allMatches.get(userB);

      if (!userBMatches) {
        errors.push(`${userA} → ${userB}, but ${userB} has no match document`);
      } else if (!userBMatches.includes(userA)) {
        errors.push(
          `${userA} → ${userB}, but ${userB} ↛ ${userA} (NON-MUTUAL)`
        );
      } else {
        mutualPairsChecked++;
      }
    }
  }

  console.log(`✓ Checked ${mutualPairsChecked} mutual pairs\n`);

  if (errors.length === 0) {
    console.log('✅ All matches are mutual and valid!\n');
  } else {
    console.log(`❌ Found ${errors.length} validation errors:\n`);
    errors.forEach((error) => console.log(`  - ${error}`));
    console.log();
  }

  console.log(`${'='.repeat(60)}\n`);

  return {
    isValid: errors.length === 0,
    errors,
  };
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
 * Get ALL previous matches for multiple users across all prompts
 * This prevents users from ever matching with the same person twice
 * @param netids - Array of netids
 * @param currentPromptId - Current prompt ID to exclude (in case of regeneration)
 * @returns Map of netid to set of ALL previously matched netids (across all prompts)
 */
async function getPreviousMatchesMap(
  netids: string[],
  currentPromptId: string
): Promise<Map<string, Set<string>>> {
  const previousMatchesMap = new Map<string, Set<string>>();

  for (const netid of netids) {
    const matchedNetids = new Set<string>();

    // Fetch ALL match documents for this user (including expired ones)
    // This ensures we never match the same people twice, even across different weeks
    const allMatchesSnapshot = await db
      .collection(MATCHES_COLLECTION)
      .where('netid', '==', netid)
      .get();

    allMatchesSnapshot.docs.forEach((doc) => {
      const match = doc.data() as WeeklyMatchDoc;

      // Exclude matches from the CURRENT prompt (in case we're regenerating)
      // Include matches from ALL OTHER prompts (prevents cross-prompt duplicates)
      if (match.promptId === currentPromptId) {
        return; // Skip current prompt matches (we're regenerating these)
      }

      // Add all matched netids from this prompt to the exclusion set
      match.matches.forEach((matchedNetid) => {
        matchedNetids.add(matchedNetid);
      });
    });

    previousMatchesMap.set(netid, matchedNetids);
  }

  return previousMatchesMap;
}
