/**
 * Admin Reports Routes
 *
 * Secure admin endpoints for managing user reports.
 * All routes are protected by requireAdmin middleware which:
 * - Verifies Bearer token
 * - Checks admin custom claim
 * - Verifies user in admins collection
 *
 * All admin actions are logged to audit log for security and compliance.
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import { ReportStatus, UpdateReportStatusInput } from '../../types';
import { AdminRequest, requireAdmin } from '../middleware/adminAuth';
import {
  getIpAddress,
  getUserAgent,
  logAdminAction,
} from '../services/auditLog';
import {
  getReportById,
  getReportsWithProfiles,
  reportToResponse,
  updateReportStatus,
} from '../services/reportsService';

const router = express.Router();

// Apply admin middleware to ALL routes in this router
router.use(requireAdmin);

// =============================================================================
// VALIDATION MIDDLEWARE
// =============================================================================

const validateStatusUpdate = [
  body('status')
    .isString()
    .trim()
    .notEmpty()
    .isIn(['pending', 'under_review', 'resolved', 'dismissed'])
    .withMessage('Valid status is required'),
  body('resolution')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Resolution must not exceed 1000 characters'),
];

// =============================================================================
// ADMIN REPORT ENDPOINTS
// =============================================================================

/**
 * GET /api/admin/reports
 * Get all reports with optional status filtering
 *
 * @secured Requires admin authentication
 * @query {string} status - Optional status filter (pending, under_review, resolved, dismissed)
 * @returns {ReportWithProfilesResponse[]} 200 - Array of reports with profile info
 * @returns {Error} 400 - Invalid status filter
 * @returns {Error} 401/403 - Unauthorized
 * @returns {Error} 500 - Internal server error
 */
router.get('/api/admin/reports', async (req: AdminRequest, res) => {
  try {
    const { status } = req.query;

    // Validate status filter if provided
    if (
      status &&
      !['pending', 'under_review', 'resolved', 'dismissed'].includes(
        status as string
      )
    ) {
      return res.status(400).json({
        error: 'Invalid status filter',
      });
    }

    const reports = await getReportsWithProfiles(status as ReportStatus);

    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

/**
 * GET /api/admin/reports/:reportId
 * Get a single report by ID
 *
 * @secured Requires admin authentication
 * @param {string} reportId - Report document ID
 * @returns {ReportResponse} 200 - Report details
 * @returns {Error} 404 - Report not found
 * @returns {Error} 500 - Internal server error
 */
router.get('/api/admin/reports/:reportId', async (req: AdminRequest, res) => {
  try {
    const { reportId } = req.params;

    const report = await getReportById(reportId);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const response = reportToResponse(report, reportId);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

/**
 * PATCH /api/admin/reports/:reportId/status
 * Update report status
 *
 * @secured Requires admin authentication
 * @audit Logs UPDATE_REPORT_STATUS action
 * @param {string} reportId - Report document ID
 * @body {UpdateReportStatusInput} - Status update data
 * @returns {ReportResponse} 200 - Updated report
 * @returns {Error} 400 - Invalid data
 * @returns {Error} 404 - Report not found
 * @returns {Error} 500 - Internal server error
 */
router.patch(
  '/api/admin/reports/:reportId/status',
  validateStatusUpdate,
  async (req: AdminRequest, res: express.Response) => {
    try {
      // Check validation results
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('Validation errors:', errors.array());
        return res.status(400).json({
          error: errors.array()[0].msg,
        });
      }

      const { reportId } = req.params;
      const { status, resolution }: UpdateReportStatusInput = req.body;

      // Update the report
      const updatedReport = await updateReportStatus(
        reportId,
        status as ReportStatus,
        req.user!.uid,
        resolution
      );

      // Log admin action
      await logAdminAction(
        'UPDATE_REPORT_STATUS',
        req.user!.uid,
        req.user!.email,
        'report',
        reportId,
        {
          status,
          resolution: resolution || undefined,
          reporterNetid: updatedReport.reporterNetid,
          reportedNetid: updatedReport.reportedNetid,
        },
        getIpAddress(req),
        getUserAgent(req)
      );

      const response = reportToResponse(updatedReport, reportId);
      res.status(200).json(response);
    } catch (error: any) {
      console.error('Error updating report status:', error);

      // Log failed action
      await logAdminAction(
        'UPDATE_REPORT_STATUS',
        req.user!.uid,
        req.user!.email,
        'report',
        req.params.reportId,
        { error: error.message },
        getIpAddress(req),
        getUserAgent(req),
        false,
        error.message
      );

      if (error.message === 'Report not found') {
        return res.status(404).json({ error: error.message });
      }

      res.status(500).json({ error: 'Failed to update report status' });
    }
  }
);

/**
 * PATCH /api/admin/reports/:reportId/resolve
 * Mark report as resolved with resolution notes
 *
 * @secured Requires admin authentication
 * @audit Logs RESOLVE_REPORT action
 * @param {string} reportId - Report document ID
 * @body {string} resolution - Resolution notes
 * @returns {ReportResponse} 200 - Updated report
 * @returns {Error} 400 - Invalid data
 * @returns {Error} 404 - Report not found
 * @returns {Error} 500 - Internal server error
 */
router.patch(
  '/api/admin/reports/:reportId/resolve',
  body('resolution')
    .isString()
    .trim()
    .notEmpty()
    .isLength({ max: 1000 })
    .withMessage('Resolution is required and must not exceed 1000 characters'),
  async (req: AdminRequest, res) => {
    try {
      // Check validation results
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: errors.array()[0].msg,
        });
      }

      const { reportId } = req.params;
      const { resolution } = req.body;

      // Update the report to resolved status
      const updatedReport = await updateReportStatus(
        reportId,
        'resolved',
        req.user!.uid,
        resolution
      );

      // Log admin action
      await logAdminAction(
        'RESOLVE_REPORT',
        req.user!.uid,
        req.user!.email,
        'report',
        reportId,
        {
          resolution,
          reporterNetid: updatedReport.reporterNetid,
          reportedNetid: updatedReport.reportedNetid,
        },
        getIpAddress(req),
        getUserAgent(req)
      );

      const response = reportToResponse(updatedReport, reportId);
      res.status(200).json(response);
    } catch (error: any) {
      console.error('Error resolving report:', error);

      // Log failed action
      await logAdminAction(
        'RESOLVE_REPORT',
        req.user!.uid,
        req.user!.email,
        'report',
        req.params.reportId,
        { error: error.message },
        getIpAddress(req),
        getUserAgent(req),
        false,
        error.message
      );

      if (error.message === 'Report not found') {
        return res.status(404).json({ error: error.message });
      }

      res.status(500).json({ error: 'Failed to resolve report' });
    }
  }
);

export default router;
