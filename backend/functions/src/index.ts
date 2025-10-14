import * as admin from "firebase-admin";
import {onSchedule} from "firebase-functions/v2/scheduler";

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

/**
 * Scheduled function that runs every Monday at 12:01 AM Eastern Time
 * Activates the prompt for the current week
 */
export const activateWeeklyPrompt = onSchedule(
  {
    schedule: "1 0 * * 1", // Every Monday at 12:01 AM
    timeZone: "America/New_York",
  },
  async () => {
    try {
      console.log("Starting weekly prompt activation");

      const today = new Date();
      const promptId = generatePromptId(today);

      console.log(`Looking for prompt with ID: ${promptId}`);

      // Get the prompt for this week
      const promptDoc = await db
        .collection("weeklyPrompts")
        .doc(promptId)
        .get();

      if (!promptDoc.exists) {
        console.error(`No prompt found for week ${promptId}`);
        return;
      }

      const promptData = promptDoc.data();
      const releaseDate = promptData?.releaseDate ?
        toDate(promptData.releaseDate) :
        null;

      // Verify the release date is today
      if (!releaseDate || !isSameDay(releaseDate, today)) {
        console.error(
          `Prompt ${promptId} release date (${releaseDate}) ` +
          `does not match today (${today})`
        );
        return;
      }

      // Deactivate all other prompts
      const activePrompts = await db
        .collection("weeklyPrompts")
        .where("active", "==", true)
        .get();

      const batch = db.batch();

      activePrompts.docs.forEach((doc) => {
        batch.update(doc.ref, {active: false});
        console.log(`Deactivating prompt: ${doc.id}`);
      });

      // Activate the new prompt
      batch.update(promptDoc.ref, {active: true});

      await batch.commit();

      console.log(`Successfully activated prompt: ${promptId}`);
      console.log(`Question: ${promptData?.question}`);
    } catch (error) {
      console.error("Error activating weekly prompt:", error);
      throw error;
    }
  }
);

/**
 * Scheduled function that runs every Friday at 12:01 AM Eastern Time
 * Generates matches for all users who answered the current week's prompt
 */
