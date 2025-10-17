import express from 'express';
import { db } from '../../firebaseAdmin';
import {
  CreateWeeklyPromptInput,
  UpdateWeeklyPromptInput,
  WeeklyPromptResponse,
} from '../../types';
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
import { generateMatchesForPrompt } from '../services/matchingService';

const router = express.Router();

/**
 * Verifies that a user has admin privileges
 * @param firebaseUid - The Firebase authentication UID for the user
 * @returns Promise resolving to boolean indicating admin status
 * @todo Implement proper admin role checking (for now, returns true)
 */
const verifyAdminAccess = async (firebaseUid: string): Promise<boolean> => {
  // TODO: Implement admin role checking
  // For now, allow all authenticated users
  // In production, check against an 'admins' collection or custom claims
  try {
    const userSnapshot = await db
      .collection('users')
      .where('firebaseUid', '==', firebaseUid)
      .get();

    return !userSnapshot.empty;
  } catch (error) {
    console.error('Error verifying admin access:', error);
    return false;
  }
};

/**
 * POST /api/admin/prompts
 * Create a new weekly prompt
 * @route POST /api/admin/prompts
 * @group Admin - Admin prompt management
 * @param {string} firebaseUid.body.required - Firebase authentication UID
 * @param {CreateWeeklyPromptInput} promptData.body.required - Prompt data
 * @returns {WeeklyPromptResponse} Created prompt
 * @returns {Error} 400 - Invalid data or validation errors
 * @returns {Error} 403 - Unauthorized (not admin)
 * @returns {Error} 409 - Prompt already exists for this week
 * @returns {Error} 500 - Internal server error
 */
router.post('/api/admin/prompts', async (req, res) => {
  try {
    const {
      firebaseUid,
      ...promptData
    }: { firebaseUid: string } & CreateWeeklyPromptInput = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ error: 'firebaseUid is required' });
    }

    // Verify admin access
    const isAdmin = await verifyAdminAccess(firebaseUid);
    if (!isAdmin) {
      return res
        .status(403)
        .json({ error: 'Unauthorized: Admin access required' });
    }

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

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating prompt:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * GET /api/admin/prompts
 * Get all prompts with optional filtering
 * @route GET /api/admin/prompts
 * @group Admin - Admin prompt management
 * @param {string} firebaseUid.query.required - Firebase authentication UID
 * @param {boolean} [active] - Filter by active status
 * @param {string} [startDate] - Filter by start date (ISO string)
 * @param {string} [endDate] - Filter by end date (ISO string)
 * @param {number} [limit=50] - Maximum number of prompts to return
 * @returns {WeeklyPromptResponse[]} Array of prompts
 * @returns {Error} 400 - Missing firebaseUid
 * @returns {Error} 403 - Unauthorized (not admin)
 * @returns {Error} 500 - Internal server error
 */
