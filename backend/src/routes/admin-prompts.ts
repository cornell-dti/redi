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
import {
  CreateWeeklyPromptInput,
  UpdateWeeklyPromptInput,
  WeeklyPromptResponse,
  WeeklyPromptAnswerWithProfile,
  MatchStatsResponse,
  PromptMatchDetailResponse,
  MatchWithProfile,
} from '../../types';
import { AdminRequest, requireAdmin } from '../middleware/adminAuth';
import { getIpAddress, getUserAgent, logAdminAction } from '../services/auditLog';
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
import { db } from '../../firebaseAdmin';

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
    const prompt = await createWeeklyPrompt(promptDataWithDates);
    const response = promptToResponse(prompt);

    // Log successful action
    await logAdminAction(
  'CREATE_PROMPT',
  req.user!.uid,
  req.user!.email,
  'prompt',
  promptData.promptId,
  {
    question: promptData.question,
    releaseDate: promptDataWithDates.releaseDate instanceof Date 
      ? promptDataWithDates.releaseDate.toISOString() 
      : promptDataWithDates.releaseDate,
    matchDate: promptDataWithDates.matchDate instanceof Date 
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
    const options: any = {
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

    const prompts = await getAllPrompts(options);
    const response = prompts.map(promptToResponse);

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
    const existingPrompt = await getPromptById(promptId);
    if (!existingPrompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    // Update the prompt
    const updatedPrompt = await updatePrompt(promptId, updates);
    const response = promptToResponse(updatedPrompt);

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
router.delete('/api/admin/prompts/:promptId', async (req: AdminRequest, res) => {
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

    res.status(200).json({ message: 'Prompt deleted successfully', promptId });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

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
});

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
router.post('/api/admin/prompts/:promptId/activate', async (req: AdminRequest, res) => {
  try {
    const { promptId } = req.params;

    // Check if prompt exists
    const existingPrompt = await getPromptById(promptId);
    if (!existingPrompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    const activatedPrompt = await activatePrompt(promptId);
    const response = promptToResponse(activatedPrompt);

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
    const errorMessage = error instanceof Error ? error.message : String(error);

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
});

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
router.get('/api/admin/prompts/generate-id/:date', async (req: AdminRequest, res) => {
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

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

      console.log(
        `🎯 Admin ${req.user?.email} manually triggering match generation for prompt ${promptId}`
      );

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
      const errorMessage = error instanceof Error ? error.message : String(error);

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
    const activePrompts = await getAllPrompts({ active: true });

    if (activePrompts.length === 0) {
      return res.status(404).json({ error: 'No active prompt found' });
    }

    const activePrompt = activePrompts[0];

    console.log(
      `🗑️ Admin ${req.user?.email} deleting active prompt: ${activePrompt.promptId}`
    );

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
router.get('/api/admin/prompts/:promptId/answers', async (req: AdminRequest, res) => {
  try {
    const { promptId } = req.params;

    // Check if prompt exists
    const existingPrompt = await getPromptById(promptId);
    if (!existingPrompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    console.log(`📥 Admin ${req.user?.email} fetching answers for prompt ${promptId}`);

    // Fetch all answers for this prompt
    console.log(`🔍 Querying weeklyPromptAnswers collection with promptId: "${promptId}"`);

    // Try without orderBy first in case Firestore index doesn't exist
    let answersSnapshot;
    try {
      answersSnapshot = await db
        .collection('weeklyPromptAnswers')
        .where('promptId', '==', promptId)
        .orderBy('createdAt', 'desc')
        .get();
      console.log('✅ Query with orderBy succeeded');
    } catch (indexError) {
      // If orderBy fails due to missing index, try without it
      console.warn('⚠️  Firestore index missing for orderBy, fetching without ordering');
      console.warn('⚠️  Error details:', indexError);
      answersSnapshot = await db
        .collection('weeklyPromptAnswers')
        .where('promptId', '==', promptId)
        .get();
      console.log('✅ Query without orderBy succeeded');
    }

    console.log(`📊 Found ${answersSnapshot.size} answers for prompt ${promptId}`);

    // Debug: Log all document IDs found
    if (answersSnapshot.size > 0) {
      console.log('📋 Answer document IDs:', answersSnapshot.docs.map(d => d.id));
      console.log('📋 Sample answer data:', answersSnapshot.docs[0]?.data());
    }

    // Build array of answers with profile data
    const answersWithProfiles: WeeklyPromptAnswerWithProfile[] = [];

    for (const answerDoc of answersSnapshot.docs) {
      const answerData = answerDoc.data();
      const netid = answerData.netid;

      console.log(`📄 Processing answer document ${answerDoc.id} from netid: ${netid}`);

      // Fetch user profile
      const profileDoc = await db.collection('profiles').doc(netid).get();

      let firstName = 'Unknown';
      let profilePicture: string | undefined = undefined;
      let uuid = netid;

      if (profileDoc.exists) {
        const profileData = profileDoc.data();
        firstName = profileData?.firstName || 'Unknown';
        profilePicture = profileData?.pictures?.[0]; // First picture

        // Get uuid from users collection
        const userDoc = await db.collection('users').doc(netid).get();
        if (userDoc.exists) {
          uuid = userDoc.data()?.firebaseUid || netid;
        }
      } else {
        console.warn(`⚠️  Profile not found for netid: ${netid}`);
      }

      answersWithProfiles.push({
        netid,
        promptId,
        answer: answerData.answer || '',
        createdAt: answerData.createdAt?.toDate ? answerData.createdAt.toDate().toISOString() : new Date().toISOString(),
        uuid,
        firstName,
        profilePicture,
      });
    }

    console.log(`✅ Returning ${answersWithProfiles.length} answers with profile data`);

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
    console.error('❌ Error fetching prompt answers:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

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
});

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
    console.log(`📊 Admin ${req.user?.email} fetching match statistics`);

    // Fetch all match documents
    const matchesSnapshot = await db.collection('weeklyMatches').get();

    console.log(`📊 Found ${matchesSnapshot.size} total match documents`);

    // Debug: Log sample match document structure
    if (matchesSnapshot.size > 0) {
      const sampleDoc = matchesSnapshot.docs[0];
      console.log('📋 Sample match document ID:', sampleDoc.id);
      console.log('📋 Sample revealed field:', sampleDoc.data().revealed, 'Type:', typeof sampleDoc.data().revealed, 'IsArray:', Array.isArray(sampleDoc.data().revealed));
    }

    const totalMatches = matchesSnapshot.size;
    const uniqueUsers = new Set<string>();
    let totalReveals = 0;
    const promptMatchCounts: { [promptId: string]: { count: number; reveals: number } } = {};

    // Calculate stats
    for (const matchDoc of matchesSnapshot.docs) {
      const matchData = matchDoc.data();
      uniqueUsers.add(matchData.netid);

      // Debug: Log if revealed is not an array
      if (!Array.isArray(matchData.revealed)) {
        console.warn(`⚠️  Match stats - Document ${matchDoc.id} has non-array revealed field:`, matchData.revealed);
      }

      // Count reveals (true values in revealed array) - DEFENSIVE PROGRAMMING
      const revealed = Array.isArray(matchData.revealed) ? matchData.revealed : [];
      const revealsForThisMatch = revealed.filter((r: boolean) => r === true).length;
      totalReveals += revealsForThisMatch;

      // Track per-prompt stats
      const promptId = matchData.promptId;
      if (!promptMatchCounts[promptId]) {
        promptMatchCounts[promptId] = { count: 0, reveals: 0 };
      }
      promptMatchCounts[promptId].count++;
      promptMatchCounts[promptId].reveals += revealsForThisMatch;
    }

    console.log(`📊 Total reveals: ${totalReveals}, Total possible reveals: ${totalMatches * 3}`);

    const totalUsersMatched = uniqueUsers.size;
    const totalPossibleReveals = totalMatches * 3; // Each match has 3 potential reveals
    const revealRate = totalPossibleReveals > 0 ? (totalReveals / totalPossibleReveals) * 100 : 0;
    const averageMatchesPerPrompt = Object.keys(promptMatchCounts).length > 0
      ? totalMatches / Object.keys(promptMatchCounts).length
      : 0;

    // Build prompt-specific stats
    const promptStats = [];
    for (const [promptId, stats] of Object.entries(promptMatchCounts)) {
      const promptDoc = await db.collection('weeklyPrompts').doc(promptId).get();
      const promptData = promptDoc.data();

      const totalPossibleRevealsForPrompt = stats.count * 3;
      const promptRevealRate = totalPossibleRevealsForPrompt > 0
        ? (stats.reveals / totalPossibleRevealsForPrompt) * 100
        : 0;

      promptStats.push({
        promptId,
        question: promptData?.question || 'Unknown',
        matchDate: promptData?.matchDate?.toDate ? promptData.matchDate.toDate().toISOString() : '',
        totalMatchDocuments: stats.count,
        totalUsersMatched: stats.count, // Each match doc is for one user
        totalReveals: stats.reveals,
        revealRate: Math.round(promptRevealRate * 100) / 100,
      });
    }

    // Sort by match date (most recent first)
    promptStats.sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime());

    const response: MatchStatsResponse = {
      totalMatches,
      totalUsersMatched,
      averageMatchesPerPrompt: Math.round(averageMatchesPerPrompt * 100) / 100,
      totalReveals,
      revealRate: Math.round(revealRate * 100) / 100,
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
router.get('/api/admin/prompts/:promptId/matches', async (req: AdminRequest, res) => {
  try {
    const { promptId } = req.params;

    // Check if prompt exists
    const existingPrompt = await getPromptById(promptId);
    if (!existingPrompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    console.log(`🎯 Admin ${req.user?.email} fetching matches for prompt ${promptId}`);

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
      console.warn('⚠️  Firestore index missing for orderBy, fetching without ordering:', indexError);
      matchesSnapshot = await db
        .collection('weeklyMatches')
        .where('promptId', '==', promptId)
        .limit(100)
        .get();
    }

    console.log(`🎯 Found ${matchesSnapshot.size} match documents for prompt ${promptId}`);

    // Debug: Log sample match document structure
    if (matchesSnapshot.size > 0) {
      const sampleDoc = matchesSnapshot.docs[0];
      console.log('📋 Sample match document ID:', sampleDoc.id);
      console.log('📋 Sample match data:', sampleDoc.data());
      console.log('📋 Revealed field type:', typeof sampleDoc.data().revealed, 'IsArray:', Array.isArray(sampleDoc.data().revealed));
    }

    const totalMatchDocuments = matchesSnapshot.size;
    let totalReveals = 0;
    const matchesWithProfiles: MatchWithProfile[] = [];

    // Build matches array with profile data
    for (const matchDoc of matchesSnapshot.docs) {
      const matchData = matchDoc.data();
      const userNetid = matchData.netid;
      const matchedNetids = Array.isArray(matchData.matches) ? matchData.matches : [];
      const revealed = Array.isArray(matchData.revealed) ? matchData.revealed : [];

      // Debug: Log if revealed is not an array
      if (!Array.isArray(matchData.revealed)) {
        console.warn(`⚠️  Document ${matchDoc.id} has non-array revealed field:`, matchData.revealed);
      }

      // Count reveals for this match - DEFENSIVE PROGRAMMING
      totalReveals += revealed.filter((r: boolean) => r === true).length;

      // Fetch user profile
      const userProfileDoc = await db.collection('profiles').doc(userNetid).get();
      const userProfileData = userProfileDoc.data();

      // Fetch matched users' profiles
      const matchedProfiles = [];
      for (let i = 0; i < matchedNetids.length; i++) {
        const matchedNetid = matchedNetids[i];
        const matchedProfileDoc = await db.collection('profiles').doc(matchedNetid).get();
        const matchedProfileData = matchedProfileDoc.data();

        matchedProfiles.push({
          netid: matchedNetid,
          firstName: matchedProfileData?.firstName || 'Unknown',
          profilePicture: matchedProfileData?.pictures?.[0],
          revealed: Boolean(revealed[i]), // Ensure it's a boolean
        });
      }

      matchesWithProfiles.push({
        netid: userNetid,
        firstName: userProfileData?.firstName || 'Unknown',
        profilePicture: userProfileData?.pictures?.[0],
        matches: matchedProfiles,
        createdAt: matchData.createdAt?.toDate ? matchData.createdAt.toDate().toISOString() : new Date().toISOString(),
      });
    }

    console.log(`✅ Processed ${matchesWithProfiles.length} matches with profiles`);
    console.log(`📊 Total reveals: ${totalReveals} out of ${totalMatchDocuments * 3} possible`);

    const totalPossibleReveals = totalMatchDocuments * 3;
    const revealRate = totalPossibleReveals > 0 ? (totalReveals / totalPossibleReveals) * 100 : 0;

    const response: PromptMatchDetailResponse = {
      promptId,
      question: existingPrompt.question,
      totalMatchDocuments,
      totalUsersMatched: totalMatchDocuments, // Each match doc is for one user
      totalPossibleReveals,
      totalReveals,
      revealRate: Math.round(revealRate * 100) / 100,
      matches: matchesWithProfiles,
    };

    // Log successful action
    await logAdminAction(
      'VIEW_PROMPT_MATCHES',
      req.user!.uid,
      req.user!.email,
      'prompt',
      promptId,
      { totalMatchDocuments, totalReveals },
      getIpAddress(req),
      getUserAgent(req)
    );

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching prompt matches:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

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
});

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
router.post('/api/admin/prompts/fix-multiple-active', async (req: AdminRequest, res) => {
  try {
    console.log(`🔧 Admin ${req.user?.email} fixing multiple active prompts issue`);

    // Get all prompts marked as active
    const activePrompts = await getAllPrompts({ active: true });

    console.log(`📊 Found ${activePrompts.length} prompt(s) marked as active`);

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
    console.log(`⚠️  WARNING: Multiple active prompts detected! This is an invalid state.`);
    activePrompts.forEach((p) => {
      console.log(`   - ${p.promptId}: ${p.question}`);
      console.log(`     └─ activatedAt: ${p.activatedAt}`);
    });

    // Sort by activatedAt to find most recent
    const sortedPrompts = [...activePrompts].sort((a, b) => {
      const dateA = a.activatedAt ? new Date(a.activatedAt as any).getTime() : 0;
      const dateB = b.activatedAt ? new Date(b.activatedAt as any).getTime() : 0;
      return dateB - dateA; // Most recent first
    });

    const mostRecent = sortedPrompts[0];
    const toDeactivate = sortedPrompts.slice(1);

    console.log(`✅ Keeping most recently activated: ${mostRecent.promptId}`);
    console.log(`🔄 Deactivating ${toDeactivate.length} older prompt(s):`);

    // Deactivate all except most recent
    const batch = db.batch();
    toDeactivate.forEach((prompt) => {
      const ref = db.collection('weeklyPrompts').doc(prompt.promptId);
      batch.update(ref, {
        active: false,
        status: 'completed'
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
        deactivated: toDeactivate.map(p => p.promptId),
      },
      getIpAddress(req),
      getUserAgent(req)
    );

    console.log(`✅ Successfully fixed multiple active prompts`);

    res.status(200).json({
      message: 'Successfully fixed multiple active prompts',
      keptActive: {
        promptId: mostRecent.promptId,
        question: mostRecent.question,
        activatedAt: mostRecent.activatedAt,
      },
      deactivated: toDeactivate.map(p => ({
        promptId: p.promptId,
        question: p.question,
      })),
      deactivatedCount: toDeactivate.length,
    });
  } catch (error) {
    console.error('❌ Error fixing multiple active prompts:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

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
});

export default router;
