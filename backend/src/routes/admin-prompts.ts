/**
 * Admin Prompts Routes
 *
 * Secure admin endpoints for managing weekly prompts.
 * All routes are protected by requireAdmin middleware which:
 * - Verifies Bearer token
 * - Checks admin custom claim
 * - Verifies user in admins collection
 *
 * All admin actions are logged to audit log for security and compliance.
 */

import express from 'express';
import { db } from '../../firebaseAdmin';
import {
  CreateWeeklyPromptInput,
  MatchStatsResponse,
  MatchWithProfile,
  ProfileDoc,
  PromptMatchDetailResponse,
  UpdateWeeklyPromptInput,
  WeeklyPromptAnswerWithProfile,
  WeeklyPromptDoc,
  WeeklyPromptResponse,
} from '../../types';
import { AdminRequest, requireAdmin } from '../middleware/adminAuth';
import {
  getIpAddress,
  getUserAgent,
  logAdminAction,
} from '../services/auditLog';
import { generateMatchesForPrompt } from '../services/matchingService';
import {
  activatePrompt,
  createWeeklyPrompt,
  deletePrompt,
  generatePromptId,
  getAllPrompts,
  getPromptById,
  promptToResponse,
  updatePrompt,
} from '../services/promptsService';

const router = express.Router();

// Apply admin middleware to ALL routes in this router
// This ensures every endpoint requires valid admin authentication
router.use(requireAdmin);

/**
 * POST /api/admin/prompts
 * Create a new weekly prompt
 *
 * @secured Requires admin authentication (Bearer token + admin claim)
 * @audit Logs CREATE_PROMPT action
 *
 * @param {CreateWeeklyPromptInput} promptData.body.required - Prompt data
 * @returns {WeeklyPromptResponse} 201 - Created prompt
 * @returns {Error} 400 - Invalid data or validation errors
 * @returns {Error} 401/403 - Unauthorized (handled by middleware)
 * @returns {Error} 409 - Prompt already exists for this week
 * @returns {Error} 500 - Internal server error
 */
router.post('/api/admin/prompts', async (req: AdminRequest, res) => {
  try {
    const promptData: CreateWeeklyPromptInput = req.body;

    // Validate required fields
    if (
      !promptData.promptId ||
      !promptData.question ||
      !promptData.releaseDate ||
      !promptData.matchDate
    ) {
      return res.status(400).json({
        error: 'promptId, question, releaseDate, and matchDate are required',
      });
    }

    // Check if prompt already exists
    const existingPrompt = await getPromptById(promptData.promptId);
    if (existingPrompt) {
      await logAdminAction(
        'CREATE_PROMPT',
        req.user!.uid,
        req.user!.email,
        'prompt',
        promptData.promptId,
        { error: 'Prompt already exists' },
        getIpAddress(req),
        getUserAgent(req),
        false,
        'Prompt already exists for this week'
      );

      return res.status(409).json({
        error: 'A prompt already exists for this week',
      });
    }

    // Convert string dates to Date objects if needed
    const promptDataWithDates = {
      ...promptData,
      releaseDate:
        typeof promptData.releaseDate === 'string'
          ? new Date(promptData.releaseDate)
          : promptData.releaseDate,
      matchDate:
        typeof promptData.matchDate === 'string'
          ? new Date(promptData.matchDate)
          : promptData.matchDate,
    };

    // Create the prompt
    const prompt: WeeklyPromptDoc =
      await createWeeklyPrompt(promptDataWithDates);
    const response: WeeklyPromptResponse = promptToResponse(prompt);

    // Log successful action
    await logAdminAction(
      'CREATE_PROMPT',
      req.user!.uid,
      req.user!.email,
      'prompt',
      promptData.promptId,
      {
        question: promptData.question,
        releaseDate:
          promptDataWithDates.releaseDate instanceof Date
            ? promptDataWithDates.releaseDate.toISOString()
            : promptDataWithDates.releaseDate,
        matchDate:
          promptDataWithDates.matchDate instanceof Date
            ? promptDataWithDates.matchDate.toISOString()
            : promptDataWithDates.matchDate,
      },
      getIpAddress(req),
      getUserAgent(req)
    );

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating prompt:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Log failed action
    await logAdminAction(
      'CREATE_PROMPT',
      req.user!.uid,
      req.user!.email,
      'prompt',
      req.body.promptId || 'unknown',
      { error: errorMessage },
      getIpAddress(req),
      getUserAgent(req),
      false,
      errorMessage
    );

    res.status(500).json({ error: errorMessage });
  }
});

