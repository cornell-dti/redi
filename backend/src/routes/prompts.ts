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

/**
 * GET /api/prompts/:promptId/answers/:netid
 * Get a specific user's answer to a prompt (requires authentication)
 * Only accessible if the requested user is in your matches for this prompt
 */
router.get(
  '/api/prompts/:promptId/answers/:netid',
  authenticatedRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { promptId, netid: targetNetid } = req.params;

      // Get netid from authenticated user
      const viewerNetid = await getNetidFromAuth(req.user!.uid);
      if (!viewerNetid) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Security: Verify that targetNetid is in the viewer's matches for this prompt
      const viewerMatches = await getWeeklyMatch(viewerNetid, promptId);
      if (!viewerMatches || !viewerMatches.matches.includes(targetNetid)) {
        return res.status(403).json({
          error: 'You can only view answers from your matches',
        });
      }

      // Fetch the target user's answer
      const answer = await getPromptAnswer(targetNetid, promptId);

      if (!answer) {
        return res.status(200).json({
          netid: targetNetid,
          promptId,
          answer: '',
          createdAt: new Date().toISOString(),
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

/**
 * POST /api/prompts/:promptId/matches/batch
 * Get batch data for matches (profiles + nudge statuses)
 * This endpoint dramatically reduces API calls by fetching all match data in one request
 *
 * Request body: {
 *   netids: string[]  // Array of netids to fetch
 * }
 *
 * Response: {
 *   profiles: ProfileResponse[]  // Array of profiles with privacy filtering
 *   nudgeStatuses: NudgeStatusResponse[]  // Array of nudge statuses for each match
 * }
 */
router.post(
  '/api/prompts/:promptId/matches/batch',
  authenticatedRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { promptId } = req.params;
      const { netids }: { netids: string[] } = req.body;

      // Validate request
      if (!netids || !Array.isArray(netids)) {
        return res.status(400).json({ error: 'netids array is required' });
      }

      if (netids.length === 0) {
        return res.status(200).json({ profiles: [], nudgeStatuses: [] });
      }

      if (netids.length > 50) {
        return res.status(400).json({
          error: 'Maximum 50 netids allowed per batch request',
        });
      }

      // Get authenticated user's netid
      const viewerNetid = await getNetidFromAuth(req.user!.uid);
      if (!viewerNetid) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Import needed functions from services
      const { getNudgeStatus } = require('../services/nudgesService');
      const {
        determineViewContext,
        getProfileWithAge,
        isUserBlocked,
      } = require('../utils/profilePrivacy');

      // Helper function from profiles.ts
      const profileDocToResponse = (doc: any): any => ({
        netid: doc.netid,
        firstName: doc.firstName,
        bio: doc.bio,
        gender: doc.gender,
        birthdate:
          doc.birthdate instanceof Date
            ? doc.birthdate.toISOString()
            : doc.birthdate.toDate().toISOString(),
        hometown: doc.hometown,
        pronouns: doc.pronouns,
        ethnicity: doc.ethnicity,
        sexualOrientation: doc.sexualOrientation,
        showGenderOnProfile: doc.showGenderOnProfile,
        showPronounsOnProfile: doc.showPronounsOnProfile,
        showHometownOnProfile: doc.showHometownOnProfile,
        showCollegeOnProfile: doc.showCollegeOnProfile,
        showEthnicityOnProfile: doc.showEthnicityOnProfile,
        showSexualOrientationOnProfile: doc.showSexualOrientationOnProfile,
        prompts: doc.prompts,
        instagram: doc.instagram,
        snapchat: doc.snapchat,
        phoneNumber: doc.phoneNumber,
        linkedIn: doc.linkedIn,
        github: doc.github,
        website: doc.website,
        clubs: doc.clubs,
        interests: doc.interests,
        year: doc.year,
        school: doc.school,
        major: doc.major,
        pictures: doc.pictures,
        createdAt:
          doc.createdAt instanceof Date
            ? doc.createdAt.toISOString()
            : doc.createdAt.toDate().toISOString(),
        updatedAt:
          doc.updatedAt instanceof Date
            ? doc.updatedAt.toISOString()
            : doc.updatedAt.toDate().toISOString(),
      });

      // Check if user is admin
      const isAdmin = async (firebaseUid: string): Promise<boolean> => {
        try {
          const adminDoc = await db.collection('admins').doc(firebaseUid).get();
          return adminDoc.exists && !adminDoc.data()?.disabled;
        } catch (error) {
          return false;
        }
      };

      const userIsAdmin = await isAdmin(req.user!.uid);

      // Fetch all profiles in parallel
      const profilePromises = netids.map(async (netid: string) => {
        try {
          const snapshot = await db
            .collection('profiles')
            .where('netid', '==', netid)
            .limit(1)
            .get();

          if (snapshot.empty) {
            return null;
          }

          const doc = snapshot.docs[0];
          const profile = profileDocToResponse({
            id: doc.id,
            ...doc.data(),
          });

          // Check blocking
          const viewerBlockedUser = await isUserBlocked(viewerNetid, netid, db);
          const userBlockedViewer = await isUserBlocked(netid, viewerNetid, db);

          if (viewerBlockedUser || userBlockedViewer) {
            return null;
          }

          // Apply privacy filtering
          const context = await determineViewContext(
            viewerNetid,
            netid,
            userIsAdmin,
            db
          );

          return getProfileWithAge(profile, context);
        } catch (error) {
          console.error(`Error fetching profile for ${netid}:`, error);
          return null;
        }
      });

      // Fetch all nudge statuses in parallel
      const nudgePromises = netids.map(async (netid: string) => {
        try {
          return await getNudgeStatus(viewerNetid, netid, promptId);
        } catch (error) {
          console.error(`Error fetching nudge status for ${netid}:`, error);
          return { sent: false, received: false, mutual: false };
        }
      });

      // Wait for all requests to complete
      const [profiles, nudgeStatuses] = await Promise.all([
        Promise.all(profilePromises),
        Promise.all(nudgePromises),
      ]);

      // Filter out null profiles
      const validProfiles = profiles.filter((p) => p !== null);

      res.status(200).json({
        profiles: validProfiles,
        nudgeStatuses,
      });
    } catch (error) {
      console.error('Error in batch match endpoint:', error);
      res.status(500).json({ error: 'Failed to fetch batch match data' });
    }
  }
);

export default router;
