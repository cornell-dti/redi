import express from 'express';
import { db } from '../../firebaseAdmin';
import {
  CreateWeeklyPromptAnswerInput,
  WeeklyPromptResponse,
  WeeklyPromptAnswerResponse,
  WeeklyMatchResponse,
  UpdateWeeklyMatchRevealedInput,
} from '../../types';
import {
  getActivePrompt,
  getPromptById,
  submitPromptAnswer,
  getPromptAnswer,
  promptToResponse,
  answerToResponse,
} from '../services/promptsService';
import {
  getWeeklyMatch,
  getUserMatchHistory,
  revealMatch,
  matchToResponse,
} from '../services/matchingService';

const router = express.Router();

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
// USER VERIFICATION HELPER
// =============================================================================

/**
 * Verifies that a user exists in the database and retrieves their Cornell NetID
 * @param firebaseUid - The Firebase authentication UID for the user
 * @returns Promise resolving to the user's NetID if found, null otherwise
 */
const verifyUserExists = async (
  firebaseUid: string
): Promise<string | null> => {
  try {
    const userSnapshot = await db
      .collection('users')
      .where('firebaseUid', '==', firebaseUid)
      .get();

    if (userSnapshot.empty) {
      return null;
    }

    return userSnapshot.docs[0].data().netid;
  } catch (error) {
    console.error('Error verifying user:', error);
    return null;
  }
};

// =============================================================================
// PROMPT ENDPOINTS
// =============================================================================

/**
 * GET /api/prompts/active
 * Get the currently active prompt
 * @route GET /api/prompts/active
 * @group Prompts - User prompt operations
 * @param {string} firebaseUid.query.required - Firebase authentication UID
 * @returns {WeeklyPromptResponse} Active prompt data
 * @returns {Error} 400 - Missing firebaseUid
 * @returns {Error} 404 - No active prompt or user not found
 * @returns {Error} 500 - Internal server error
 */
