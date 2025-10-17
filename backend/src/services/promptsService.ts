import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../firebaseAdmin';
import {
  CreateWeeklyPromptAnswerInput,
  CreateWeeklyPromptInput,
  UpdateWeeklyPromptInput,
  WeeklyPromptAnswerDoc,
  WeeklyPromptAnswerDocWrite,
  WeeklyPromptAnswerResponse,
  WeeklyPromptDoc,
  WeeklyPromptDocWrite,
  WeeklyPromptResponse,
} from '../../types';

const PROMPTS_COLLECTION = 'weeklyPrompts';
const ANSWERS_COLLECTION = 'weeklyPromptAnswers';

// =============================================================================
// DATE CONVERSION HELPER
// =============================================================================

/**
 * Safely converts any date format to a JavaScript Date object
 * Handles: JavaScript Date objects, Firestore Timestamps, ISO strings, and other date-like values
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

// =============================================================================
// WEEKLY PROMPTS OPERATIONS
// =============================================================================

/**
 * Create a new weekly prompt
 * @param promptData - Prompt data (promptId, question, releaseDate, matchDate)
 * @returns Promise resolving to the created WeeklyPromptDoc
 */
export async function createWeeklyPrompt(
  promptData: CreateWeeklyPromptInput
): Promise<WeeklyPromptDoc> {
  // Validate dates
  validatePromptDates(promptData.releaseDate, promptData.matchDate);

  const promptDoc: WeeklyPromptDocWrite = {
    ...promptData,
    active: false, // New prompts start as inactive
    status: 'scheduled', // Initial status is scheduled
    createdAt: FieldValue.serverTimestamp(),
  };

  // Use promptId as document ID for efficient lookups
  await db
    .collection(PROMPTS_COLLECTION)
    .doc(promptData.promptId)
    .set(promptDoc);

  return getPromptById(promptData.promptId) as Promise<WeeklyPromptDoc>;
}

/**
 * Get a prompt by ID
 * @param promptId - The prompt ID (year-week format)
 * @returns Promise resolving to WeeklyPromptDoc or null if not found
 */
export async function getPromptById(
  promptId: string
): Promise<WeeklyPromptDoc | null> {
  const doc = await db.collection(PROMPTS_COLLECTION).doc(promptId).get();

  if (!doc.exists) {
    return null;
  }

  return doc.data() as WeeklyPromptDoc;
}

/**
 * Get the currently active prompt
 * @returns Promise resolving to WeeklyPromptDoc or null if no active prompt
 */
export async function getActivePrompt(): Promise<WeeklyPromptDoc | null> {
  const snapshot = await db
    .collection(PROMPTS_COLLECTION)
    .where('active', '==', true)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as WeeklyPromptDoc;
}

/**
 * Get all prompts with optional filtering
 * @param options - Filter options (active status, date range, limit)
 * @returns Promise resolving to array of WeeklyPromptDoc
 */
