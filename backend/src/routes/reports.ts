import express from 'express';
import { db } from '../../firebaseAdmin';
import { AuthenticatedRequest, authenticateUser } from '../middleware/auth';
import { authenticatedRateLimit } from '../middleware/rateLimiting';
import { body, validationResult } from 'express-validator';
import {
  createReport,
  reportToResponse,
} from '../services/reportsService';
import { CreateReportInput, ReportReason } from '../../types';

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
// VALIDATION MIDDLEWARE
// =============================================================================

const validateReportCreation = [
  body('reportedNetid')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Reported user netid is required'),
  body('reason')
    .isString()
    .trim()
    .notEmpty()
    .isIn([
      'inappropriate_content',
      'harassment',
      'spam',
      'fake_profile',
      'other',
    ])
    .withMessage('Valid reason is required'),
  body('description')
    .isString()
    .trim()
    .notEmpty()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
];

// =============================================================================
// REPORT ENDPOINTS
// =============================================================================

/**
 * POST /api/reports
 * Submit a user report
 * Body: { reportedNetid: string, reason: ReportReason, description: string }
 */
router.post(
  '/api/reports',
  authenticatedRateLimit,
  authenticateUser,
  validateReportCreation,
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      // Check validation results
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: errors.array()[0].msg,
        });
      }

      const { reportedNetid, reason, description } = req.body;

      // Get the authenticated user's netid
      const reporterNetid = await getNetidFromAuth(req.user!.uid);
      if (!reporterNetid) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify reported user exists
      const reportedUserSnapshot = await db
        .collection('users')
        .where('netid', '==', reportedNetid)
        .limit(1)
        .get();

      if (reportedUserSnapshot.empty) {
        return res.status(404).json({ error: 'Reported user not found' });
      }

      // Create report input
      const reportInput: CreateReportInput = {
        reportedNetid,
        reason: reason as ReportReason,
        description,
      };

      // Create the report (includes spam prevention)
      const { report, id } = await createReport(reporterNetid, reportInput);

      // Convert to response format
      const response = reportToResponse(report, id);

      res.status(201).json(response);
    } catch (error: any) {
      console.error('Error creating report:', error);
      console.error('Error stack:', error.stack);
      console.error('Request body:', req.body);
      console.error('User ID:', req.user?.uid);

      // Handle specific error messages from service layer
      if (
        error.message === 'You cannot report yourself' ||
        error.message.includes('reports per') ||
        error.message.includes('Description must')
      ) {
        return res.status(400).json({ error: error.message });
      }

      // Return more detailed error in development, generic in production
      const errorMessage =
        process.env.NODE_ENV === 'development'
          ? `Failed to create report: ${error.message}`
          : 'Failed to create report. Please try again.';

      res.status(500).json({ error: errorMessage });
    }
  }
);

export default router;
