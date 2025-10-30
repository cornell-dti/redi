/**
 * Reports Service Tests
 * Tests for reports service layer functions
 */

import { db } from '../../../firebaseAdmin';
import {
  createReport,
  getReportById,
  getAllReports,
  updateReportStatus,
  getReportsWithProfiles,
  reportToResponse,
  reportToResponseWithProfiles,
} from '../reportsService';
import {
  createMockDocSnapshot,
  createMockQuerySnapshot,
  createMockCollection,
} from '../../__tests__/helpers/mockFirestore';
import {
  createMockReport,
  createMockProfile,
  createMockReports,
} from '../../__tests__/helpers/factories';
import { ReportStatus } from '../../../types';

describe('ReportsService', () => {
  let mockReportsCollection: any;
  let mockProfilesCollection: any;

  beforeEach(() => {
    mockReportsCollection = createMockCollection();
    mockProfilesCollection = createMockCollection();

    (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
      switch (collectionName) {
        case 'reports':
          return mockReportsCollection;
        case 'profiles':
          return mockProfilesCollection;
        default:
          return createMockCollection();
      }
    });
  });

  // =============================================================================
  // createReport Tests
  // =============================================================================

  describe('createReport', () => {
    it('should create report with all required fields', async () => {
      const reportInput = {
        reportedNetid: 'reported456',
        reason: 'harassment' as const,
        description: 'This is a test report with enough characters.',
      };

      // Mock spam prevention check - no recent reports
      mockReportsCollection.where.mockReturnThis();
      mockReportsCollection.get.mockResolvedValue(
        createMockQuerySnapshot([])
      );

      // Mock report creation
      const mockReportId = 'report-123';
      const mockReport = createMockReport({
        reporterNetid: 'reporter123',
        reportedNetid: 'reported456',
        reason: 'harassment',
        status: 'pending',
      });

      mockReportsCollection.add.mockResolvedValue({
        id: mockReportId,
        get: jest.fn().mockResolvedValue(
          createMockDocSnapshot(mockReportId, mockReport)
        ),
      });

      const result = await createReport('reporter123', reportInput);

      expect(result).toHaveProperty('report');
      expect(result).toHaveProperty('id', mockReportId);
      expect(result.report.reporterNetid).toBe('reporter123');
      expect(result.report.reportedNetid).toBe('reported456');
      expect(result.report.status).toBe('pending');
    });

    it('should return report data and document ID', async () => {
      const reportInput = {
        reportedNetid: 'reported456',
        reason: 'spam' as const,
        description: 'Spamming messages repeatedly to users.',
      };

      mockReportsCollection.where.mockReturnThis();
      mockReportsCollection.get.mockResolvedValue(
        createMockQuerySnapshot([])
      );

      const mockReportId = 'report-456';
      const mockReport = createMockReport();

      mockReportsCollection.add.mockResolvedValue({
        id: mockReportId,
        get: jest.fn().mockResolvedValue(
          createMockDocSnapshot(mockReportId, mockReport)
        ),
      });

      const result = await createReport('reporter123', reportInput);

      expect(result.id).toBe(mockReportId);
      expect(result.report).toBeDefined();
    });

    it('should set status to pending', async () => {
      const reportInput = {
        reportedNetid: 'reported456',
        reason: 'inappropriate_content' as const,
        description: 'Inappropriate profile content.',
      };

      mockReportsCollection.where.mockReturnThis();
      mockReportsCollection.get.mockResolvedValue(
        createMockQuerySnapshot([])
      );

      mockReportsCollection.add.mockResolvedValue({
        id: 'report-123',
        get: jest.fn().mockResolvedValue(
          createMockDocSnapshot(
            'report-123',
            createMockReport({ status: 'pending' })
          )
        ),
      });

      const result = await createReport('reporter123', reportInput);

      expect(result.report.status).toBe('pending');
    });

    it('should set timestamps (createdAt)', async () => {
      const reportInput = {
        reportedNetid: 'reported456',
        reason: 'harassment' as const,
        description: 'Test description with enough characters.',
      };

      mockReportsCollection.where.mockReturnThis();
      mockReportsCollection.get.mockResolvedValue(
        createMockQuerySnapshot([])
      );

      const mockReport = createMockReport({
        createdAt: new Date('2024-01-01'),
      });

      mockReportsCollection.add.mockResolvedValue({
        id: 'report-123',
        get: jest.fn().mockResolvedValue(
          createMockDocSnapshot('report-123', mockReport)
        ),
      });

      const result = await createReport('reporter123', reportInput);

      expect(result.report.createdAt).toBeDefined();
    });

    it('should enforce spam prevention (3 per 24 hours)', async () => {
      const reportInput = {
        reportedNetid: 'reported456',
        reason: 'harassment' as const,
        description: 'Test description.',
      };

      // Mock that user already has 3 reports in last 24 hours
      const recentReports = createMockReports(3);
      mockReportsCollection.where.mockReturnThis();
      mockReportsCollection.get.mockResolvedValue(
        createMockQuerySnapshot(
          recentReports.map((report, i) => ({
            id: `report-${i}`,
            data: report,
          }))
        )
      );

      await expect(createReport('reporter123', reportInput)).rejects.toThrow(
        /3 reports per.*hours/i
      );
    });

    it('should prevent users from reporting themselves', async () => {
      const reportInput = {
        reportedNetid: 'same123',
        reason: 'harassment' as const,
        description: 'Test description.',
      };

      await expect(createReport('same123', reportInput)).rejects.toThrow(
        /cannot report yourself/i
      );
    });

    it('should validate description length - too short', async () => {
      const reportInput = {
        reportedNetid: 'reported456',
        reason: 'harassment' as const,
        description: 'Short',
      };

      await expect(createReport('reporter123', reportInput)).rejects.toThrow(
        /at least 10 characters/i
      );
    });

    it('should validate description length - too long', async () => {
      const reportInput = {
        reportedNetid: 'reported456',
        reason: 'harassment' as const,
        description: 'a'.repeat(1001),
      };

      await expect(createReport('reporter123', reportInput)).rejects.toThrow(
        /not exceed 1000 characters/i
      );
    });
  });

  // =============================================================================
  // getReportById Tests
  // =============================================================================

  describe('getReportById', () => {
    it('should return report by ID', async () => {
      const mockReport = createMockReport({
        reporterNetid: 'reporter123',
        reportedNetid: 'reported456',
      });

      mockReportsCollection.doc.mockReturnThis();
      mockReportsCollection.get.mockResolvedValue(
        createMockDocSnapshot('report-123', mockReport)
      );

      const result = await getReportById('report-123');

      expect(result).toBeDefined();
      expect(result?.reporterNetid).toBe('reporter123');
      expect(result?.reportedNetid).toBe('reported456');
    });

    it('should return null for non-existent report', async () => {
      mockReportsCollection.doc.mockReturnThis();
      mockReportsCollection.get.mockResolvedValue(
        createMockDocSnapshot('nonexistent', null)
      );

      const result = await getReportById('nonexistent');

      expect(result).toBeNull();
    });
  });

  // =============================================================================
  // getAllReports Tests
  // =============================================================================

  describe('getAllReports', () => {
    it('should return all reports', async () => {
      const mockReports = createMockReports(5);

      mockReportsCollection.orderBy.mockReturnThis();
      mockReportsCollection.get.mockResolvedValue(
        createMockQuerySnapshot(
          mockReports.map((report, i) => ({
            id: `report-${i}`,
            data: report,
          }))
        )
      );

      const result = await getAllReports();

      expect(result).toHaveLength(5);
      expect(result[0]).toHaveProperty('id');
      expect(mockReportsCollection.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });

    it('should filter by status', async () => {
      const pendingReports = [
        createMockReport({ status: 'pending' }),
        createMockReport({ status: 'pending' }),
      ];

      mockReportsCollection.orderBy.mockReturnThis();
      mockReportsCollection.where.mockReturnThis();
      mockReportsCollection.get.mockResolvedValue(
        createMockQuerySnapshot(
          pendingReports.map((report, i) => ({
            id: `report-${i}`,
            data: report,
          }))
        )
      );

      const result = await getAllReports('pending');

      expect(result).toHaveLength(2);
      expect(result.every((r) => r.status === 'pending')).toBe(true);
      expect(mockReportsCollection.where).toHaveBeenCalledWith('status', '==', 'pending');
    });
  });

  // =============================================================================
  // updateReportStatus Tests
  // =============================================================================

  describe('updateReportStatus', () => {
    it('should update status', async () => {
      const mockReport = createMockReport({ status: 'pending' });
      const updatedReport = { ...mockReport, status: 'under_review' as ReportStatus };

      mockReportsCollection.doc.mockReturnThis();
      mockReportsCollection.get
        .mockResolvedValueOnce(createMockDocSnapshot('report-123', mockReport))
        .mockResolvedValueOnce(createMockDocSnapshot('report-123', updatedReport));
      mockReportsCollection.update.mockResolvedValue(undefined);

      const result = await updateReportStatus('report-123', 'under_review');

      expect(result.status).toBe('under_review');
      expect(mockReportsCollection.update).toHaveBeenCalled();
    });

    it('should throw error for non-existent report', async () => {
      mockReportsCollection.doc.mockReturnThis();
      mockReportsCollection.get.mockResolvedValue(
        createMockDocSnapshot('nonexistent', null)
      );

      await expect(
        updateReportStatus('nonexistent', 'under_review')
      ).rejects.toThrow(/not found/i);
    });

    it('should set reviewedBy and reviewedAt when provided', async () => {
      const mockReport = createMockReport();
      const updatedReport = {
        ...mockReport,
        status: 'resolved' as ReportStatus,
        reviewedBy: 'admin-uid',
        reviewedAt: new Date(),
      };

      mockReportsCollection.doc.mockReturnThis();
      mockReportsCollection.get
        .mockResolvedValueOnce(createMockDocSnapshot('report-123', mockReport))
        .mockResolvedValueOnce(createMockDocSnapshot('report-123', updatedReport));
      mockReportsCollection.update.mockResolvedValue(undefined);

      const result = await updateReportStatus(
        'report-123',
        'resolved',
        'admin-uid',
        'Issue resolved'
      );

      expect(result.reviewedBy).toBe('admin-uid');
      expect(result.reviewedAt).toBeDefined();
    });

    it('should set resolution when provided', async () => {
      const mockReport = createMockReport();
      const updatedReport = {
        ...mockReport,
        status: 'resolved' as ReportStatus,
        resolution: 'User has been warned',
      };

      mockReportsCollection.doc.mockReturnThis();
      mockReportsCollection.get
        .mockResolvedValueOnce(createMockDocSnapshot('report-123', mockReport))
        .mockResolvedValueOnce(createMockDocSnapshot('report-123', updatedReport));
      mockReportsCollection.update.mockResolvedValue(undefined);

      const result = await updateReportStatus(
        'report-123',
        'resolved',
        'admin-uid',
        'User has been warned'
      );

      expect(result.resolution).toBe('User has been warned');
    });
  });

  // =============================================================================
  // getReportsWithProfiles Tests
  // =============================================================================

  describe('getReportsWithProfiles', () => {
    it('should include user profiles', async () => {
      const mockReports = [
        createMockReport({
          reporterNetid: 'reporter123',
          reportedNetid: 'reported456',
        }),
      ];

      mockReportsCollection.orderBy.mockReturnThis();
      mockReportsCollection.get.mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'report-1', data: mockReports[0] },
        ])
      );

      // Mock profile lookups
      mockProfilesCollection.where.mockReturnThis();
      mockProfilesCollection.limit.mockReturnThis();
      mockProfilesCollection.get
        .mockResolvedValueOnce(
          createMockQuerySnapshot([
            {
              id: 'profile-1',
              data: createMockProfile({
                netid: 'reporter123',
                firstName: 'Alice',
                pictures: ['https://example.com/alice.jpg'],
              }),
            },
          ])
        )
        .mockResolvedValueOnce(
          createMockQuerySnapshot([
            {
              id: 'profile-2',
              data: createMockProfile({
                netid: 'reported456',
                firstName: 'Bob',
                pictures: ['https://example.com/bob.jpg'],
              }),
            },
          ])
        );

      const result = await getReportsWithProfiles();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('reporterName', 'Alice');
      expect(result[0]).toHaveProperty('reportedName', 'Bob');
      expect(result[0]).toHaveProperty('reporterPicture');
      expect(result[0]).toHaveProperty('reportedPicture');
    });
  });

  // =============================================================================
  // reportToResponse Tests
  // =============================================================================

  describe('reportToResponse', () => {
    it('should convert ReportDoc to ReportResponse', () => {
      const mockReport = createMockReport({
        reporterNetid: 'reporter123',
        reportedNetid: 'reported456',
        createdAt: new Date('2024-01-01'),
      });

      const response = reportToResponse(mockReport, 'report-123');

      expect(response).toHaveProperty('id', 'report-123');
      expect(response).toHaveProperty('reporterNetid', 'reporter123');
      expect(response).toHaveProperty('reportedNetid', 'reported456');
      expect(response).toHaveProperty('createdAt');
      expect(typeof response.createdAt).toBe('string');
    });

    it('should include optional fields when present', () => {
      const mockReport = createMockReport({
        reviewedBy: 'admin-uid',
        reviewedAt: new Date('2024-01-02'),
        resolution: 'Resolved',
      });

      const response = reportToResponse(mockReport, 'report-123');

      expect(response.reviewedBy).toBe('admin-uid');
      expect(response.reviewedAt).toBeDefined();
      expect(response.resolution).toBe('Resolved');
    });
  });

  // =============================================================================
  // reportToResponseWithProfiles Tests
  // =============================================================================

  describe('reportToResponseWithProfiles', () => {
    it('should include profile information', () => {
      const mockReport = createMockReport();

      const response = reportToResponseWithProfiles(
        mockReport,
        'report-123',
        'Alice',
        'https://example.com/alice.jpg',
        'Bob',
        'https://example.com/bob.jpg'
      );

      expect(response).toHaveProperty('reporterName', 'Alice');
      expect(response).toHaveProperty('reporterPicture', 'https://example.com/alice.jpg');
      expect(response).toHaveProperty('reportedName', 'Bob');
      expect(response).toHaveProperty('reportedPicture', 'https://example.com/bob.jpg');
    });
  });
});