export async function getAllPrompts(options?: {
  active?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<WeeklyPromptDoc[]> {
  let query = db.collection(PROMPTS_COLLECTION).orderBy('releaseDate', 'desc');

  if (options?.active !== undefined) {
    query = query.where('active', '==', options.active) as any;
  }

  if (options?.startDate) {
    query = query.where('releaseDate', '>=', options.startDate) as any;
  }

  if (options?.endDate) {
    query = query.where('releaseDate', '<=', options.endDate) as any;
  }

  if (options?.limit) {
    query = query.limit(options.limit) as any;
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => doc.data() as WeeklyPromptDoc);
}

/**
 * Update a prompt
 * @param promptId - The prompt ID to update
 * @param updates - Partial prompt data to update
 * @returns Promise resolving to the updated WeeklyPromptDoc
 */
export async function updatePrompt(
  promptId: string,
  updates: UpdateWeeklyPromptInput
): Promise<WeeklyPromptDoc> {
  // Validate dates if being updated
  if (updates.releaseDate || updates.matchDate) {
    const existingPrompt = await getPromptById(promptId);
    if (!existingPrompt) {
      throw new Error('Prompt not found');
    }

    const releaseDate = updates.releaseDate || existingPrompt.releaseDate;
    const matchDate = updates.matchDate || existingPrompt.matchDate;
    validatePromptDates(releaseDate, matchDate);
  }

  await db.collection(PROMPTS_COLLECTION).doc(promptId).update(updates);

  return getPromptById(promptId) as Promise<WeeklyPromptDoc>;
}

/**
 * Delete a prompt
 * @param promptId - The prompt ID to delete
 * @returns Promise resolving when deletion is complete
 */
export async function deletePrompt(promptId: string): Promise<void> {
  await db.collection(PROMPTS_COLLECTION).doc(promptId).delete();
}

/**
 * Activate a prompt and deactivate all others
 * @param promptId - The prompt ID to activate
 * @returns Promise resolving to the activated WeeklyPromptDoc
 */
export async function activatePrompt(
  promptId: string
): Promise<WeeklyPromptDoc> {
  // Deactivate all prompts
  const allPrompts = await getAllPrompts({ active: true });
  const batch = db.batch();

  allPrompts.forEach((prompt) => {
    const ref = db.collection(PROMPTS_COLLECTION).doc(prompt.promptId);
    batch.update(ref, { active: false });
  });

  // Activate the specified prompt
  const promptRef = db.collection(PROMPTS_COLLECTION).doc(promptId);
  batch.update(promptRef, {
    active: true,
    status: 'active',
    activatedAt: FieldValue.serverTimestamp()
  });

  await batch.commit();

  return getPromptById(promptId) as Promise<WeeklyPromptDoc>;
}

/**
 * Convert Firestore prompt doc to API response format
 * @param doc - WeeklyPromptDoc from Firestore
 * @returns WeeklyPromptResponse with ISO string timestamps
 */
export function promptToResponse(doc: WeeklyPromptDoc): WeeklyPromptResponse {
  return {
    promptId: doc.promptId,
    question: doc.question,
    releaseDate: toDate(doc.releaseDate).toISOString(),
    matchDate: toDate(doc.matchDate).toISOString(),
    active: doc.active,
    status: doc.status,
    activatedAt: doc.activatedAt ? toDate(doc.activatedAt).toISOString() : undefined,
    matchesGeneratedAt: doc.matchesGeneratedAt ? toDate(doc.matchesGeneratedAt).toISOString() : undefined,
    createdAt: toDate(doc.createdAt).toISOString(),
  };
}

// =============================================================================
// WEEKLY PROMPT ANSWERS OPERATIONS
// =============================================================================

/**
 * Submit an answer to a prompt
 * @param answerData - Answer data (netid, promptId, answer)
 * @returns Promise resolving to the created WeeklyPromptAnswerDoc
 */
export async function submitPromptAnswer(
  answerData: CreateWeeklyPromptAnswerInput
): Promise<WeeklyPromptAnswerDoc> {
  // Validate answer length
  if (answerData.answer.length > 500) {
    throw new Error('Answer must be 500 characters or less');
  }

  if (answerData.answer.trim().length === 0) {
    throw new Error('Answer cannot be empty');
  }

  // Check if answer already exists
  const docId = `${answerData.netid}_${answerData.promptId}`;
  const existingAnswer = await getPromptAnswer(
    answerData.netid,
    answerData.promptId
  );

  if (existingAnswer) {
    throw new Error('Answer already submitted for this prompt');
  }

  const answerDoc: WeeklyPromptAnswerDocWrite = {
    ...answerData,
    createdAt: FieldValue.serverTimestamp(),
  };

  await db.collection(ANSWERS_COLLECTION).doc(docId).set(answerDoc);

  return getPromptAnswer(
    answerData.netid,
    answerData.promptId
  ) as Promise<WeeklyPromptAnswerDoc>;
}

/**
 * Get a user's answer to a specific prompt
 * @param netid - User's Cornell NetID
 * @param promptId - The prompt ID
 * @returns Promise resolving to WeeklyPromptAnswerDoc or null if not found
 */
export async function getPromptAnswer(
  netid: string,
  promptId: string
): Promise<WeeklyPromptAnswerDoc | null> {
  const docId = `${netid}_${promptId}`;
  const doc = await db.collection(ANSWERS_COLLECTION).doc(docId).get();

  if (!doc.exists) {
    return null;
  }

  return doc.data() as WeeklyPromptAnswerDoc;
}

/**
 * Get all answers for a specific prompt
 * @param promptId - The prompt ID
 * @returns Promise resolving to array of WeeklyPromptAnswerDoc
 */
export async function getAnswersForPrompt(
  promptId: string
): Promise<WeeklyPromptAnswerDoc[]> {
  const snapshot = await db
    .collection(ANSWERS_COLLECTION)
    .where('promptId', '==', promptId)
    .get();

  return snapshot.docs.map((doc) => doc.data() as WeeklyPromptAnswerDoc);
}

/**
 * Get all netids of users who answered a specific prompt
 * @param promptId - The prompt ID
 * @returns Promise resolving to array of netids
 */
export async function getUsersWhoAnswered(promptId: string): Promise<string[]> {
  const answers = await getAnswersForPrompt(promptId);
  return answers.map((answer) => answer.netid);
}

/**
 * Convert Firestore answer doc to API response format
 * @param doc - WeeklyPromptAnswerDoc from Firestore
 * @returns WeeklyPromptAnswerResponse with ISO string timestamps
 */
export function answerToResponse(
  doc: WeeklyPromptAnswerDoc
): WeeklyPromptAnswerResponse {
  return {
    netid: doc.netid,
    promptId: doc.promptId,
    answer: doc.answer,
    createdAt: toDate(doc.createdAt).toISOString(),
  };
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate that match date is after release date
 * @param releaseDate - The release date
 * @param matchDate - The match date
 * @throws Error if dates are invalid
 */
function validatePromptDates(
  releaseDate: Date | any,
  matchDate: Date | any
): void {
  const release = toDate(releaseDate);
  const match = toDate(matchDate);

  // Validate that match date is after release date
  if (match.getTime() <= release.getTime()) {
    throw new Error('Match date must be after release date');
  }
}

/**
 * Generate a prompt ID from a date (year-week format)
 * @param date - The date to generate ID from
 * @returns Prompt ID in format "YYYY-WXX" (e.g., "2025-W42")
 */
export function generatePromptId(date: Date): string {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const daysSinceStartOfYear =
    (date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
  const weekNumber = Math.ceil(
    (daysSinceStartOfYear + startOfYear.getDay()) / 7
  );

  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}
