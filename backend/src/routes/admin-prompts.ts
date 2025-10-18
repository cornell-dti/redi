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

export default router;
