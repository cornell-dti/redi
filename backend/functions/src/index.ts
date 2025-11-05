import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { generateMatchesForPrompt } from './services/matchingService';

// Firebase Admin is initialized in firebaseAdmin.ts (imported by services)
const db = admin.firestore();

/**
 * Scheduled function that runs every Monday at 12:01 AM Eastern Time
 * Activates the prompt for the current week
 */
export const activateWeeklyPrompt = onSchedule(
  {
    schedule: '1 0 * * 1', // Every Monday at 12:01 AM
    timeZone: 'America/New_York',
  },
  async () => {
    try {
      console.log('Starting weekly prompt activation');

      const today = new Date();
      const promptId = generatePromptId(today);

      console.log(`Looking for prompt with ID: ${promptId}`);

      // Get the prompt for this week
      const promptDoc = await db
        .collection('weeklyPrompts')
        .doc(promptId)
        .get();

      if (!promptDoc.exists) {
        console.error(`No prompt found for week ${promptId}`);
        return;
      }

      const promptData = promptDoc.data();
      const releaseDate = promptData?.releaseDate
        ? toDate(promptData.releaseDate)
        : null;

      // Verify the release date is today
      if (!releaseDate || !isSameDay(releaseDate, today)) {
        console.error(
          `Prompt ${promptId} release date (${releaseDate}) ` +
            `does not match today (${today})`
        );
        return;
      }

      // Deactivate all other prompts
      // NOTE: Old matches remain visible until Friday when they expire.
      // This is intentional - matches have an expiresAt field set to next Friday,
      // so they automatically disappear when new matches are generated.
      const activePrompts = await db
        .collection('weeklyPrompts')
        .where('active', '==', true)
        .get();

      const batch = db.batch();

      activePrompts.docs.forEach((doc) => {
        batch.update(doc.ref, { active: false });
        console.log(`Deactivating prompt: ${doc.id}`);
      });

      // Activate the new prompt
      batch.update(promptDoc.ref, {
        active: true,
        status: 'active',
        activatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();

      console.log(`Successfully activated prompt: ${promptId}`);
      console.log(`Question: ${promptData?.question}`);
    } catch (error) {
      console.error('Error activating weekly prompt:', error);
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
    schedule: '1 0 * * 5', // Every Friday at 12:01 AM
    timeZone: 'America/New_York',
  },
  async () => {
    try {
      console.log('Starting weekly match generation');

      // Get the active prompt
      const activePromptSnapshot = await db
        .collection('weeklyPrompts')
        .where('active', '==', true)
        .limit(1)
        .get();

      if (activePromptSnapshot.empty) {
        console.error('No active prompt found');
        return;
      }

      const activePromptDoc = activePromptSnapshot.docs[0];
      const promptId = activePromptDoc.id;
      const promptData = activePromptDoc.data();

      console.log(`Generating matches for prompt: ${promptId}`);
      console.log(`Question: ${promptData.question}`);

      // Verify match date is today
      const matchDate = promptData.matchDate
        ? toDate(promptData.matchDate)
        : null;
      const today = new Date();

      if (!matchDate || !isSameDay(matchDate, today)) {
        console.error(
          `Prompt ${promptId} match date (${matchDate}) ` +
            `does not match today (${today})`
        );
        return;
      }

      // Generate matches using shared service
      // NOTE: New matches are created with expiresAt set to next Friday (7 days).
      // Old matches from previous prompts automatically expire now since their
      // expiresAt date has passed, ensuring only current matches are visible.
      const matchedCount = await generateMatchesForPrompt(promptId);

      console.log(
        `Match generation complete. Created matches for ${matchedCount} users.`
      );
    } catch (error) {
      console.error('Error generating weekly matches:', error);
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
  if (dateValue && typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }

  // If it's a string or number, try to convert it
  if (typeof dateValue === 'string' || typeof dateValue === 'number') {
    return new Date(dateValue);
  }

  // If it's an object with seconds (Firestore Timestamp-like structure)
  if (dateValue && typeof dateValue.seconds === 'number') {
    return new Date(dateValue.seconds * 1000);
  }

  // Fallback: try to convert it directly
  return new Date(dateValue);
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

  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
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
