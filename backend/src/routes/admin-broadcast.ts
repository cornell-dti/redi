import express, { Response } from 'express';
import { AdminRequest, requireAdmin } from '../middleware/adminAuth';
import {
  logAdminAction,
  getIpAddress,
  getUserAgent,
} from '../services/auditLog';
import { sendBroadcastNotification } from '../services/pushNotificationService';
import { db } from '../../firebaseAdmin';

const router = express.Router();

// Apply admin middleware to ALL routes
router.use(requireAdmin);

/**
 * POST /api/admin/broadcast
 * Send a push notification to all users with valid push tokens
 *
 * Body:
 *   - title (string, required, max 50 chars): Notification title
 *   - body (string, required, max 200 chars): Notification body
 *
 * @secured Requires admin authentication
 * @audit Logs SEND_BROADCAST_NOTIFICATION action
 */
router.post(
  '/api/admin/broadcast',
  async (req: AdminRequest, res: Response) => {
    try {
      const { title, body } = req.body;

      // Validation
      if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: 'Title is required' });
      }

      if (!body || typeof body !== 'string') {
        return res.status(400).json({ error: 'Body is required' });
      }

      if (title.length > 50) {
        return res
          .status(400)
          .json({ error: 'Title must be 50 characters or less' });
      }

      if (body.length > 200) {
        return res
          .status(400)
          .json({ error: 'Body must be 200 characters or less' });
      }

      console.log(
        `📡 Admin ${req.user!.email} sending broadcast notification:`,
        { title, body }
      );

      // Send broadcast notification
      const result = await sendBroadcastNotification(title, body);

      // Log successful action
      await logAdminAction(
        'SEND_BROADCAST_NOTIFICATION',
        req.user!.uid,
        req.user!.email,
        'notifications',
        'broadcast',
        {
          title,
          body: body.substring(0, 50) + (body.length > 50 ? '...' : ''),
          successCount: result.successCount,
          totalUsers: result.totalUsers,
          errorCount: result.errors.length,
        },
        getIpAddress(req),
        getUserAgent(req)
      );

      res.status(200).json({
        message: `Broadcast notification sent to ${result.successCount} users`,
        successCount: result.successCount,
        totalUsers: result.totalUsers,
        errors: result.errors,
      });
    } catch (error) {
      console.error('Error sending broadcast notification:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Log failed action
      await logAdminAction(
        'SEND_BROADCAST_NOTIFICATION',
        req.user!.uid,
        req.user!.email,
        'notifications',
        'broadcast',
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
 * GET /api/admin/broadcast/user-count
 * Get the count of users with valid push tokens
 *
 * @secured Requires admin authentication
 */
router.get(
  '/api/admin/broadcast/user-count',
  async (req: AdminRequest, res: Response) => {
    try {
      // Get count of users with push tokens
      const usersSnapshot = await db
        .collection('users')
        .where('pushToken', '!=', null)
        .count()
        .get();

      const count = usersSnapshot.data().count;

      res.status(200).json({ count });
    } catch (error) {
      console.error('Error getting user count:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      res.status(500).json({ error: errorMessage });
    }
  }
);

export default router;