router.get('/api/prompts/active', async (req, res) => {
  try {
    const { firebaseUid } = req.query;

    if (!firebaseUid || typeof firebaseUid !== 'string') {
      return res.status(400).json({ error: 'firebaseUid is required' });
    }

    // Verify user exists
    const netid = await verifyUserExists(firebaseUid);
    if (!netid) {
      return res.status(404).json({ error: 'User not found' });
    }

    const prompt = await getActivePrompt();

    if (!prompt) {
      return res.status(404).json({ error: 'No active prompt available' });
    }

    const response = promptToResponse(prompt);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching active prompt:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * GET /api/prompts/:promptId
 * Get a specific prompt by ID
 * @route GET /api/prompts/:promptId
 * @group Prompts - User prompt operations
 * @param {string} promptId.path.required - Prompt ID (year-week format)
 * @param {string} firebaseUid.query.required - Firebase authentication UID
 * @returns {WeeklyPromptResponse} Prompt data
 * @returns {Error} 400 - Missing firebaseUid
 * @returns {Error} 404 - Prompt or user not found
 * @returns {Error} 500 - Internal server error
 */
router.get('/api/prompts/:promptId', async (req, res) => {
  try {
    const { promptId } = req.params;
    const { firebaseUid } = req.query;

    if (!firebaseUid || typeof firebaseUid !== 'string') {
      return res.status(400).json({ error: 'firebaseUid is required' });
    }

    // Verify user exists
    const netid = await verifyUserExists(firebaseUid);
    if (!netid) {
      return res.status(404).json({ error: 'User not found' });
    }

    const prompt = await getPromptById(promptId);

    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    const response = promptToResponse(prompt);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching prompt:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

// =============================================================================
// ANSWER ENDPOINTS
// =============================================================================

/**
 * POST /api/prompts/answers
 * Submit an answer to the current active prompt
 * @route POST /api/prompts/answers
 * @group Prompts - User prompt operations
 * @param {string} firebaseUid.body.required - Firebase authentication UID
 * @param {string} promptId.body.required - Prompt ID to answer
 * @param {string} answer.body.required - User's answer text (max 500 characters)
 * @returns {WeeklyPromptAnswerResponse} Created answer
 * @returns {Error} 400 - Invalid data or validation errors
 * @returns {Error} 404 - User or prompt not found
 * @returns {Error} 409 - Answer already submitted
 * @returns {Error} 500 - Internal server error
 */
router.post('/api/prompts/answers', async (req, res) => {
  try {
    const {
      firebaseUid,
      promptId,
      answer,
    }: {
      firebaseUid: string;
      promptId: string;
      answer: string;
    } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ error: 'firebaseUid is required' });
    }

    if (!promptId || !answer) {
      return res.status(400).json({
        error: 'promptId and answer are required',
      });
    }

    // Verify user exists and get netid
    const netid = await verifyUserExists(firebaseUid);
    if (!netid) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify prompt exists
    const prompt = await getPromptById(promptId);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    // Verify prompt is active
    if (!prompt.active) {
      return res.status(400).json({
        error: 'This prompt is not currently active',
      });
    }

    // Check if answer is within date range
    const now = new Date();
    const releaseDate = toDate(prompt.releaseDate);
    const matchDate = toDate(prompt.matchDate);

    if (now < releaseDate) {
      return res.status(400).json({
        error: 'This prompt has not been released yet',
      });
    }

    if (now > matchDate) {
      return res.status(400).json({
        error: 'The deadline for this prompt has passed',
      });
    }

    // Submit the answer
    const answerData: CreateWeeklyPromptAnswerInput = {
      netid,
      promptId,
      answer: answer.trim(),
    };

    const answerDoc = await submitPromptAnswer(answerData);
    const response = answerToResponse(answerDoc);

    res.status(201).json(response);
  } catch (error) {
    console.error('Error submitting answer:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Handle specific error cases
    if (errorMessage.includes('already submitted')) {
      return res.status(409).json({ error: errorMessage });
    }

    res.status(500).json({ error: errorMessage });
  }
});

/**
 * GET /api/prompts/:promptId/answers/me
 * Get current user's answer to a specific prompt
 * @route GET /api/prompts/:promptId/answers/me
 * @group Prompts - User prompt operations
 * @param {string} promptId.path.required - Prompt ID
 * @param {string} firebaseUid.query.required - Firebase authentication UID
 * @returns {WeeklyPromptAnswerResponse} User's answer
 * @returns {Error} 400 - Missing firebaseUid
 * @returns {Error} 404 - User, prompt, or answer not found
 * @returns {Error} 500 - Internal server error
 */
router.get('/api/prompts/:promptId/answers/me', async (req, res) => {
  try {
    const { promptId } = req.params;
    const { firebaseUid } = req.query;

    if (!firebaseUid || typeof firebaseUid !== 'string') {
      return res.status(400).json({ error: 'firebaseUid is required' });
    }

    // Verify user exists and get netid
    const netid = await verifyUserExists(firebaseUid);
    if (!netid) {
      return res.status(404).json({ error: 'User not found' });
    }

    const answer = await getPromptAnswer(netid, promptId);

    if (!answer) {
      return res.status(404).json({
        error: 'No answer found for this prompt',
      });
    }

    const response = answerToResponse(answer);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching answer:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

// =============================================================================
// MATCH ENDPOINTS
// =============================================================================

/**
 * GET /api/prompts/:promptId/matches
 * Get current user's matches for a specific prompt
 * @route GET /api/prompts/:promptId/matches
 * @group Prompts - User prompt operations
 * @param {string} promptId.path.required - Prompt ID
 * @param {string} firebaseUid.query.required - Firebase authentication UID
 * @returns {WeeklyMatchResponse} User's matches for the prompt
 * @returns {Error} 400 - Missing firebaseUid
 * @returns {Error} 404 - User, prompt, or matches not found
 * @returns {Error} 500 - Internal server error
 */
router.get('/api/prompts/:promptId/matches', async (req, res) => {
  try {
    const { promptId } = req.params;
    const { firebaseUid } = req.query;

    if (!firebaseUid || typeof firebaseUid !== 'string') {
      return res.status(400).json({ error: 'firebaseUid is required' });
    }

    // Verify user exists and get netid
    const netid = await verifyUserExists(firebaseUid);
    if (!netid) {
      return res.status(404).json({ error: 'User not found' });
    }

    const matches = await getWeeklyMatch(netid, promptId);

    if (!matches) {
      return res.status(404).json({
        error: 'No matches found for this prompt',
      });
    }

    const response = matchToResponse(matches);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching matches:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * GET /api/prompts/matches/history
 * Get current user's match history across all prompts
 * @route GET /api/prompts/matches/history
 * @group Prompts - User prompt operations
 * @param {string} firebaseUid.query.required - Firebase authentication UID
 * @param {number} [limit=10] - Maximum number of match records to return
 * @returns {WeeklyMatchResponse[]} Array of user's match history
 * @returns {Error} 400 - Missing firebaseUid
 * @returns {Error} 404 - User not found
 * @returns {Error} 500 - Internal server error
 */
router.get('/api/prompts/matches/history', async (req, res) => {
  try {
    const { firebaseUid, limit = '10' } = req.query;

    if (!firebaseUid || typeof firebaseUid !== 'string') {
      return res.status(400).json({ error: 'firebaseUid is required' });
    }

    // Verify user exists and get netid
    const netid = await verifyUserExists(firebaseUid);
    if (!netid) {
      return res.status(404).json({ error: 'User not found' });
    }

    const matches = await getUserMatchHistory(netid, parseInt(limit as string));
    const response = matches.map(matchToResponse);

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching match history:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * POST /api/prompts/:promptId/matches/reveal
 * Reveal a specific match
 * @route POST /api/prompts/:promptId/matches/reveal
 * @group Prompts - User prompt operations
 * @param {string} promptId.path.required - Prompt ID
 * @param {string} firebaseUid.body.required - Firebase authentication UID
 * @param {number} matchIndex.body.required - Index of the match to reveal (0-2)
 * @returns {WeeklyMatchResponse} Updated match with revealed status
 * @returns {Error} 400 - Invalid data or match index out of bounds
 * @returns {Error} 404 - User, prompt, or matches not found
 * @returns {Error} 500 - Internal server error
 */
router.post('/api/prompts/:promptId/matches/reveal', async (req, res) => {
  try {
    const { promptId } = req.params;
    const {
      firebaseUid,
      matchIndex,
    }: {
      firebaseUid: string;
      matchIndex: number;
    } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ error: 'firebaseUid is required' });
    }

    if (matchIndex === undefined || matchIndex === null) {
      return res.status(400).json({ error: 'matchIndex is required' });
    }

    // Verify user exists and get netid
    const netid = await verifyUserExists(firebaseUid);
    if (!netid) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Reveal the match
    const updatedMatch = await revealMatch(netid, promptId, matchIndex);
    const response = matchToResponse(updatedMatch);

    res.status(200).json(response);
  } catch (error) {
    console.error('Error revealing match:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Handle specific error cases
    if (
      errorMessage.includes('Match index') ||
      errorMessage.includes('out of bounds')
    ) {
      return res.status(400).json({ error: errorMessage });
    }

    if (errorMessage.includes('not found')) {
      return res.status(404).json({ error: errorMessage });
    }

    res.status(500).json({ error: errorMessage });
  }
});

export default router;
