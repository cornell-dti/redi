import express, { Response } from 'express';
import { AdminRequest, requireAdmin } from '../middleware/adminAuth';
import {
  logAdminAction,
  getIpAddress,
  getUserAgent,
} from '../services/auditLog';
import {
  getDemographicBreakdown,
  getCompatibilityMatrix,
  getEngagementMetrics,
  getMutualNudgeStats,
} from '../services/analyticsService';

const router = express.Router();

// Apply admin middleware to ALL routes
router.use(requireAdmin);

/**
 * GET /api/admin/analytics/demographics
 * Get demographic breakdown with optional prompt filter
 *
 * Query params:
 *   - promptId (optional): Filter to users who answered this prompt
 *
 * @secured Requires admin authentication
 * @audit Logs VIEW_DEMOGRAPHICS_ANALYTICS action
 */
router.get(
  '/api/admin/analytics/demographics',
  async (req: AdminRequest, res: Response) => {
    try {
      const { promptId } = req.query;

      const data = await getDemographicBreakdown(
        promptId as string | undefined
      );

      // Log successful action
      await logAdminAction(
        'VIEW_DEMOGRAPHICS_ANALYTICS',
        req.user!.uid,
        req.user!.email,
        'analytics',
        'demographics',
        { promptId: promptId || 'all', totalUsers: data.totalUsers },
        getIpAddress(req),
        getUserAgent(req)
      );

      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching demographic breakdown:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Log failed action
      await logAdminAction(
        'VIEW_DEMOGRAPHICS_ANALYTICS',
        req.user!.uid,
        req.user!.email,
        'analytics',
        'demographics',
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
 * GET /api/admin/analytics/compatibility-matrix
 * Get compatibility matrix showing supply/demand by demographic
 *
 * @secured Requires admin authentication
 * @audit Logs VIEW_COMPATIBILITY_ANALYTICS action
 */
router.get(
  '/api/admin/analytics/compatibility-matrix',
  async (req: AdminRequest, res: Response) => {
    try {
      const data = await getCompatibilityMatrix();

      await logAdminAction(
        'VIEW_COMPATIBILITY_ANALYTICS',
        req.user!.uid,
        req.user!.email,
        'analytics',
        'compatibility',
        { matrixSize: data.matrix.length },
        getIpAddress(req),
        getUserAgent(req)
      );

      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching compatibility matrix:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      await logAdminAction(
        'VIEW_COMPATIBILITY_ANALYTICS',
        req.user!.uid,
        req.user!.email,
        'analytics',
        'compatibility',
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
 * GET /api/admin/analytics/engagement
 * Get weekly active users and prompt response rates
 *
 * @secured Requires admin authentication
 * @audit Logs VIEW_ENGAGEMENT_ANALYTICS action
 */
router.get(
  '/api/admin/analytics/engagement',
  async (req: AdminRequest, res: Response) => {
    try {
      const data = await getEngagementMetrics();

      await logAdminAction(
        'VIEW_ENGAGEMENT_ANALYTICS',
        req.user!.uid,
        req.user!.email,
        'analytics',
        'engagement',
        {
          currentWeekActiveUsers: data.currentWeek.activeUsers,
          weeksReturned: data.historicalWeeks.length + 1,
        },
        getIpAddress(req),
        getUserAgent(req)
      );

      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching engagement metrics:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      await logAdminAction(
        'VIEW_ENGAGEMENT_ANALYTICS',
        req.user!.uid,
        req.user!.email,
        'analytics',
        'engagement',
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
 * GET /api/admin/analytics/mutual-nudges
 * Get mutual nudge rates by demographic
 *
 * @secured Requires admin authentication
 * @audit Logs VIEW_NUDGE_ANALYTICS action
 */
router.get(
  '/api/admin/analytics/mutual-nudges',
  async (req: AdminRequest, res: Response) => {
    try {
      const data = await getMutualNudgeStats();

      await logAdminAction(
        'VIEW_NUDGE_ANALYTICS',
        req.user!.uid,
        req.user!.email,
        'analytics',
        'nudges',
        {
          overallRate: data.overall.mutualNudgeRate,
          demographicsCount: data.demographics.length,
        },
        getIpAddress(req),
        getUserAgent(req)
      );

      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching mutual nudge stats:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      await logAdminAction(
        'VIEW_NUDGE_ANALYTICS',
        req.user!.uid,
        req.user!.email,
        'analytics',
        'nudges',
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