export const generateWeeklyMatches = onSchedule(
  {
    schedule: "1 0 * * 5", // Every Friday at 12:01 AM
    timeZone: "America/New_York",
  },
  async () => {
    try {
      console.log("Starting weekly match generation");

      // Get the active prompt
      const activePromptSnapshot = await db
        .collection("weeklyPrompts")
        .where("active", "==", true)
        .limit(1)
        .get();

      if (activePromptSnapshot.empty) {
        console.error("No active prompt found");
        return;
      }

      const activePromptDoc = activePromptSnapshot.docs[0];
      const promptId = activePromptDoc.id;
      const promptData = activePromptDoc.data();

      console.log(`Generating matches for prompt: ${promptId}`);
      console.log(`Question: ${promptData.question}`);

      // Verify match date is today
      const matchDate = promptData.matchDate ?
        toDate(promptData.matchDate) :
        null;
      const today = new Date();

      if (!matchDate || !isSameDay(matchDate, today)) {
        console.error(
          `Prompt ${promptId} match date (${matchDate}) ` +
          `does not match today (${today})`
        );
        return;
      }

      // Get all users who answered this prompt
      const answersSnapshot = await db
        .collection("weeklyPromptAnswers")
        .where("promptId", "==", promptId)
        .get();

      const userNetids = answersSnapshot.docs.map(
        (doc) => doc.data().netid as string
      );

      console.log(`Found ${userNetids.length} users who answered the prompt`);

      if (userNetids.length === 0) {
        console.log("No users to match");
        return;
      }

      // Get profiles and preferences for all users
      const userDataMap = await getUserDataMap(userNetids);

      // Track previous matches to avoid duplicates
      const previousMatchesMap = await getPreviousMatchesMap(userNetids);

      // Generate matches for each user
      let matchedCount = 0;
      const batch = db.batch();

      for (const netid of userNetids) {
        try {
          const userData = userDataMap.get(netid);
          if (!userData || !userData.profile || !userData.preferences) {
            console.log(
              `Skipping user ${netid}: missing profile or preferences`
            );
            continue;
          }

          const matches = findMatchesForUser(
            netid,
            userData,
            userDataMap,
            previousMatchesMap.get(netid) || new Set()
          );

          if (matches.length > 0) {
            const docId = `${netid}_${promptId}`;
            const matchDoc = {
              netid,
              promptId,
              matches: matches.slice(0, 3),
              revealed: matches.slice(0, 3).map(() => false),
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            batch.set(db.collection("weeklyMatches").doc(docId), matchDoc);
            matchedCount++;
            console.log(`Created ${matches.length} matches for user ${netid}`);
          } else {
            console.log(`No compatible matches found for user ${netid}`);
          }
        } catch (error) {
          console.error(`Error generating matches for user ${netid}:`, error);
        }
      }

      await batch.commit();

      console.log(
        `Match generation complete. Created matches for ${matchedCount} users.`
      );
    } catch (error) {
      console.error("Error generating weekly matches:", error);
      throw error;
    }
  }
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Safely converts any date format to a JavaScript Date object
 * Handles: JavaScript Date objects, Firestore Timestamps,
 * ISO strings, and other date-like values
 * @param {any} dateValue - The date value to convert
 * @return {Date} JavaScript Date object
 */
function toDate(dateValue: any): Date {
  // If it's already a Date object, return as-is
  if (dateValue instanceof Date) {
    return dateValue;
  }

  // If it's a Firestore Timestamp with a toDate() method
  if (dateValue && typeof dateValue.toDate === "function") {
    return dateValue.toDate();
  }

  // If it's a string or number, try to convert it
  if (typeof dateValue === "string" || typeof dateValue === "number") {
    return new Date(dateValue);
  }

  // If it's an object with seconds (Firestore Timestamp-like structure)
  if (dateValue && typeof dateValue.seconds === "number") {
    return new Date(dateValue.seconds * 1000);
  }

  // Fallback: try to convert it directly
  return new Date(dateValue);
}

interface UserData {
  profile: any;
  preferences: any;
}

/**
 * Generate a prompt ID from a date (year-week format)
 * @param {Date} date - The date to generate ID from
 * @return {string} Prompt ID in format "YYYY-WXX"
 */
function generatePromptId(date: Date): string {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const daysSinceStartOfYear =
    (date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
  const weekNumber = Math.ceil(
    (daysSinceStartOfYear + startOfYear.getDay()) / 7
  );

  return `${year}-W${weekNumber.toString().padStart(2, "0")}`;
}

/**
 * Check if two dates are the same day
 * @param {Date} date1 - First date to compare
 * @param {Date} date2 - Second date to compare
 * @return {boolean} True if dates are on the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Get profiles and preferences for multiple users
 * @param {string[]} netids - Array of user NetIDs
 * @return {Promise<Map<string, UserData>>} Map of NetID to user data
 */
async function getUserDataMap(
  netids: string[]
): Promise<Map<string, UserData>> {
  const userDataMap = new Map<string, UserData>();

  // Fetch profiles in batches (Firestore 'in' limit is 10)
  const profiles = new Map<string, any>();

  for (let i = 0; i < netids.length; i += 10) {
    const batch = netids.slice(i, i + 10);
    const profilesSnapshot = await db
      .collection("profiles")
      .where("netid", "in", batch)
      .get();

    profilesSnapshot.docs.forEach((doc) => {
      const profile = doc.data();
      profiles.set(profile.netid, profile);
    });
  }

  // Fetch preferences for each user
  for (const netid of netids) {
    const preferencesDoc = await db.collection("preferences").doc(netid).get();

    userDataMap.set(netid, {
      profile: profiles.get(netid) || null,
      preferences: preferencesDoc.exists ? preferencesDoc.data() : null,
    });
  }

  return userDataMap;
}

/**
 * Get previous matches for multiple users
 * @param {string[]} netids - Array of user NetIDs
 * @return {Promise<Map<string, Set<string>>>} Map of NetID to matched NetIDs
 */
async function getPreviousMatchesMap(
  netids: string[]
): Promise<Map<string, Set<string>>> {
  const previousMatchesMap = new Map<string, Set<string>>();

  for (const netid of netids) {
    const matchesSnapshot = await db
      .collection("weeklyMatches")
      .where("netid", "==", netid)
      .orderBy("createdAt", "desc")
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

/**
 * Find up to 3 compatible matches for a user
 * @param {string} netid - User's NetID
 * @param {UserData} userData - User's profile and preferences
 * @param {Map<string, UserData>} allUsersMap - All users' data
 * @param {Set<string>} previousMatches - Set of previously matched NetIDs
 * @return {string[]} Array of up to 3 matched NetIDs
 */
function findMatchesForUser(
  netid: string,
  userData: UserData,
  allUsersMap: Map<string, UserData>,
  previousMatches: Set<string>
): string[] {
  const {profile, preferences} = userData;

  const compatibilityScores: Array<{ netid: string; score: number }> = [];

  for (const [candidateNetid, candidateData] of allUsersMap.entries()) {
    // Skip self
    if (candidateNetid === netid) continue;

    // Skip if missing data
    if (!candidateData.profile || !candidateData.preferences) continue;

    // Check mutual compatibility
    const isCompatible = checkMutualCompatibility(
      profile,
      preferences,
      candidateData.profile,
      candidateData.preferences
    );

    if (!isCompatible) continue;

    // Skip if already matched before
    if (previousMatches.has(candidateNetid)) continue;

    // Calculate compatibility score
    const score = calculateCompatibilityScore(profile, candidateData.profile);

    compatibilityScores.push({netid: candidateNetid, score});
  }

  // Sort by score and return top 3
  compatibilityScores.sort((a, b) => b.score - a.score);
  return compatibilityScores.slice(0, 3).map((match) => match.netid);
}

/**
 * Check mutual compatibility between two users
 * @param {any} profileA - First user's profile
 * @param {any} preferencesA - First user's preferences
 * @param {any} profileB - Second user's profile
 * @param {any} preferencesB - Second user's preferences
 * @return {boolean} True if users are mutually compatible
 */
function checkMutualCompatibility(
  profileA: any,
  preferencesA: any,
  profileB: any,
  preferencesB: any
): boolean {
  return (
    checkCompatibility(profileB, preferencesA) &&
    checkCompatibility(profileA, preferencesB)
  );
}

/**
 * Check if a profile matches preferences
 * @param {any} profile - User's profile to check
 * @param {any} preferences - Preferences to match against
 * @return {boolean} True if profile matches preferences
 */
function checkCompatibility(profile: any, preferences: any): boolean {
  // Gender check
  if (
    preferences.genders &&
    preferences.genders.length > 0 &&
    !preferences.genders.includes(profile.gender)
  ) {
    return false;
  }

  // Age check
  const age = calculateAge(profile.birthdate);
  if (age < preferences.ageRange.min || age > preferences.ageRange.max) {
    return false;
  }

  // Year check
  const yearStr = getYearString(profile.year);
  if (
    preferences.years &&
    preferences.years.length > 0 &&
    !preferences.years.includes(yearStr)
  ) {
    return false;
  }

  // School check
  if (
    preferences.schools &&
    preferences.schools.length > 0 &&
    !preferences.schools.includes(profile.school)
  ) {
    return false;
  }

  // Major check
  if (preferences.majors && preferences.majors.length > 0) {
    const hasMatchingMajor =
      profile.major &&
      profile.major.some((userMajor: string) =>
        preferences.majors.includes(userMajor)
      );
    if (!hasMatchingMajor) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate compatibility score (0-100)
 * Scores based on common attributes like school, major,
 * interests, clubs, age, and year
 * @param {any} profileA - First user's profile
 * @param {any} profileB - Second user's profile
 * @return {number} Compatibility score between 0-100
 */
function calculateCompatibilityScore(profileA: any, profileB: any): number {
  let score = 0;

  // School match (20 points)
  if (profileA.school === profileB.school) {
    score += 20;
  }

  // Major overlap (15 points)
  if (profileA.major && profileB.major) {
    const majorOverlap = profileA.major.filter((major: string) =>
      profileB.major.includes(major)
    ).length;
    if (majorOverlap > 0) {
      score += Math.min(15, majorOverlap * 5);
    }
  }

  // Year proximity (15 points)
  const yearDiff = Math.abs(profileA.year - profileB.year);
  score += Math.max(0, 15 - yearDiff * 3);

  // Age proximity (15 points)
  const ageA = calculateAge(profileA.birthdate);
  const ageB = calculateAge(profileB.birthdate);
  const ageDiff = Math.abs(ageA - ageB);
  score += Math.max(0, 15 - ageDiff * 2);

  // Interest overlap (20 points)
  if (profileA.interests && profileB.interests) {
    const interestOverlap = profileA.interests.filter((interest: string) =>
      profileB.interests.includes(interest)
    ).length;
    score += Math.min(20, interestOverlap * 4);
  }

  // Club overlap (15 points)
  if (profileA.clubs && profileB.clubs) {
    const clubOverlap = profileA.clubs.filter((club: string) =>
      profileB.clubs.includes(club)
    ).length;
    score += Math.min(15, clubOverlap * 5);
  }

  return score;
}

/**
 * Calculate age from birthdate
 * @param {any} birthdate - User's birthdate
 * @return {number} Age in years
 */
function calculateAge(birthdate: any): number {
  const birth = toDate(birthdate);
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
 * @param {number} year - Graduation year
 * @return {string} Year classification (Freshman, Sophomore, etc.)
 */
function getYearString(year: number): string {
  const currentYear = new Date().getFullYear();
  const yearsUntilGrad = year - currentYear;

  if (yearsUntilGrad >= 4) return "Freshman";
  if (yearsUntilGrad === 3) return "Sophomore";
  if (yearsUntilGrad === 2) return "Junior";
  if (yearsUntilGrad === 1 || yearsUntilGrad === 0) return "Senior";

  return "Graduate";
}
