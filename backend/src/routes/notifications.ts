import express from 'express';
import { db } from '../../firebaseAdmin';
import { AuthenticatedRequest, authenticateUser } from '../middleware/auth';
import { notificationRateLimit } from '../middleware/rateLimiting';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../services/notificationsService';

const router = express.Router();

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
// NOTIFICATION ENDPOINTS
// =============================================================================

/**
 * GET /api/notifications
 * Get all notifications for the authenticated user (last 30 days only)
 * Query params: limit (optional, default: 50)
 */
router.get(
  '/api/notifications',
  notificationRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      // Get the authenticated user's netid
      const netid = await getNetidFromAuth(req.user!.uid);
      if (!netid) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Parse limit from query params
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 50;

      // Get notifications
      const notifications = await getUserNotifications(netid, limit);

      res.status(200).json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }
);

/**
 * GET /api/notifications/unread-count
 * Get the count of unread notifications for the authenticated user (last 30 days only)
 */
router.get(
  '/api/notifications/unread-count',
  notificationRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      // Get the authenticated user's netid
      const netid = await getNetidFromAuth(req.user!.uid);
      if (!netid) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get unread count
      const count = await getUnreadCount(netid);

      res.status(200).json({ count });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ error: 'Failed to fetch unread count' });
    }
  }
);

/**
 * PUT /api/notifications/:id/read
 * Mark a specific notification as read
 */
router.put(
  '/api/notifications/:id/read',
  notificationRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const { id } = req.params;

      // Get the authenticated user's netid
      const netid = await getNetidFromAuth(req.user!.uid);
      if (!netid) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Mark notification as read
      await markAsRead(id, netid);

      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error marking notification as read:', error);

      if (error.message === 'Notification not found') {
        return res.status(404).json({ error: error.message });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: error.message });
      }

      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  }
);

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for the authenticated user
 */
router.put(
  '/api/notifications/read-all',
  notificationRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      // Get the authenticated user's netid
      const netid = await getNetidFromAuth(req.user!.uid);
      if (!netid) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Mark all notifications as read
      const count = await markAllAsRead(netid);

      res.status(200).json({ success: true, count });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res
        .status(500)
        .json({ error: 'Failed to mark all notifications as read' });
    }
  }
);

export default router;
