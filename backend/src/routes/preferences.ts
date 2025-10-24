import express from 'express';
import { db } from '../../firebaseAdmin';
import { PreferencesResponse, UpdatePreferencesInput } from '../../types';
import {
  createDefaultPreferences,
  getPreferences,
  preferencesToResponse,
  updatePreferences,
} from '../services/preferencesService';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { authenticatedRateLimit } from '../middleware/rateLimiting';
import { validatePreferences, validate } from '../middleware/validation';

const router = express.Router();

/**
 * Gets netid from authenticated Firebase UID
 */
const getNetidFromAuth = async (firebaseUid: string): Promise<string | null> => {
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

/**
 * GET /api/preferences
 * Get current user's preferences (requires authentication)
 */
router.get(
  '/api/preferences',
  authenticatedRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      // Get netid from authenticated user
      const netid = await getNetidFromAuth(req.user!.uid);
      if (!netid) {
        return res.status(404).json({ error: 'User not found' });
      }

      const preferences = await getPreferences(netid);

      if (!preferences) {
        return res.status(404).json({ error: 'Preferences not found' });
      }

      const response = preferencesToResponse(preferences);
      res.status(200).json(response);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      res.status(500).json({ error: 'Failed to fetch preferences' });
    }
  }
) as any;

/**
 * PUT /api/preferences
 * Update current user's preferences (requires authentication)
 */
router.put(
  '/api/preferences',
  authenticatedRateLimit,
  authenticateUser,
  validatePreferences,
  validate,
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const updates: UpdatePreferencesInput = req.body;

      // Get netid from authenticated user
      const netid = await getNetidFromAuth(req.user!.uid);
      if (!netid) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if preferences exist
      const existingPreferences = await getPreferences(netid);
      if (!existingPreferences) {
        return res.status(404).json({ error: 'Preferences not found' });
      }

      // Update preferences
      const updatedPreferences = await updatePreferences(netid, updates);
      const response = preferencesToResponse(updatedPreferences);

      res.status(200).json(response);
    } catch (error) {
      console.error('Error updating preferences:', error);
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  }
) as any;

/**
 * POST /api/preferences/initialize
 * Create default preferences (called during onboarding, requires authentication)
 */
router.post(
  '/api/preferences/initialize',
  authenticatedRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      // Get netid from authenticated user
      const netid = await getNetidFromAuth(req.user!.uid);
      if (!netid) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if preferences already exist
      const existingPreferences = await getPreferences(netid);
      if (existingPreferences) {
        return res
          .status(409)
          .json({ error: 'Preferences already exist for this user' });
      }

      // Create default preferences
      const preferences = await createDefaultPreferences(netid);
      const response = preferencesToResponse(preferences);

      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating preferences:', error);
      res.status(500).json({ error: 'Failed to create preferences' });
    }
  }
) as any;

export default router;
