/**
 * Admin Reports API Tests
 * Tests for admin report management endpoints:
 * - GET /api/admin/reports
 * - GET /api/admin/reports/:reportId
 * - PATCH /api/admin/reports/:reportId/status
 * - PATCH /api/admin/reports/:reportId/resolve
 */

import express from 'express';
import { db } from '../../../firebaseAdmin';
import adminReportsRouter from '../admin-reports';
import {
  mockFirebaseAuth,
  mockFirebaseAdminAuth,
  createTestApp,
  authenticatedGet,
  authenticatedPatch,
  unauthenticatedGet,
} from '../../__tests__/helpers/testHelpers';
import {
  createMockDocSnapshot,
  createMockQuerySnapshot,
  createMockCollection,
} from '../../__tests__/helpers/mockFirestore';
import {
  createMockReport,
  createMockProfile,
  createMockAdmin,
  createMockReports,
} from '../../__tests__/helpers/factories';

// Create test app
const app = createTestApp(adminReportsRouter);

describe('Admin Reports API', () => {
  let mockReportsCollection: any;
  let mockProfilesCollection: any;
  let mockAdminsCollection: any;
  let mockAuditLogsCollection: any;

  beforeEach(() => {
    // Create fresh mock collections for each test
    mockReportsCollection = createMockCollection();
    mockProfilesCollection = createMockCollection();
    mockAdminsCollection = createMockCollection();
    mockAuditLogsCollection = createMockCollection();

    // Setup db.collection mock
    (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
      switch (collectionName) {
        case 'reports':
          return mockReportsCollection;
        case 'profiles':
          return mockProfilesCollection;
        case 'admins':
          return mockAdminsCollection;
        case 'auditLogs':
          return mockAuditLogsCollection;
        default:
          return createMockCollection();
      }
    });
  });

  // =============================================================================
  // GET /api/admin/reports - Get all reports
  // =============================================================================

  describe('GET /api/admin/reports', () => {
    describe('Authentication & Authorization', () => {
      it('should require authentication', async () => {
        const response = await unauthenticatedGet(app, '/api/admin/reports');

        expect(response.status).toBe(401);
        expect(response.body.error).toMatch(/authentication token/i);
      });

      it('should require admin authentication', async () => {
        // Mock regular user (not admin)
        mockFirebaseAuth({ uid: 'user-uid', admin: false });

        // Mock admins collection - user not found
        mockAdminsCollection.doc.mockReturnThis();
        mockAdminsCollection.get.mockResolvedValue(
          createMockDocSnapshot('user-uid', null)
        );

        const response = await authenticatedGet(app, '/api/admin/reports', 'admin');

        expect(response.status).toBe(403);
        expect(response.body.error).toMatch(/admin/i);
      });
    });

    describe('Success Cases', () => {
      beforeEach(() => {
        // Mock admin authentication
        mockFirebaseAdminAuth({ uid: 'admin-uid' });

        // Mock admin exists in admins collection
        mockAdminsCollection.doc.mockReturnThis();
        mockAdminsCollection.get.mockResolvedValue(
          createMockDocSnapshot('admin-uid', createMockAdmin({ uid: 'admin-uid' }))
        );
      });

      it('should return all reports for admin', async () => {
        const mockReports = createMockReports(3);

        // Mock reports query
        mockReportsCollection.orderBy.mockReturnThis();
        mockReportsCollection.get.mockResolvedValue(
          createMockQuerySnapshot(
            mockReports.map((report, i) => ({
              id: `report-${i}`,
              data: report,
            }))
          )
        );

        // Mock profile lookups for enrichment
        mockProfilesCollection.where.mockReturnThis();
        mockProfilesCollection.limit.mockReturnThis();
        mockProfilesCollection.get.mockResolvedValue(
          createMockQuerySnapshot([
            {
              id: 'profile-1',
              data: createMockProfile({ netid: 'reporter0', firstName: 'Alice' }),
            },
          ])
        );

        const response = await authenticatedGet(app, '/api/admin/reports', 'admin');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(3);

        // Verify reports have profile info
        response.body.forEach((report: any) => {
          expect(report).toHaveProperty('id');
          expect(report).toHaveProperty('reporterNetid');
          expect(report).toHaveProperty('reportedNetid');
          expect(report).toHaveProperty('reporterName');
          expect(report).toHaveProperty('reportedName');
        });
      });

      it('should filter reports by status', async () => {
        const mockReports = [
          createMockReport({ status: 'pending' }),
          createMockReport({ status: 'under_review' }),
        ];

        // Mock reports query with status filter
        mockReportsCollection.orderBy.mockReturnThis();
        mockReportsCollection.where.mockReturnThis();
        mockReportsCollection.get.mockResolvedValue(
          createMockQuerySnapshot([
            { id: 'report-1', data: mockReports[0] },
          ])
        );

        // Mock profile lookups
        mockProfilesCollection.where.mockReturnThis();
        mockProfilesCollection.limit.mockReturnThis();
        mockProfilesCollection.get.mockResolvedValue(
          createMockQuerySnapshot([
            {
              id: 'profile-1',
              data: createMockProfile(),
            },
          ])
        );

        const response = await authenticatedGet(
          app,
          '/api/admin/reports?status=pending',
          'admin'
        );

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.every((r: any) => r.status === 'pending')).toBe(true);
      });

      it('should sort reports by createdAt desc', async () => {
        const now = new Date();
        const mockReports = [
          createMockReport({ createdAt: new Date(now.getTime() - 1000) }),
          createMockReport({ createdAt: new Date(now.getTime() - 2000) }),
          createMockReport({ createdAt: new Date(now.getTime() - 3000) }),
        ];

        mockReportsCollection.orderBy.mockReturnThis();
        mockReportsCollection.get.mockResolvedValue(
          createMockQuerySnapshot(
            mockReports.map((report, i) => ({
              id: `report-${i}`,
              data: report,
            }))
          )
        );

        // Mock profile lookups
        mockProfilesCollection.where.mockReturnThis();
        mockProfilesCollection.limit.mockReturnThis();
        mockProfilesCollection.get.mockResolvedValue(
          createMockQuerySnapshot([
            { id: 'profile-1', data: createMockProfile() },
          ])
        );

        const response = await authenticatedGet(app, '/api/admin/reports', 'admin');

        expect(response.status).toBe(200);
        expect(mockReportsCollection.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
      });

      it('should return 400 for invalid status filter', async () => {
        const response = await authenticatedGet(
          app,
          '/api/admin/reports?status=invalid',
          'admin'
        );

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/invalid status/i);
      });
    });
  });

  // =============================================================================
  // GET /api/admin/reports/:reportId - Get single report
  // =============================================================================

  describe('GET /api/admin/reports/:reportId', () => {
    beforeEach(() => {
      mockFirebaseAdminAuth({ uid: 'admin-uid' });

      mockAdminsCollection.doc.mockReturnThis();
      mockAdminsCollection.get.mockResolvedValue(
        createMockDocSnapshot('admin-uid', createMockAdmin({ uid: 'admin-uid' }))
      );
    });

    it('should require admin authentication', async () => {
      // Override with non-admin user
      mockFirebaseAuth({ uid: 'user-uid', admin: false });

      mockAdminsCollection.doc.mockReturnThis();
      mockAdminsCollection.get.mockResolvedValue(
        createMockDocSnapshot('user-uid', null)
      );

      const response = await authenticatedGet(
        app,
        '/api/admin/reports/report-123',
        'admin'
      );

      expect(response.status).toBe(403);
    });

    it('should return single report by ID', async () => {
      const mockReport = createMockReport({
        reporterNetid: 'reporter123',
        reportedNetid: 'reported456',
        reason: 'harassment',
      });

      mockReportsCollection.doc.mockReturnThis();
      mockReportsCollection.get.mockResolvedValue(
        createMockDocSnapshot('report-123', mockReport)
      );

      const response = await authenticatedGet(
        app,
        '/api/admin/reports/report-123',
        'admin'
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: 'report-123',
        reporterNetid: 'reporter123',
        reportedNetid: 'reported456',
        reason: 'harassment',
        status: 'pending',
      });
    });

    it('should return 404 for non-existent report', async () => {
      mockReportsCollection.doc.mockReturnThis();
      mockReportsCollection.get.mockResolvedValue(
        createMockDocSnapshot('nonexistent', null)
      );

      const response = await authenticatedGet(
        app,
        '/api/admin/reports/nonexistent',
        'admin'
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toMatch(/not found/i);
    });
  });

  // =============================================================================
  // PATCH /api/admin/reports/:reportId/status - Update report status
  // =============================================================================

  describe('PATCH /api/admin/reports/:reportId/status', () => {
    beforeEach(() => {
      mockFirebaseAdminAuth({ uid: 'admin-uid', email: 'admin@cornell.edu' });

      mockAdminsCollection.doc.mockReturnThis();
      mockAdminsCollection.get.mockResolvedValue(
        createMockDocSnapshot('admin-uid', createMockAdmin({ uid: 'admin-uid' }))
      );
    });

    it('should require admin authentication', async () => {
      mockFirebaseAuth({ uid: 'user-uid', admin: false });

      mockAdminsCollection.doc.mockReturnThis();
      mockAdminsCollection.get.mockResolvedValue(
        createMockDocSnapshot('user-uid', null)
      );

      const response = await authenticatedPatch(
        app,
        '/api/admin/reports/report-123/status',
        { status: 'under_review' },
        'admin'
      );

      expect(response.status).toBe(403);
    });

    it('should validate status is valid', async () => {
      const mockReport = createMockReport();

      mockReportsCollection.doc.mockReturnThis();
      mockReportsCollection.get.mockResolvedValue(
        createMockDocSnapshot('report-123', mockReport)
      );

      const response = await authenticatedPatch(
        app,
        '/api/admin/reports/report-123/status',
        { status: 'invalid_status' },
        'admin'
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/valid status/i);
    });

    it('should update report status to under_review', async () => {
      const mockReport = createMockReport({ status: 'pending' });
      const updatedReport = { ...mockReport, status: 'under_review' };

      mockReportsCollection.doc.mockReturnThis();
      mockReportsCollection.update.mockResolvedValue(undefined);
      mockReportsCollection.get
        .mockResolvedValueOnce(createMockDocSnapshot('report-123', mockReport))
        .mockResolvedValueOnce(createMockDocSnapshot('report-123', updatedReport));

      // Mock audit log creation
      mockAuditLogsCollection.add.mockResolvedValue({ id: 'audit-123' });

      const response = await authenticatedPatch(
        app,
        '/api/admin/reports/report-123/status',
        { status: 'under_review' },
        'admin'
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('under_review');
      expect(mockReportsCollection.update).toHaveBeenCalled();
    });

    it('should update report status to dismissed', async () => {
      const mockReport = createMockReport({ status: 'pending' });
      const updatedReport = { ...mockReport, status: 'dismissed' };

      mockReportsCollection.doc.mockReturnThis();
      mockReportsCollection.update.mockResolvedValue(undefined);
      mockReportsCollection.get
        .mockResolvedValueOnce(createMockDocSnapshot('report-123', mockReport))
        .mockResolvedValueOnce(createMockDocSnapshot('report-123', updatedReport));

      mockAuditLogsCollection.add.mockResolvedValue({ id: 'audit-123' });

      const response = await authenticatedPatch(
        app,
        '/api/admin/reports/report-123/status',
        { status: 'dismissed' },
        'admin'
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('dismissed');
    });

    it('should update status without errors', async () => {
      const mockReport = createMockReport();
      const updatedReport = { ...mockReport, status: 'under_review' };

      mockReportsCollection.doc.mockReturnThis();
      mockReportsCollection.update.mockResolvedValue(undefined);
      mockReportsCollection.get
        .mockResolvedValueOnce(createMockDocSnapshot('report-123', mockReport))
        .mockResolvedValueOnce(createMockDocSnapshot('report-123', updatedReport));

      mockAuditLogsCollection.add.mockResolvedValue({ id: 'audit-123' });

      const response = await authenticatedPatch(
        app,
        '/api/admin/reports/report-123/status',
        { status: 'under_review' },
        'admin'
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('under_review');
    });

    it('should return 404 for non-existent report', async () => {
      mockReportsCollection.doc.mockReturnThis();
      mockReportsCollection.get.mockResolvedValue(
        createMockDocSnapshot('nonexistent', null)
      );

      const response = await authenticatedPatch(
        app,
        '/api/admin/reports/nonexistent/status',
        { status: 'under_review' },
        'admin'
      );

      expect(response.status).toBe(404);
    });
  });

  // =============================================================================
  // PATCH /api/admin/reports/:reportId/resolve - Resolve report
  // =============================================================================

  describe('PATCH /api/admin/reports/:reportId/resolve', () => {
    beforeEach(() => {
      mockFirebaseAdminAuth({ uid: 'admin-uid', email: 'admin@cornell.edu' });

      mockAdminsCollection.doc.mockReturnThis();
      mockAdminsCollection.get.mockResolvedValue(
        createMockDocSnapshot('admin-uid', createMockAdmin({ uid: 'admin-uid' }))
      );
    });

    it('should require admin authentication', async () => {
      mockFirebaseAuth({ uid: 'user-uid', admin: false });

      mockAdminsCollection.doc.mockReturnThis();
      mockAdminsCollection.get.mockResolvedValue(
        createMockDocSnapshot('user-uid', null)
      );

      const response = await authenticatedPatch(
        app,
        '/api/admin/reports/report-123/resolve',
        { resolution: 'Issue has been resolved' },
        'admin'
      );

      expect(response.status).toBe(403);
    });

    it('should validate resolution notes are provided', async () => {
      const response = await authenticatedPatch(
        app,
        '/api/admin/reports/report-123/resolve',
        { resolution: '' },
        'admin'
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
      // Error message format may vary
    });

    it('should resolve report with notes', async () => {
      const mockReport = createMockReport({ status: 'under_review' });
      const resolvedReport = {
        ...mockReport,
        status: 'resolved',
        resolution: 'User has been warned and will be monitored',
        reviewedBy: 'admin-uid',
      };

      mockReportsCollection.doc.mockReturnThis();
      mockReportsCollection.update.mockResolvedValue(undefined);
      mockReportsCollection.get
        .mockResolvedValueOnce(createMockDocSnapshot('report-123', mockReport))
        .mockResolvedValueOnce(createMockDocSnapshot('report-123', resolvedReport));

      mockAuditLogsCollection.add.mockResolvedValue({ id: 'audit-123' });

      const response = await authenticatedPatch(
        app,
        '/api/admin/reports/report-123/resolve',
        { resolution: 'User has been warned and will be monitored' },
        'admin'
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('resolved');
      expect(response.body.resolution).toBe('User has been warned and will be monitored');
    });

    it('should resolve report successfully', async () => {
      const mockReport = createMockReport();
      const resolvedReport = {
        ...mockReport,
        status: 'resolved',
        resolution: 'Resolved',
      };

      mockReportsCollection.doc.mockReturnThis();
      mockReportsCollection.update.mockResolvedValue(undefined);
      mockReportsCollection.get
        .mockResolvedValueOnce(createMockDocSnapshot('report-123', mockReport))
        .mockResolvedValueOnce(createMockDocSnapshot('report-123', resolvedReport));

      mockAuditLogsCollection.add.mockResolvedValue({ id: 'audit-123' });

      const response = await authenticatedPatch(
        app,
        '/api/admin/reports/report-123/resolve',
        { resolution: 'Resolved' },
        'admin'
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('resolved');
    });

    it('should return 404 for non-existent report', async () => {
      mockReportsCollection.doc.mockReturnThis();
      mockReportsCollection.get.mockResolvedValue(
        createMockDocSnapshot('nonexistent', null)
      );

      const response = await authenticatedPatch(
        app,
        '/api/admin/reports/nonexistent/resolve',
        { resolution: 'Test resolution' },
        'admin'
      );

      expect(response.status).toBe(404);
    });
  });
});
