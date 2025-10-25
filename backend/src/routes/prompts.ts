import express from 'express';
import { db } from '../../firebaseAdmin';
import { CreateWeeklyPromptAnswerInput } from '../../types';
import { AuthenticatedRequest, authenticateUser } from '../middleware/auth';
import { authenticatedRateLimit } from '../middleware/rateLimiting';
import { validate, validatePromptAnswer } from '../middleware/validation';
import {
  getUserMatchHistory,
  getWeeklyMatch,
  matchToResponse,
  revealMatch,
} from '../services/matchingService';
import {
  answerToResponse,
  getActivePrompt,
  getPromptAnswer,
  getPromptById,
  promptToResponse,
  submitPromptAnswer,
} from '../services/promptsService';

const router = express.Router();

// =============================================================================
// DATE CONVERSION HELPER
// =============================================================================

/**
 * Safely converts any date format to a JavaScript Date object
 */
function toDate(dateValue: any): Date {
  if (dateValue instanceof Date) {
    return dateValue;
  }

  if (dateValue && typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }

  if (typeof dateValue === 'string' || typeof dateValue === 'number') {
    return new Date(dateValue);
  }

  if (dateValue && typeof dateValue.seconds === 'number') {
    return new Date(dateValue.seconds * 1000);
  }

  return new Date(dateValue);
}

// =============================================================================
// USER VERIFICATION HELPER
// =============================================================================

/**
 * Gets netid from authenticated Firebase UID
 */
const getNetidFromAuth = async (
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
    console.error('Error getting netid:', error);
    return null;
  }
};

// =============================================================================
// PROMPT ENDPOINTS
// =============================================================================

/**
 * GET /api/prompts/active
 * Get the currently active prompt (requires authentication)
 */
router.get(
  '/api/prompts/active',
  authenticatedRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      // Verify user exists
      const netid = await getNetidFromAuth(req.user!.uid);
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
      res.status(500).json({ error: 'Failed to fetch active prompt' });
    }
  }
);

/**
 * GET /api/prompts/:promptId
 * Get a specific prompt by ID (requires authentication)
 */
router.get(
  '/api/prompts/:promptId',
  authenticatedRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { promptId } = req.params;

      // Verify user exists
      const netid = await getNetidFromAuth(req.user!.uid);
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
      res.status(500).json({ error: 'Failed to fetch prompt' });
    }
  }
);

// =============================================================================
// ANSWER ENDPOINTS
// =============================================================================

/**
 * POST /api/prompts/answers
 * Submit an answer to the current active prompt (requires authentication)
 */
router.post(
  '/api/prompts/answers',
  authenticatedRateLimit,
  authenticateUser,
  validatePromptAnswer,
  validate,
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const { promptId, answer }: { promptId: string; answer: string } =
        req.body;

      if (!promptId || !answer) {
        return res.status(400).json({
          error: 'promptId and answer are required',
        });
      }

      // Get netid from authenticated user
      const netid = await getNetidFromAuth(req.user!.uid);
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
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Handle specific error cases
      if (errorMessage.includes('already submitted')) {
        return res.status(409).json({ error: errorMessage });
      }

      res.status(500).json({ error: 'Failed to submit answer' });
    }
  }
) as any;

/**
 * GET /api/prompts/:promptId/answers/me
 * Get current user's answer to a specific prompt (requires authentication)
 */
router.get(
  '/api/prompts/:promptId/answers/me',
  authenticatedRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { promptId } = req.params;

      // Get netid from authenticated user
      const netid = await getNetidFromAuth(req.user!.uid);
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
      res.status(500).json({ error: 'Failed to fetch answer' });
    }
  }
);

// =============================================================================
// MATCH ENDPOINTS
// =============================================================================

/**
 * GET /api/prompts/:promptId/matches
 * Get current user's matches for a specific prompt (requires authentication)
 */
router.get(
  '/api/prompts/:promptId/matches',
  authenticatedRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { promptId } = req.params;

      // Get netid from authenticated user
      const netid = await getNetidFromAuth(req.user!.uid);
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
      res.status(500).json({ error: 'Failed to fetch matches' });
    }
  }
);

/**
 * GET /api/prompts/matches/history
 * Get current user's match history across all prompts (requires authentication)
 */
router.get(
  '/api/prompts/matches/history',
  authenticatedRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { limit = '10' } = req.query;

      // Get netid from authenticated user
      const netid = await getNetidFromAuth(req.user!.uid);
      if (!netid) {
        return res.status(404).json({ error: 'User not found' });
      }

      const matches = await getUserMatchHistory(
        netid,
        parseInt(limit as string)
      );
      const response = matches.map(matchToResponse);

      res.status(200).json(response);
    } catch (error) {
      console.error('Error fetching match history:', error);
      res.status(500).json({ error: 'Failed to fetch match history' });
    }
  }
);

/**
 * POST /api/prompts/:promptId/matches/reveal
 * Reveal a specific match (requires authentication)
 */
router.post(
  '/api/prompts/:promptId/matches/reveal',
  authenticatedRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { promptId } = req.params;
      const { matchIndex }: { matchIndex: number } = req.body;

      if (matchIndex === undefined || matchIndex === null) {
        return res.status(400).json({ error: 'matchIndex is required' });
      }

      // Get netid from authenticated user
      const netid = await getNetidFromAuth(req.user!.uid);
      if (!netid) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Reveal the match
      const updatedMatch = await revealMatch(netid, promptId, matchIndex);
      const response = matchToResponse(updatedMatch);

      res.status(200).json(response);
    } catch (error) {
      console.error('Error revealing match:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

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

      res.status(500).json({ error: 'Failed to reveal match' });
    }
  }
);

export default router;