router.get('/api/admin/prompts', async (req, res) => {
  try {
    const { firebaseUid, active, startDate, endDate, limit = '50' } = req.query;

    if (!firebaseUid || typeof firebaseUid !== 'string') {
      return res.status(400).json({ error: 'firebaseUid is required' });
    }

    // Verify admin access
    const isAdmin = await verifyAdminAccess(firebaseUid);
    if (!isAdmin) {
      return res
        .status(403)
        .json({ error: 'Unauthorized: Admin access required' });
    }

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
 * @route GET /api/admin/prompts/:promptId
 * @group Admin - Admin prompt management
 * @param {string} promptId.path.required - Prompt ID (year-week format)
 * @param {string} firebaseUid.query.required - Firebase authentication UID
 * @returns {WeeklyPromptResponse} Prompt data
 * @returns {Error} 400 - Missing firebaseUid
 * @returns {Error} 403 - Unauthorized (not admin)
 * @returns {Error} 404 - Prompt not found
 * @returns {Error} 500 - Internal server error
 */
router.get('/api/admin/prompts/:promptId', async (req, res) => {
  try {
    const { promptId } = req.params;
    const { firebaseUid } = req.query;

    if (!firebaseUid || typeof firebaseUid !== 'string') {
      return res.status(400).json({ error: 'firebaseUid is required' });
    }

    // Verify admin access
    const isAdmin = await verifyAdminAccess(firebaseUid);
    if (!isAdmin) {
      return res
        .status(403)
        .json({ error: 'Unauthorized: Admin access required' });
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

/**
 * PUT /api/admin/prompts/:promptId
 * Update an existing prompt
 * @route PUT /api/admin/prompts/:promptId
 * @group Admin - Admin prompt management
 * @param {string} promptId.path.required - Prompt ID (year-week format)
 * @param {string} firebaseUid.body.required - Firebase authentication UID
 * @param {UpdateWeeklyPromptInput} updates.body - Partial prompt data to update
 * @returns {WeeklyPromptResponse} Updated prompt
 * @returns {Error} 400 - Missing firebaseUid or invalid data
 * @returns {Error} 403 - Unauthorized (not admin)
 * @returns {Error} 404 - Prompt not found
 * @returns {Error} 500 - Internal server error
 */
router.put('/api/admin/prompts/:promptId', async (req, res) => {
  try {
    const { promptId } = req.params;
    const {
      firebaseUid,
      ...updates
    }: { firebaseUid: string } & UpdateWeeklyPromptInput = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ error: 'firebaseUid is required' });
    }

    // Verify admin access
    const isAdmin = await verifyAdminAccess(firebaseUid);
    if (!isAdmin) {
      return res
        .status(403)
        .json({ error: 'Unauthorized: Admin access required' });
    }

    // Check if prompt exists
    const existingPrompt = await getPromptById(promptId);
    if (!existingPrompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    // Update the prompt
    const updatedPrompt = await updatePrompt(promptId, updates);
    const response = promptToResponse(updatedPrompt);

    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating prompt:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * DELETE /api/admin/prompts/:promptId
 * Delete a prompt
 * @route DELETE /api/admin/prompts/:promptId
 * @group Admin - Admin prompt management
 * @param {string} promptId.path.required - Prompt ID (year-week format)
 * @param {string} firebaseUid.body.required - Firebase authentication UID
 * @returns {object} Success message
 * @returns {Error} 400 - Missing firebaseUid
 * @returns {Error} 403 - Unauthorized (not admin)
 * @returns {Error} 404 - Prompt not found
 * @returns {Error} 500 - Internal server error
 */
router.delete('/api/admin/prompts/:promptId', async (req, res) => {
  try {
    const { promptId } = req.params;
    const { firebaseUid } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ error: 'firebaseUid is required' });
    }

    // Verify admin access
    const isAdmin = await verifyAdminAccess(firebaseUid);
    if (!isAdmin) {
      return res
        .status(403)
        .json({ error: 'Unauthorized: Admin access required' });
    }

    // Check if prompt exists
    const existingPrompt = await getPromptById(promptId);
    if (!existingPrompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    await deletePrompt(promptId);

    res.status(200).json({ message: 'Prompt deleted successfully' });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * POST /api/admin/prompts/:promptId/activate
 * Activate a prompt (deactivates all others)
 * @route POST /api/admin/prompts/:promptId/activate
 * @group Admin - Admin prompt management
 * @param {string} promptId.path.required - Prompt ID (year-week format)
 * @param {string} firebaseUid.body.required - Firebase authentication UID
 * @returns {WeeklyPromptResponse} Activated prompt
 * @returns {Error} 400 - Missing firebaseUid
 * @returns {Error} 403 - Unauthorized (not admin)
 * @returns {Error} 404 - Prompt not found
 * @returns {Error} 500 - Internal server error
 */
router.post('/api/admin/prompts/:promptId/activate', async (req, res) => {
  try {
    const { promptId } = req.params;
    const { firebaseUid } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ error: 'firebaseUid is required' });
    }

    // Verify admin access
    const isAdmin = await verifyAdminAccess(firebaseUid);
    if (!isAdmin) {
      return res
        .status(403)
        .json({ error: 'Unauthorized: Admin access required' });
    }

    // Check if prompt exists
    const existingPrompt = await getPromptById(promptId);
    if (!existingPrompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    const activatedPrompt = await activatePrompt(promptId);
    const response = promptToResponse(activatedPrompt);

    res.status(200).json(response);
  } catch (error) {
    console.error('Error activating prompt:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * GET /api/admin/prompts/generate-id/:date
 * Generate a prompt ID from a date
 * @route GET /api/admin/prompts/generate-id/:date
 * @group Admin - Admin prompt management
 * @param {string} date.path.required - Date in ISO format
 * @param {string} firebaseUid.query.required - Firebase authentication UID
 * @returns {object} Generated prompt ID
 * @returns {Error} 400 - Invalid date or missing firebaseUid
 * @returns {Error} 403 - Unauthorized (not admin)
 * @returns {Error} 500 - Internal server error
 */
router.get('/api/admin/prompts/generate-id/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { firebaseUid } = req.query;

    if (!firebaseUid || typeof firebaseUid !== 'string') {
      return res.status(400).json({ error: 'firebaseUid is required' });
    }

    // Verify admin access
    const isAdmin = await verifyAdminAccess(firebaseUid);
    if (!isAdmin) {
      return res
        .status(403)
        .json({ error: 'Unauthorized: Admin access required' });
    }

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
 * This bypasses date validations and can be run anytime
 * @route POST /api/admin/prompts/:promptId/generate-matches
 * @group Admin - Admin prompt management
 * @param {string} promptId.path.required - Prompt ID (year-week format)
 * @param {string} firebaseUid.body.required - Firebase authentication UID
 * @returns {object} Match generation results
 * @returns {Error} 400 - Missing firebaseUid
 * @returns {Error} 403 - Unauthorized (not admin)
 * @returns {Error} 404 - Prompt not found
 * @returns {Error} 500 - Internal server error
 */
router.post(
  '/api/admin/prompts/:promptId/generate-matches',
  async (req, res) => {
    try {
      const { promptId } = req.params;
      const { firebaseUid } = req.body;

      if (!firebaseUid) {
        return res.status(400).json({ error: 'firebaseUid is required' });
      }

      // Verify admin access
      const isAdmin = await verifyAdminAccess(firebaseUid);
      if (!isAdmin) {
        return res
          .status(403)
          .json({ error: 'Unauthorized: Admin access required' });
      }

      // Check if prompt exists
      const existingPrompt = await getPromptById(promptId);
      if (!existingPrompt) {
        return res.status(404).json({ error: 'Prompt not found' });
      }

      console.log(
        `Admin ${firebaseUid} manually triggering match generation for prompt ${promptId}`
      );

      // Generate matches (bypasses date validations)
      const matchedCount = await generateMatchesForPrompt(promptId);

      res.status(200).json({
        message: 'Match generation completed',
        promptId,
        matchedCount,
      });
    } catch (error) {
      console.error('Error generating matches:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: errorMessage });
    }
  }
);

/**
 * DELETE /api/admin/prompts/active
 * Delete the currently active prompt
 * @route DELETE /api/admin/prompts/active
 * @group Admin - Admin prompt management
 * @param {string} firebaseUid.body.required - Firebase authentication UID
 * @returns {object} Success message with deleted prompt ID
 * @returns {Error} 400 - Missing firebaseUid
 * @returns {Error} 403 - Unauthorized (not admin)
 * @returns {Error} 404 - No active prompt found
 * @returns {Error} 500 - Internal server error
 */
router.delete('/api/admin/prompts/active', async (req, res) => {
  try {
    const { firebaseUid } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ error: 'firebaseUid is required' });
    }

    // Verify admin access
    const isAdmin = await verifyAdminAccess(firebaseUid);
    if (!isAdmin) {
      return res
        .status(403)
        .json({ error: 'Unauthorized: Admin access required' });
    }

    // Find the active prompt
    const activePrompts = await getAllPrompts({ active: true });

    if (activePrompts.length === 0) {
      return res.status(404).json({ error: 'No active prompt found' });
    }

    const activePrompt = activePrompts[0];

    console.log(
      `Admin ${firebaseUid} deleting active prompt: ${activePrompt.promptId}`
    );

    // Delete the active prompt
    await deletePrompt(activePrompt.promptId);

    res.status(200).json({
      message: 'Active prompt deleted successfully',
      promptId: activePrompt.promptId
    });
  } catch (error) {
    console.error('Error deleting active prompt:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
