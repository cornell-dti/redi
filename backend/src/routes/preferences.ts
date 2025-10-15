import express from 'express';
import { db } from '../../firebaseAdmin';
import { PreferencesResponse, UpdatePreferencesInput } from '../../types';
import {
  createDefaultPreferences,
  getPreferences,
  preferencesToResponse,
  updatePreferences,
} from '../services/preferencesService';

const router = express.Router();

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

/**
 * Validates preference data
 * @param preferences - Preferences data to validate
 * @returns Array of error messages (empty if valid)
 */
function validatePreferences(preferences: UpdatePreferencesInput): string[] {
  const errors: string[] = [];

  // Age range validation
  if (preferences.ageRange) {
    const { min, max } = preferences.ageRange;
    if (min < 16) errors.push('Minimum age must be at least 16');
    if (min >= max) errors.push('Minimum age must be less than maximum age');
  }

  // Gender validation
  if (preferences.genders && preferences.genders.length === 0) {
    errors.push('Please select at least one gender');
  }

  // Year validation
  if (preferences.years && preferences.years.length === 0) {
    errors.push('Please select at least one year');
  }

  return errors;
}

/**
 * GET /api/preferences
 * Get current user's preferences
 * @route GET /api/preferences
 * @group Preferences - Preferences management operations
 * @param {string} firebaseUid.query.required - Firebase authentication UID
 * @returns {PreferencesResponse} User's preferences
 * @returns {Error} 400 - Missing or invalid firebaseUid
 * @returns {Error} 404 - User or preferences not found
 * @returns {Error} 500 - Internal server error
 */
router.get('/api/preferences', async (req, res) => {
  try {
    const { firebaseUid } = req.query;

    if (!firebaseUid || typeof firebaseUid !== 'string') {
      return res.status(400).json({ error: 'firebaseUid is required' });
    }

    // Get netid from firebaseUid
    const netid = await verifyUserExists(firebaseUid);
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * PUT /api/preferences
 * Update current user's preferences
 * @route PUT /api/preferences
 * @group Preferences - Preferences management operations
 * @param {string} firebaseUid.body.required - Firebase authentication UID
 * @param {UpdatePreferencesInput} updates.body - Partial preferences data to update
 * @returns {PreferencesResponse} Updated preferences
 * @returns {Error} 400 - Missing firebaseUid or invalid data
 * @returns {Error} 404 - User or preferences not found
 * @returns {Error} 500 - Internal server error
 */
router.put('/api/preferences', async (req, res) => {
  try {
    const {
      firebaseUid,
      ...updates
    }: { firebaseUid: string } & UpdatePreferencesInput = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ error: 'firebaseUid is required' });
    }

    // Verify user exists and get their netid
    const netid = await verifyUserExists(firebaseUid);
    if (!netid) {
      return res
        .status(400)
        .json({ error: 'User not found or invalid firebaseUid' });
    }

    // Validate preferences data
    const validationErrors = validatePreferences(updates);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * POST /api/preferences/initialize
 * Create default preferences (called during onboarding)
 * @route POST /api/preferences/initialize
 * @group Preferences - Preferences management operations
 * @param {string} firebaseUid.body.required - Firebase authentication UID
 * @returns {PreferencesResponse} Created preferences
 * @returns {Error} 400 - Missing firebaseUid or user not found
 * @returns {Error} 409 - Preferences already exist
 * @returns {Error} 500 - Internal server error
 */
router.post('/api/preferences/initialize', async (req, res) => {
  try {
    const { firebaseUid } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ error: 'firebaseUid is required' });
    }

    // Verify user exists and get their netid
    const netid = await verifyUserExists(firebaseUid);
    if (!netid) {
      return res
        .status(400)
        .json({ error: 'User not found or invalid firebaseUid' });
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