/**
 * GET /api/admin/prompts
 * Get all prompts with optional filtering
 *
 * @secured Requires admin authentication
 *
 * @param {boolean} [active] - Filter by active status
 * @param {string} [startDate] - Filter by start date (ISO string)
 * @param {string} [endDate] - Filter by end date (ISO string)
 * @param {number} [limit=50] - Maximum number of prompts to return
 * @returns {WeeklyPromptResponse[]} 200 - Array of prompts
 * @returns {Error} 401/403 - Unauthorized (handled by middleware)
 * @returns {Error} 500 - Internal server error
 */
router.get('/api/admin/prompts', async (req: AdminRequest, res) => {
  try {
    const { active, startDate, endDate, limit = '50' } = req.query;

    // Build filter options
    interface PromptFilterOptions {
      limit: number;
      active?: boolean;
      startDate?: Date;
      endDate?: Date;
    }

    const options: PromptFilterOptions = {
      limit: parseInt(limit as string),
    };

    if (active !== undefined) {
      options.active = active === 'true';
    }

    if (startDate && typeof startDate === 'string') {
      options.startDate = new Date(startDate);
    }

    if (endDate && typeof endDate === 'string') {
      options.endDate = new Date(endDate);
    }

    const prompts: WeeklyPromptDoc[] = await getAllPrompts(options);
    const response: WeeklyPromptResponse[] = prompts.map(promptToResponse);

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * GET /api/admin/prompts/:promptId
 * Get a specific prompt by ID
 *
 * @secured Requires admin authentication
 *
 * @param {string} promptId.path.required - Prompt ID (year-week format)
 * @returns {WeeklyPromptResponse} 200 - Prompt data
 * @returns {Error} 401/403 - Unauthorized (handled by middleware)
 * @returns {Error} 404 - Prompt not found
 * @returns {Error} 500 - Internal server error
 */
router.get('/api/admin/prompts/:promptId', async (req: AdminRequest, res) => {
  try {
    const { promptId } = req.params;

    const prompt: WeeklyPromptDoc | null = await getPromptById(promptId);

    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    const response: WeeklyPromptResponse = promptToResponse(prompt);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching prompt:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * PUT /api/admin/prompts/:promptId
 * Update an existing prompt
 *
 * @secured Requires admin authentication
 * @audit Logs UPDATE_PROMPT action
 *
 * @param {string} promptId.path.required - Prompt ID (year-week format)
 * @param {UpdateWeeklyPromptInput} updates.body - Partial prompt data to update
 * @returns {WeeklyPromptResponse} 200 - Updated prompt
 * @returns {Error} 401/403 - Unauthorized (handled by middleware)
 * @returns {Error} 404 - Prompt not found
 * @returns {Error} 500 - Internal server error
 */
router.put('/api/admin/prompts/:promptId', async (req: AdminRequest, res) => {
  try {
    const { promptId } = req.params;
    const updates: UpdateWeeklyPromptInput = req.body;

    // Check if prompt exists
    const existingPrompt: WeeklyPromptDoc | null =
      await getPromptById(promptId);
    if (!existingPrompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    // Update the prompt
    const updatedPrompt: WeeklyPromptDoc = await updatePrompt(
      promptId,
      updates
    );
    const response: WeeklyPromptResponse = promptToResponse(updatedPrompt);

    // Log successful action
    await logAdminAction(
      'UPDATE_PROMPT',
      req.user!.uid,
      req.user!.email,
      'prompt',
      promptId,
      updates,
      getIpAddress(req),
      getUserAgent(req)
    );

    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating prompt:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Log failed action
    await logAdminAction(
      'UPDATE_PROMPT',
      req.user!.uid,
      req.user!.email,
      'prompt',
      req.params.promptId,
      { error: errorMessage },
      getIpAddress(req),
      getUserAgent(req),
      false,
      errorMessage
    );

    res.status(500).json({ error: errorMessage });
  }
});

/**
 * DELETE /api/admin/prompts/:promptId
 * Delete a prompt
 *
 * @secured Requires admin authentication
 * @audit Logs DELETE_PROMPT action
 *
 * @param {string} promptId.path.required - Prompt ID (year-week format)
 * @returns {object} 200 - Success message
 * @returns {Error} 401/403 - Unauthorized (handled by middleware)
 * @returns {Error} 404 - Prompt not found
 * @returns {Error} 500 - Internal server error
 */
router.delete(
  '/api/admin/prompts/:promptId',
  async (req: AdminRequest, res) => {
    try {
      const { promptId } = req.params;

      // Check if prompt exists
      const existingPrompt = await getPromptById(promptId);
      if (!existingPrompt) {
        return res.status(404).json({ error: 'Prompt not found' });
      }

      await deletePrompt(promptId);

      // Log successful action
      await logAdminAction(
        'DELETE_PROMPT',
        req.user!.uid,
        req.user!.email,
        'prompt',
        promptId,
        { question: existingPrompt.question },
        getIpAddress(req),
        getUserAgent(req)
      );

      res
        .status(200)
        .json({ message: 'Prompt deleted successfully', promptId });
    } catch (error) {
      console.error('Error deleting prompt:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Log failed action
      await logAdminAction(
        'DELETE_PROMPT',
        req.user!.uid,
        req.user!.email,
        'prompt',
        req.params.promptId,
        { error: errorMessage },
        getIpAddress(req),
        getUserAgent(req),
        false,
        errorMessage
      );

      res.status(500).json({ error: errorMessage });
    }
  }
);

/**
 * POST /api/admin/prompts/:promptId/activate
 * Activate a prompt (deactivates all others)
 *
 * @secured Requires admin authentication
 * @audit Logs ACTIVATE_PROMPT action
 *
 * @param {string} promptId.path.required - Prompt ID (year-week format)
 * @returns {WeeklyPromptResponse} 200 - Activated prompt
 * @returns {Error} 401/403 - Unauthorized (handled by middleware)
 * @returns {Error} 404 - Prompt not found
 * @returns {Error} 500 - Internal server error
 */
router.post(
  '/api/admin/prompts/:promptId/activate',
  async (req: AdminRequest, res) => {
    try {
      const { promptId } = req.params;

      // Check if prompt exists
      const existingPrompt = await getPromptById(promptId);
      if (!existingPrompt) {
        return res.status(404).json({ error: 'Prompt not found' });
      }

      const activatedPrompt: WeeklyPromptDoc = await activatePrompt(promptId);
      const response: WeeklyPromptResponse = promptToResponse(activatedPrompt);

      // Log successful action
      await logAdminAction(
        'ACTIVATE_PROMPT',
        req.user!.uid,
        req.user!.email,
        'prompt',
        promptId,
        { question: existingPrompt.question },
        getIpAddress(req),
        getUserAgent(req)
      );

      res.status(200).json(response);
    } catch (error) {
      console.error('Error activating prompt:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Log failed action
      await logAdminAction(
        'ACTIVATE_PROMPT',
        req.user!.uid,
        req.user!.email,
        'prompt',
        req.params.promptId,
        { error: errorMessage },
        getIpAddress(req),
        getUserAgent(req),
        false,
        errorMessage
      );

      res.status(500).json({ error: errorMessage });
    }
  }
);

/**
 * GET /api/admin/prompts/generate-id/:date
 * Generate a prompt ID from a date
 *
 * @secured Requires admin authentication
 *
 * @param {string} date.path.required - Date in ISO format
 * @returns {object} 200 - Generated prompt ID
 * @returns {Error} 400 - Invalid date
 * @returns {Error} 401/403 - Unauthorized (handled by middleware)
 * @returns {Error} 500 - Internal server error
 */
router.get(
  '/api/admin/prompts/generate-id/:date',
  async (req: AdminRequest, res) => {
    try {
      const { date } = req.params;

      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }

      const promptId = generatePromptId(dateObj);

      res.status(200).json({ promptId, date: dateObj.toISOString() });
    } catch (error) {
      console.error('Error generating prompt ID:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: errorMessage });
    }
  }
);

/**
 * POST /api/admin/prompts/:promptId/generate-matches
 * Manually trigger match generation for a specific prompt (for testing)
 *
 * This bypasses date validations and can be run anytime.
 * Useful for testing the matching algorithm without waiting for Friday.
 *
 * @secured Requires admin authentication
 * @audit Logs GENERATE_MATCHES action
 *
 * @param {string} promptId.path.required - Prompt ID (year-week format)
 * @returns {object} 200 - Match generation results
 * @returns {Error} 401/403 - Unauthorized (handled by middleware)
 * @returns {Error} 404 - Prompt not found
 * @returns {Error} 500 - Internal server error
 */
router.post(
  '/api/admin/prompts/:promptId/generate-matches',
  async (req: AdminRequest, res) => {
    try {
      const { promptId } = req.params;

      // Check if prompt exists
      const existingPrompt = await getPromptById(promptId);
      if (!existingPrompt) {
        return res.status(404).json({ error: 'Prompt not found' });
      }

      // Generate matches (bypasses date validations)
      const matchedCount = await generateMatchesForPrompt(promptId);

      // Log successful action
      await logAdminAction(
        'GENERATE_MATCHES',
        req.user!.uid,
        req.user!.email,
        'prompt',
        promptId,
        {
          matchedCount,
          manual: true,
          question: existingPrompt.question,
        },
        getIpAddress(req),
        getUserAgent(req)
      );

      res.status(200).json({
        message: 'Match generation completed',
        promptId,
        matchedCount,
      });
    } catch (error) {
      console.error('Error generating matches:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Log failed action
      await logAdminAction(
        'GENERATE_MATCHES',
        req.user!.uid,
        req.user!.email,
        'prompt',
        req.params.promptId,
        { error: errorMessage, manual: true },
        getIpAddress(req),
        getUserAgent(req),
        false,
        errorMessage
      );

      res.status(500).json({ error: errorMessage });
    }
  }
);

/**
 * DELETE /api/admin/prompts/active
 * Delete the currently active prompt
 *
 * @secured Requires admin authentication
 * @audit Logs DELETE_PROMPT action
 *
 * @returns {object} 200 - Success message with deleted prompt ID
 * @returns {Error} 401/403 - Unauthorized (handled by middleware)
 * @returns {Error} 404 - No active prompt found
 * @returns {Error} 500 - Internal server error
 */
router.delete('/api/admin/prompts/active', async (req: AdminRequest, res) => {
  try {
    // Find the active prompt
    const activePrompts: WeeklyPromptDoc[] = await getAllPrompts({
      active: true,
    });

    if (activePrompts.length === 0) {
      return res.status(404).json({ error: 'No active prompt found' });
    }

    const activePrompt: WeeklyPromptDoc = activePrompts[0];

    // Delete the active prompt
    await deletePrompt(activePrompt.promptId);

    // Log successful action
    await logAdminAction(
      'DELETE_PROMPT',
      req.user!.uid,
      req.user!.email,
      'prompt',
      activePrompt.promptId,
      {
        active: true,
        question: activePrompt.question,
      },
      getIpAddress(req),
      getUserAgent(req)
    );

    res.status(200).json({
      message: 'Active prompt deleted successfully',
      promptId: activePrompt.promptId,
    });
  } catch (error) {
    console.error('Error deleting active prompt:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Log failed action
    await logAdminAction(
      'DELETE_PROMPT',
      req.user!.uid,
      req.user!.email,
      'prompt',
      'active',
      { error: errorMessage },
      getIpAddress(req),
      getUserAgent(req),
      false,
      errorMessage
    );

    res.status(500).json({ error: errorMessage });
  }
});

/**
 * GET /api/admin/prompts/:promptId/answers
 * Get all answers for a specific prompt with user profile information
 *
 * @secured Requires admin authentication
 * @audit Logs VIEW_PROMPT_ANSWERS action
 *
 * @param {string} promptId.path.required - Prompt ID (year-week format)
 * @returns {WeeklyPromptAnswerWithProfile[]} 200 - Array of answers with profile data
 * @returns {Error} 401/403 - Unauthorized (handled by middleware)
 * @returns {Error} 404 - Prompt not found
 * @returns {Error} 500 - Internal server error
 */
router.get(
  '/api/admin/prompts/:promptId/answers',
  async (req: AdminRequest, res) => {
    try {
      const { promptId } = req.params;

      // Check if prompt exists
      const existingPrompt: WeeklyPromptDoc | null =
        await getPromptById(promptId);
      if (!existingPrompt) {
        return res.status(404).json({ error: 'Prompt not found' });
      }

      console.log(
        `Admin ${req.user?.email} fetching answers for prompt ${promptId}`
      );

      // Try without orderBy first in case Firestore index doesn't exist
      let answersSnapshot;
      try {
        answersSnapshot = await db
          .collection('weeklyPromptAnswers')
          .where('promptId', '==', promptId)
          .orderBy('createdAt', 'desc')
          .get();
      } catch (indexError) {
        // If orderBy fails due to missing index, try without it
        console.warn(
          'Firestore index missing for orderBy, fetching without ordering'
        );
        answersSnapshot = await db
          .collection('weeklyPromptAnswers')
          .where('promptId', '==', promptId)
          .get();
      }

      // Build array of answers with profile data
      const answersWithProfiles: WeeklyPromptAnswerWithProfile[] = [];

      for (const answerDoc of answersSnapshot.docs) {
        const answerData = answerDoc.data();
        const netid: string = answerData.netid;

        // Fetch user profile by querying netid field
        const profileSnapshot = await db
          .collection('profiles')
          .where('netid', '==', netid)
          .limit(1)
          .get();

        let firstName = 'Unknown';
        let profilePicture: string | undefined = undefined;
        let uuid = netid;

        if (!profileSnapshot.empty) {
          const profileData = profileSnapshot.docs[0].data() as ProfileDoc;
          firstName = profileData.firstName || 'Unknown';
          profilePicture = profileData.pictures?.[0]; // First picture

          // Get uuid from users collection
          const userDoc = await db.collection('users').doc(netid).get();
          if (userDoc.exists) {
            uuid = userDoc.data()?.firebaseUid || netid;
          }
        } else {
          console.warn(`Profile not found for netid: ${netid}`);
        }

        answersWithProfiles.push({
          netid,
          promptId,
          answer: answerData.answer || '',
          createdAt: answerData.createdAt?.toDate
            ? answerData.createdAt.toDate().toISOString()
            : new Date().toISOString(),
          uuid,
          firstName,
          profilePicture,
        });
      }

      // Log successful action
      await logAdminAction(
        'VIEW_PROMPT_ANSWERS',
        req.user!.uid,
        req.user!.email,
        'prompt',
        promptId,
        { answerCount: answersWithProfiles.length },
        getIpAddress(req),
        getUserAgent(req)
      );

      res.status(200).json(answersWithProfiles);
    } catch (error) {
      console.error('Error fetching prompt answers:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Log failed action
      await logAdminAction(
        'VIEW_PROMPT_ANSWERS',
        req.user!.uid,
        req.user!.email,
        'prompt',
        req.params.promptId,
        { error: errorMessage },
        getIpAddress(req),
        getUserAgent(req),
        false,
        errorMessage
      );

      res.status(500).json({ error: errorMessage });
    }
  }
);

/**
 * GET /api/admin/matches/stats
 * Get overall match statistics across all prompts
 *
 * @secured Requires admin authentication
 * @audit Logs VIEW_MATCH_STATS action
 *
 * @returns {MatchStatsResponse} 200 - Overall match statistics
 * @returns {Error} 401/403 - Unauthorized (handled by middleware)
 * @returns {Error} 500 - Internal server error
 */
router.get('/api/admin/matches/stats', async (req: AdminRequest, res) => {
  try {
    // Fetch all match documents
    const matchesSnapshot = await db.collection('weeklyMatches').get();
    // Fetch all nudges
    const nudgesSnapshot = await db.collection('nudges').get();

    // Build nudge map for quick lookup
    const nudgeMap = new Map<string, Set<string>>(); // netid_promptId -> Set of toNetids
    nudgesSnapshot.docs.forEach((doc) => {
      const nudgeData = doc.data();
      const key = `${nudgeData.fromNetid}_${nudgeData.promptId}`;
      if (!nudgeMap.has(key)) {
        nudgeMap.set(key, new Set());
      }
      nudgeMap.get(key)!.add(nudgeData.toNetid);
    });

    const totalMatches = matchesSnapshot.size;
    const uniqueUsers = new Set<string>();
    let totalNudges = 0;
    const promptMatchCounts: {
      [promptId: string]: { count: number; nudges: number };
    } = {};

    // Calculate stats
    for (const matchDoc of matchesSnapshot.docs) {
      const matchData = matchDoc.data();
      const netid = matchData.netid;
      const promptId = matchData.promptId;
      const matchedNetids = Array.isArray(matchData.matches)
        ? matchData.matches
        : [];

      // Skip matches with invalid netid
      if (netid && typeof netid === 'string' && netid.trim() !== '') {
        uniqueUsers.add(netid);
      } else {
        console.warn(`Match document ${matchDoc.id} has invalid netid:`, netid);
      }

      // Count nudges for this match
      let nudgesForThisMatch = 0;
      if (promptId && typeof promptId === 'string' && promptId.trim() !== '') {
        const nudgeKey = `${netid}_${promptId}`;
        const nudgedUsers = nudgeMap.get(nudgeKey) || new Set();

        // Count how many of the matched users were nudged
        matchedNetids.forEach((matchedNetid: string) => {
          if (nudgedUsers.has(matchedNetid)) {
            nudgesForThisMatch++;
          }
          // Also check if the matched user nudged back
          const reverseKey = `${matchedNetid}_${promptId}`;
          const reverseNudgedUsers = nudgeMap.get(reverseKey) || new Set();
          if (reverseNudgedUsers.has(netid) && !nudgedUsers.has(matchedNetid)) {
            nudgesForThisMatch++;
          }
        });
      }

      totalNudges += nudgesForThisMatch;

      // Track per-prompt stats - skip if promptId is invalid
      if (promptId && typeof promptId === 'string' && promptId.trim() !== '') {
        if (!promptMatchCounts[promptId]) {
          promptMatchCounts[promptId] = { count: 0, nudges: 0 };
        }
        promptMatchCounts[promptId].count++;
        promptMatchCounts[promptId].nudges += nudgesForThisMatch;
      } else {
        console.warn(`Match document ${matchDoc.id} has invalid promptId:`, promptId);
      }
    }

    const totalUsersMatched = uniqueUsers.size;
    const totalPossibleNudges = totalMatches * 3; // Each match has 3 potential nudges
    const nudgeRate =
      totalPossibleNudges > 0
        ? (totalNudges / totalPossibleNudges) * 100
        : 0;
    const averageMatchesPerPrompt =
      Object.keys(promptMatchCounts).length > 0
        ? totalMatches / Object.keys(promptMatchCounts).length
        : 0;

    // Build prompt-specific stats
    const promptStats: MatchStatsResponse['promptStats'] = [];
    for (const [promptId, stats] of Object.entries(promptMatchCounts)) {
      // Skip if promptId is invalid
      if (!promptId || typeof promptId !== 'string' || promptId.trim() === '') {
        console.warn(`Skipping invalid promptId in match stats:`, promptId);
        continue;
      }

      const promptDoc = await db
        .collection('weeklyPrompts')
        .doc(promptId)
        .get();
      const promptData = promptDoc.data();

      const totalPossibleNudgesForPrompt: number = stats.count * 3;
      const promptNudgeRate =
        totalPossibleNudgesForPrompt > 0
          ? (stats.nudges / totalPossibleNudgesForPrompt) * 100
          : 0;

      promptStats.push({
        promptId,
        question: promptData?.question || 'Unknown',
        matchDate: promptData?.matchDate?.toDate
          ? promptData.matchDate.toDate().toISOString()
          : '',
        totalMatchDocuments: stats.count,
        totalUsersMatched: stats.count, // Each match doc is for one user
        totalNudges: stats.nudges,
        nudgeRate: Math.round(promptNudgeRate * 100) / 100,
      });
    }

    // Sort by match date (most recent first)
    promptStats.sort(
      (a, b) =>
        new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
    );

    const response: MatchStatsResponse = {
      totalMatches,
      totalUsersMatched,
      averageMatchesPerPrompt: Math.round(averageMatchesPerPrompt * 100) / 100,
      totalNudges,
      nudgeRate: Math.round(nudgeRate * 100) / 100,
      promptStats,
    };

    // Log successful action
    await logAdminAction(
      'VIEW_MATCH_STATS',
      req.user!.uid,
      req.user!.email,
      'matches',
      'all',
      { totalMatches, totalUsersMatched },
      getIpAddress(req),
      getUserAgent(req)
    );

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching match stats:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Log failed action
    await logAdminAction(
      'VIEW_MATCH_STATS',
      req.user!.uid,
      req.user!.email,
      'matches',
      'all',
      { error: errorMessage },
      getIpAddress(req),
      getUserAgent(req),
      false,
      errorMessage
    );

    res.status(500).json({ error: errorMessage });
  }
});

/**
 * GET /api/admin/prompts/:promptId/matches
 * Get detailed match data for a specific prompt with user profiles
 *
 * @secured Requires admin authentication
 * @audit Logs VIEW_PROMPT_MATCHES action
 *
 * @param {string} promptId.path.required - Prompt ID (year-week format)
 * @returns {PromptMatchDetailResponse} 200 - Detailed match data with profiles
 * @returns {Error} 401/403 - Unauthorized (handled by middleware)
 * @returns {Error} 404 - Prompt not found
 * @returns {Error} 500 - Internal server error
 */
router.get(
  '/api/admin/prompts/:promptId/matches',
  async (req: AdminRequest, res) => {
    try {
      const { promptId } = req.params;

      // Check if prompt exists
      const existingPrompt = await getPromptById(promptId);
      if (!existingPrompt) {
        return res.status(404).json({ error: 'Prompt not found' });
      }

      // Fetch all match documents for this prompt
      // Try without orderBy first in case Firestore index doesn't exist
      let matchesSnapshot;
      try {
        matchesSnapshot = await db
          .collection('weeklyMatches')
          .where('promptId', '==', promptId)
          .orderBy('createdAt', 'desc')
          .limit(100) // Limit for performance
          .get();
      } catch (indexError) {
        // If orderBy fails due to missing index, try without it
        console.warn(
          'Firestore index missing for orderBy, fetching without ordering:',
          indexError
        );
        matchesSnapshot = await db
          .collection('weeklyMatches')
          .where('promptId', '==', promptId)
          .limit(100)
          .get();
      }

      // Fetch nudges for this prompt
      const nudgesSnapshot = await db
        .collection('nudges')
        .where('promptId', '==', promptId)
        .get();

      // Build nudge map for quick lookup
      const nudgeMap = new Map<string, Set<string>>(); // fromNetid -> Set of toNetids
      nudgesSnapshot.docs.forEach((doc) => {
        const nudgeData = doc.data();
        if (!nudgeMap.has(nudgeData.fromNetid)) {
          nudgeMap.set(nudgeData.fromNetid, new Set());
        }
        nudgeMap.get(nudgeData.fromNetid)!.add(nudgeData.toNetid);
      });

      const totalMatchDocuments = matchesSnapshot.size;
      let totalNudges = 0;
      const matchesWithProfiles: MatchWithProfile[] = [];

      // Build matches array with profile data
      for (const matchDoc of matchesSnapshot.docs) {
        const matchData = matchDoc.data();
        const userNetid = matchData.netid;
        const matchedNetids = Array.isArray(matchData.matches)
          ? matchData.matches
          : [];
        const revealed = Array.isArray(matchData.revealed)
          ? matchData.revealed
          : [];

        // Skip if userNetid is invalid
        if (!userNetid || typeof userNetid !== 'string' || userNetid.trim() === '') {
          console.warn(`Invalid userNetid for match document ${matchDoc.id}:`, userNetid);
          continue; // Skip this entire match document
        }

        // Fetch user profile by querying netid field (profiles use auto-generated IDs)
        const userProfileSnapshot = await db
          .collection('profiles')
          .where('netid', '==', userNetid)
          .limit(1)
          .get();

        const userProfileData = !userProfileSnapshot.empty
          ? userProfileSnapshot.docs[0].data()
          : null;

        // Fetch matched users' profiles
        const matchedProfiles = [];
        for (let i = 0; i < matchedNetids.length; i++) {
          const matchedNetid = matchedNetids[i];

          // Skip if matchedNetid is empty, null, or undefined
          if (!matchedNetid || typeof matchedNetid !== 'string' || matchedNetid.trim() === '') {
            console.warn(`Invalid matchedNetid at index ${i} for user ${userNetid}:`, matchedNetid);
            matchedProfiles.push({
              netid: matchedNetid || 'invalid',
              firstName: 'Invalid User',
              profilePicture: undefined,
              revealed: Boolean(revealed[i]),
              nudgedByUser: false,
              nudgedByMatch: false,
            });
            continue;
          }

          // Fetch matched user profile by querying netid field (profiles use auto-generated IDs)
          const matchedProfileSnapshot = await db
            .collection('profiles')
            .where('netid', '==', matchedNetid)
            .limit(1)
            .get();

          const matchedProfileData = !matchedProfileSnapshot.empty
            ? matchedProfileSnapshot.docs[0].data()
            : null;

          // Check nudge status in both directions
          const nudgedByUser = nudgeMap.get(userNetid)?.has(matchedNetid) || false;
          const nudgedByMatch = nudgeMap.get(matchedNetid)?.has(userNetid) || false;

          // Count total nudges (count each direction once)
          if (nudgedByUser) {
            totalNudges++;
          }
          if (nudgedByMatch && !nudgedByUser) {
            totalNudges++;
          }

          matchedProfiles.push({
            netid: matchedNetid,
            firstName: matchedProfileData?.firstName || 'Unknown',
            profilePicture: matchedProfileData?.pictures?.[0],
            revealed: Boolean(revealed[i]), // Ensure it's a boolean
            nudgedByUser,
            nudgedByMatch,
          });
        }

        matchesWithProfiles.push({
          netid: userNetid,
          firstName: userProfileData?.firstName || 'Unknown',
          profilePicture: userProfileData?.pictures?.[0],
          matches: matchedProfiles,
          createdAt: matchData.createdAt?.toDate
            ? matchData.createdAt.toDate().toISOString()
            : new Date().toISOString(),
        });
      }

      const totalPossibleNudges = totalMatchDocuments * 3;
      const nudgeRate =
        totalPossibleNudges > 0
          ? (totalNudges / totalPossibleNudges) * 100
          : 0;

      const response: PromptMatchDetailResponse = {
        promptId,
        question: existingPrompt.question,
        totalMatchDocuments,
        totalUsersMatched: totalMatchDocuments, // Each match doc is for one user
        totalPossibleNudges,
        totalNudges,
        nudgeRate: Math.round(nudgeRate * 100) / 100,
        matches: matchesWithProfiles,
      };

      // Log successful action
      await logAdminAction(
        'VIEW_PROMPT_MATCHES',
        req.user!.uid,
        req.user!.email,
        'prompt',
        promptId,
        { totalMatchDocuments, totalNudges },
        getIpAddress(req),
        getUserAgent(req)
      );

      res.status(200).json(response);
    } catch (error) {
      console.error('Error fetching prompt matches:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Log failed action
      await logAdminAction(
        'VIEW_PROMPT_MATCHES',
        req.user!.uid,
        req.user!.email,
        'prompt',
        req.params.promptId,
        { error: errorMessage },
        getIpAddress(req),
        getUserAgent(req),
        false,
        errorMessage
      );

      res.status(500).json({ error: errorMessage });
    }
  }
);

/**
 * POST /api/admin/prompts/fix-multiple-active
 * Emergency cleanup endpoint to fix multiple active prompts issue
 * Deactivates all prompts except the most recently activated one
 *
 * @secured Requires admin authentication
 * @audit Logs FIX_MULTIPLE_ACTIVE action
 *
 * @returns {object} 200 - Cleanup results
 * @returns {Error} 401/403 - Unauthorized (handled by middleware)
 * @returns {Error} 500 - Internal server error
 */
router.post(
  '/api/admin/prompts/fix-multiple-active',
  async (req: AdminRequest, res) => {
    try {
      console.log(
        `Admin ${req.user?.email} fixing multiple active prompts issue`
      );

      // Get all prompts marked as active
      const activePrompts = await getAllPrompts({ active: true });

      if (activePrompts.length === 0) {
        return res.status(200).json({
          message: 'No active prompts found. Nothing to fix.',
          deactivatedCount: 0,
        });
      }

      if (activePrompts.length === 1) {
        return res.status(200).json({
          message: 'Only one active prompt found. System is in correct state.',
          activePromptId: activePrompts[0].promptId,
          deactivatedCount: 0,
        });
      }

      // Multiple active prompts found - need to fix
      console.log(
        `WARNING: Multiple active prompts detected! This is an invalid state.`
      );
      activePrompts.forEach((p) => {
        console.log(`   - ${p.promptId}: ${p.question}`);
        console.log(`     └─ activatedAt: ${p.activatedAt}`);
      });

      // Sort by activatedAt to find most recent
      const sortedPrompts = [...activePrompts].sort((a, b) => {
        const dateA = a.activatedAt
          ? new Date(a.activatedAt as any).getTime()
          : 0;
        const dateB = b.activatedAt
          ? new Date(b.activatedAt as any).getTime()
          : 0;
        return dateB - dateA; // Most recent first
      });

      const mostRecent = sortedPrompts[0];
      const toDeactivate = sortedPrompts.slice(1);

      console.log(`Keeping most recently activated: ${mostRecent.promptId}`);
      console.log(`Deactivating ${toDeactivate.length} older prompt(s):`);

      // Deactivate all except most recent
      const batch = db.batch();
      toDeactivate.forEach((prompt) => {
        const ref = db.collection('weeklyPrompts').doc(prompt.promptId);
        batch.update(ref, {
          active: false,
          status: 'completed',
        });
        console.log(`   └─ Deactivating: ${prompt.promptId}`);
      });

      await batch.commit();

      // Log successful action
      await logAdminAction(
        'FIX_MULTIPLE_ACTIVE',
        req.user!.uid,
        req.user!.email,
        'prompts',
        'cleanup',
        {
          keptActive: mostRecent.promptId,
          deactivated: toDeactivate.map((p) => p.promptId),
        },
        getIpAddress(req),
        getUserAgent(req)
      );

      console.log(`Successfully fixed multiple active prompts`);

      res.status(200).json({
        message: 'Successfully fixed multiple active prompts',
        keptActive: {
          promptId: mostRecent.promptId,
          question: mostRecent.question,
          activatedAt: mostRecent.activatedAt,
        },
        deactivated: toDeactivate.map((p) => ({
          promptId: p.promptId,
          question: p.question,
        })),
        deactivatedCount: toDeactivate.length,
      });
    } catch (error) {
      console.error('Error fixing multiple active prompts:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Log failed action
      await logAdminAction(
        'FIX_MULTIPLE_ACTIVE',
        req.user!.uid,
        req.user!.email,
        'prompts',
        'cleanup',
        { error: errorMessage },
        getIpAddress(req),
        getUserAgent(req),
        false,
        errorMessage
      );

      res.status(500).json({ error: errorMessage });
    }
  }
);

export default router;
