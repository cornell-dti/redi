/**
 * Push Token Routes
 *
 * Endpoints for managing user push notification tokens and preferences
 */

import express from 'express';
import { db } from '../../firebaseAdmin';
import { AuthenticatedRequest, authenticateUser } from '../middleware/auth';
import {
  registerPushToken,
  removePushToken,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../services/deviceTokenService';
import { chatRateLimit } from '../middleware/rateLimiting';

const router = express.Router();

/**
 * POST /api/users/push-token
 * Register or update a user's push notification token
 *
 * @secured Requires authentication
 *
 * @param {string} pushToken.body.required - Expo push notification token
 * @returns {object} 200 - Success response
 * @returns {Error} 400 - Invalid token format
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 500 - Internal server error
 */
router.post(
  '/api/users/push-token',
  chatRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { pushToken } = req.body;

      if (!pushToken || typeof pushToken !== 'string') {
        return res.status(400).json({ error: 'pushToken is required' });
      }

      // Get user's netid from Firebase UID
      const userSnapshot = await db
        .collection('users')
        .where('firebaseUid', '==', req.user.uid)
        .limit(1)
        .get();

      if (userSnapshot.empty) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userData = userSnapshot.docs[0].data();
      const netid = userData.netid;

      // Register the push token
      await registerPushToken(netid, pushToken);

      res.status(200).json({
        success: true,
        message: 'Push token registered successfully',
      });
    } catch (error) {
      console.error('Error registering push token:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('Invalid')) {
        return res.status(400).json({ error: errorMessage });
      }

      res.status(500).json({ error: 'Failed to register push token' });
    }
  }
);

/**
 * DELETE /api/users/push-token
 * Remove a user's push notification token
 *
 * @secured Requires authentication
 *
 * @returns {object} 200 - Success response
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 500 - Internal server error
 */
router.delete(
  '/api/users/push-token',
  chatRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get user's netid from Firebase UID
      const userSnapshot = await db
        .collection('users')
        .where('firebaseUid', '==', req.user.uid)
        .limit(1)
        .get();

      if (userSnapshot.empty) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userData = userSnapshot.docs[0].data();
      const netid = userData.netid;

      // Remove the push token
      await removePushToken(netid);

      res.status(200).json({
        success: true,
        message: 'Push token removed successfully',
      });
    } catch (error) {
      console.error('Error removing push token:', error);
      res.status(500).json({ error: 'Failed to remove push token' });
    }
  }
);

/**
 * GET /api/users/notification-preferences
 * Get user's notification preferences
 *
 * @secured Requires authentication
 *
 * @returns {object} 200 - Notification preferences
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 500 - Internal server error
 */
router.get(
  '/api/users/notification-preferences',
  chatRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get user's netid from Firebase UID
      const userSnapshot = await db
        .collection('users')
        .where('firebaseUid', '==', req.user.uid)
        .limit(1)
        .get();

      if (userSnapshot.empty) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userData = userSnapshot.docs[0].data();
      const netid = userData.netid;

      // Get notification preferences
      const preferences = await getNotificationPreferences(netid);

      res.status(200).json(preferences);
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      res.status(500).json({ error: 'Failed to get notification preferences' });
    }
  }
);

/**
 * PUT /api/users/notification-preferences
 * Update user's notification preferences
 *
 * @secured Requires authentication
 *
 * @param {boolean} newMessages.body - Enable/disable new message notifications
 * @param {boolean} matchDrops.body - Enable/disable match drop notifications
 * @param {boolean} mutualNudges.body - Enable/disable mutual nudge notifications
 * @returns {object} 200 - Success response with updated preferences
 * @returns {Error} 400 - Invalid input
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 500 - Internal server error
 */
router.put(
  '/api/users/notification-preferences',
  chatRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { newMessages, matchDrops, mutualNudges } = req.body;

      // Validate that at least one preference is provided
      if (
        newMessages === undefined &&
        matchDrops === undefined &&
        mutualNudges === undefined
      ) {
        return res.status(400).json({
          error:
            'At least one notification preference must be provided',
        });
      }

      // Validate types
      if (
        (newMessages !== undefined && typeof newMessages !== 'boolean') ||
        (matchDrops !== undefined && typeof matchDrops !== 'boolean') ||
        (mutualNudges !== undefined && typeof mutualNudges !== 'boolean')
      ) {
        return res.status(400).json({
          error: 'Notification preferences must be boolean values',
        });
      }

      // Get user's netid from Firebase UID
      const userSnapshot = await db
        .collection('users')
        .where('firebaseUid', '==', req.user.uid)
        .limit(1)
        .get();

      if (userSnapshot.empty) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userData = userSnapshot.docs[0].data();
      const netid = userData.netid;

      // Update notification preferences
      const preferences: {
        newMessages?: boolean;
        matchDrops?: boolean;
        mutualNudges?: boolean;
      } = {};

      if (newMessages !== undefined) preferences.newMessages = newMessages;
      if (matchDrops !== undefined) preferences.matchDrops = matchDrops;
      if (mutualNudges !== undefined) preferences.mutualNudges = mutualNudges;

      await updateNotificationPreferences(netid, preferences);

      // Get updated preferences to return
      const updatedPreferences = await getNotificationPreferences(netid);

      res.status(200).json({
        success: true,
        message: 'Notification preferences updated successfully',
        preferences: updatedPreferences,
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      res
        .status(500)
        .json({ error: 'Failed to update notification preferences' });
    }
  }
);

export default router;
