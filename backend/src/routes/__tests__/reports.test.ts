/**
 * Reports API Tests
 * Tests for POST /api/reports endpoint
 */

import express from 'express';
import request from 'supertest';
import { db } from '../../../firebaseAdmin';
import reportsRouter from '../reports';
import {
  mockFirebaseAuth,
  createTestApp,
  authenticatedPost,
  unauthenticatedPost,
} from '../../__tests__/helpers/testHelpers';
import {
  createMockDocSnapshot,
  createMockQuerySnapshot,
  createMockCollection,
} from '../../__tests__/helpers/mockFirestore';
import { createMockUser, createMockProfile, createMockReport } from '../../__tests__/helpers/factories';

// Create test app
const app = createTestApp(reportsRouter);

describe('POST /api/reports', () => {
  let mockUsersCollection: any;
  let mockProfilesCollection: any;
  let mockReportsCollection: any;

  beforeEach(() => {
    // Create fresh mock collections for each test
    mockUsersCollection = createMockCollection();
    mockProfilesCollection = createMockCollection();
    mockReportsCollection = createMockCollection();

    // Setup db.collection mock
    (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
      switch (collectionName) {
        case 'users':
          return mockUsersCollection;
        case 'profiles':
          return mockProfilesCollection;
        case 'reports':
          return mockReportsCollection;
        default:
          return createMockCollection();
      }
    });
  });

  // =============================================================================
  // AUTHENTICATION TESTS
  // =============================================================================

  describe('Authentication', () => {
    it('should require authentication', async () => {
      const response = await unauthenticatedPost(app, '/api/reports', {
        reportedNetid: 'test123',
        reason: 'harassment',
        description: 'Test description with enough characters',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/authentication token/i);
    });

    it('should reject invalid token format', async () => {
      const response = await request(app)
        .post('/api/reports')
        .set('authorization', 'InvalidFormat token123')
        .send({
          reportedNetid: 'test123',
          reason: 'harassment',
          description: 'Test description with enough characters',
        });

      expect(response.status).toBe(401);
    });
  });

  // =============================================================================
  // VALIDATION TESTS
  // =============================================================================

  describe('Validation', () => {
    beforeEach(() => {
      // Mock successful authentication
      mockFirebaseAuth({ uid: 'reporter-uid' });

      // Mock user lookup - reporter exists
      mockUsersCollection.where.mockReturnThis();
      mockUsersCollection.get.mockResolvedValue(
        createMockQuerySnapshot([
          {
            id: 'reporter-doc-id',
            data: createMockUser({ netid: 'reporter123', firebaseUid: 'reporter-uid' }),
          },
        ])
      );
    });

    it('should validate reportedNetid is provided', async () => {
      const response = await authenticatedPost(app, '/api/reports', {
        reason: 'harassment',
        description: 'Test description with enough characters',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
      // Error message may vary - just check that there's an error
    });

    it('should validate reason is valid', async () => {
      // Mock reported user exists
      mockUsersCollection.where.mockReturnThis();
      mockUsersCollection.limit.mockReturnThis();
      mockUsersCollection.get.mockResolvedValueOnce(
        createMockQuerySnapshot([
          {
            id: 'reported-doc-id',
            data: createMockUser({ netid: 'reported456' }),
          },
        ])
      );

      const response = await authenticatedPost(app, '/api/reports', {
        reportedNetid: 'reported456',
        reason: 'invalid_reason',
        description: 'Test description with enough characters',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/valid reason/i);
    });

    it('should validate description length - too short', async () => {
      // Mock reported user exists
      mockUsersCollection.where.mockReturnThis();
      mockUsersCollection.limit.mockReturnThis();
      mockUsersCollection.get.mockResolvedValueOnce(
        createMockQuerySnapshot([
          {
            id: 'reported-doc-id',
            data: createMockUser({ netid: 'reported456' }),
          },
        ])
      );

      const response = await authenticatedPost(app, '/api/reports', {
        reportedNetid: 'reported456',
        reason: 'harassment',
        description: 'Short',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/10.*1000.*characters/i);
    });

    it('should validate description length - too long', async () => {
      // Mock reported user exists
      mockUsersCollection.where.mockReturnThis();
      mockUsersCollection.limit.mockReturnThis();
      mockUsersCollection.get.mockResolvedValueOnce(
        createMockQuerySnapshot([
          {
            id: 'reported-doc-id',
            data: createMockUser({ netid: 'reported456' }),
          },
        ])
      );

      const longDescription = 'a'.repeat(1001);

      const response = await authenticatedPost(app, '/api/reports', {
        reportedNetid: 'reported456',
        reason: 'harassment',
        description: longDescription,
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/10.*1000.*characters/i);
    });

    it('should prevent users from reporting themselves', async () => {
      // Mock user lookup - both queries return same user
      mockUsersCollection.where.mockReturnThis();
      mockUsersCollection.limit.mockReturnThis();
      mockUsersCollection.get
        .mockResolvedValueOnce(
          createMockQuerySnapshot([
            {
              id: 'user-doc-id',
              data: createMockUser({ netid: 'same123', firebaseUid: 'reporter-uid' }),
            },
          ])
        )
        .mockResolvedValueOnce(
          createMockQuerySnapshot([
            {
              id: 'user-doc-id',
              data: createMockUser({ netid: 'same123' }),
            },
          ])
        );

      const response = await authenticatedPost(app, '/api/reports', {
        reportedNetid: 'same123',
        reason: 'harassment',
        description: 'Test description with enough characters',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/cannot report yourself/i);
    });
  });

  // =============================================================================
  // SUCCESS CASES
  // =============================================================================

  describe('Success Cases', () => {
    beforeEach(() => {
      // Mock successful authentication
      mockFirebaseAuth({ uid: 'reporter-uid' });
    });

    it('should create a report with valid data', async () => {
      // Mock reporter lookup
      mockUsersCollection.where.mockReturnThis();
      mockUsersCollection.get.mockResolvedValueOnce(
        createMockQuerySnapshot([
          {
            id: 'reporter-doc-id',
            data: createMockUser({ netid: 'reporter123', firebaseUid: 'reporter-uid' }),
          },
        ])
      );

      // Mock reported user lookup
      mockUsersCollection.where.mockReturnThis();
      mockUsersCollection.limit.mockReturnThis();
      mockUsersCollection.get.mockResolvedValueOnce(
        createMockQuerySnapshot([
          {
            id: 'reported-doc-id',
            data: createMockUser({ netid: 'reported456' }),
          },
        ])
      );

      // Mock spam prevention check - no recent reports
      mockReportsCollection.where.mockReturnThis();
      mockReportsCollection.get.mockResolvedValue(
        createMockQuerySnapshot([])
      );

      // Mock report creation
      const mockReportId = 'report-123';
      const mockReportRef = {
        id: mockReportId,
        get: jest.fn().mockResolvedValue(
          createMockDocSnapshot(
            mockReportId,
            createMockReport({
              reporterNetid: 'reporter123',
              reportedNetid: 'reported456',
              reason: 'harassment',
              description: 'This is a detailed description of harassment behavior.',
              status: 'pending',
            })
          )
        ),
      };
      mockReportsCollection.add.mockResolvedValue(mockReportRef);

      const response = await authenticatedPost(app, '/api/reports', {
        reportedNetid: 'reported456',
        reason: 'harassment',
        description: 'This is a detailed description of harassment behavior.',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', mockReportId);
      expect(response.body).toHaveProperty('reporterNetid', 'reporter123');
      expect(response.body).toHaveProperty('reportedNetid', 'reported456');
      expect(response.body).toHaveProperty('reason', 'harassment');
      expect(response.body).toHaveProperty('status', 'pending');
      expect(response.body).toHaveProperty('createdAt');

      // Verify report was created with correct data
      expect(mockReportsCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          reporterNetid: 'reporter123',
          reportedNetid: 'reported456',
          reason: 'harassment',
          status: 'pending',
        })
      );
    });

    it('should create report with all required fields', async () => {
      // Setup mocks
      mockUsersCollection.where.mockReturnThis();
      mockUsersCollection.limit.mockReturnThis();
      mockUsersCollection.get
        .mockResolvedValueOnce(
          createMockQuerySnapshot([
            {
              id: 'reporter-doc-id',
              data: createMockUser({ netid: 'reporter123', firebaseUid: 'reporter-uid' }),
            },
          ])
        )
        .mockResolvedValueOnce(
          createMockQuerySnapshot([
            {
              id: 'reported-doc-id',
              data: createMockUser({ netid: 'reported456' }),
            },
          ])
        );

      mockReportsCollection.where.mockReturnThis();
      mockReportsCollection.get.mockResolvedValue(createMockQuerySnapshot([]));

      const mockReportId = 'report-456';
      const mockReport = createMockReport({
        reporterNetid: 'reporter123',
        reportedNetid: 'reported456',
        reason: 'spam',
        description: 'User is sending spam messages repeatedly.',
        status: 'pending',
      });

      mockReportsCollection.add.mockResolvedValue({
        id: mockReportId,
        get: jest.fn().mockResolvedValue(
          createMockDocSnapshot(mockReportId, mockReport)
        ),
      });

      const response = await authenticatedPost(app, '/api/reports', {
        reportedNetid: 'reported456',
        reason: 'spam',
        description: 'User is sending spam messages repeatedly.',
      });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: mockReportId,
        reporterNetid: 'reporter123',
        reportedNetid: 'reported456',
        reason: 'spam',
        status: 'pending',
      });
      expect(response.body.createdAt).toBeDefined();
    });
  });

  // =============================================================================
  // SPAM PREVENTION TESTS
  // =============================================================================

  describe('Spam Prevention', () => {
    beforeEach(() => {
      mockFirebaseAuth({ uid: 'reporter-uid' });

      // Mock reporter and reported user lookups
      mockUsersCollection.where.mockReturnThis();
      mockUsersCollection.limit.mockReturnThis();
      mockUsersCollection.get
        .mockResolvedValueOnce(
          createMockQuerySnapshot([
            {
              id: 'reporter-doc-id',
              data: createMockUser({ netid: 'reporter123', firebaseUid: 'reporter-uid' }),
            },
          ])
        )
        .mockResolvedValueOnce(
          createMockQuerySnapshot([
            {
              id: 'reported-doc-id',
              data: createMockUser({ netid: 'reported456' }),
            },
          ])
        );
    });

    it('should allow 3 reports within 24 hours', async () => {
      // Mock that user has 2 recent reports (should allow 3rd)
      const recentReports = [
        { id: 'report-1', data: createMockReport() },
        { id: 'report-2', data: createMockReport() },
      ];

      mockReportsCollection.where.mockReturnThis();
      mockReportsCollection.get.mockResolvedValue(
        createMockQuerySnapshot(recentReports)
      );

      // Mock successful report creation
      const mockReportId = 'report-3';
      mockReportsCollection.add.mockResolvedValue({
        id: mockReportId,
        get: jest.fn().mockResolvedValue(
          createMockDocSnapshot(mockReportId, createMockReport())
        ),
      });

      const response = await authenticatedPost(app, '/api/reports', {
        reportedNetid: 'reported456',
        reason: 'harassment',
        description: 'This is a test report description.',
      });

      expect(response.status).toBe(201);
    });

    it('should block 4th report within 24 hours', async () => {
      // Mock that user already has 3 reports in last 24 hours
      const recentReports = [
        { id: 'report-1', data: createMockReport() },
        { id: 'report-2', data: createMockReport() },
        { id: 'report-3', data: createMockReport() },
      ];

      mockReportsCollection.where.mockReturnThis();
      mockReportsCollection.get.mockResolvedValue(
        createMockQuerySnapshot(recentReports)
      );

      const response = await authenticatedPost(app, '/api/reports', {
        reportedNetid: 'reported456',
        reason: 'harassment',
        description: 'This is a test report description.',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/3 reports per.*hours/i);
    });
  });

  // =============================================================================
  // ERROR HANDLING
  // =============================================================================

  describe('Error Handling', () => {
    beforeEach(() => {
      mockFirebaseAuth({ uid: 'reporter-uid' });

      // Mock reporter lookup
      mockUsersCollection.where.mockReturnThis();
      mockUsersCollection.get.mockResolvedValueOnce(
        createMockQuerySnapshot([
          {
            id: 'reporter-doc-id',
            data: createMockUser({ netid: 'reporter123', firebaseUid: 'reporter-uid' }),
          },
        ])
      );
    });

    it('should handle reported user not found', async () => {
      // Mock that reported user doesn't exist
      mockUsersCollection.where.mockReturnThis();
      mockUsersCollection.limit.mockReturnThis();
      mockUsersCollection.get.mockResolvedValueOnce(
        createMockQuerySnapshot([]) // Empty result
      );

      const response = await authenticatedPost(app, '/api/reports', {
        reportedNetid: 'nonexistent123',
        reason: 'harassment',
        description: 'This is a test report description.',
      });

      expect(response.status).toBe(404);
      expect(response.body.error).toMatch(/reported user not found/i);
    });

    it('should handle Firestore errors gracefully', async () => {
      // Mock reported user lookup
      mockUsersCollection.where.mockReturnThis();
      mockUsersCollection.limit.mockReturnThis();
      mockUsersCollection.get.mockResolvedValueOnce(
        createMockQuerySnapshot([
          {
            id: 'reported-doc-id',
            data: createMockUser({ netid: 'reported456' }),
          },
        ])
      );

      // Mock Firestore failure during spam check
      mockReportsCollection.where.mockReturnThis();
      mockReportsCollection.get.mockRejectedValue(new Error('Firestore error'));

      const response = await authenticatedPost(app, '/api/reports', {
        reportedNetid: 'reported456',
        reason: 'harassment',
        description: 'This is a test report description.',
      });

      expect(response.status).toBe(500);
      expect(response.body.error).toMatch(/failed to create report/i);
    });

    it('should handle reporter user not found', async () => {
      // Mock that reporter doesn't exist in database
      mockUsersCollection.where.mockReturnThis();
      mockUsersCollection.get.mockResolvedValueOnce(
        createMockQuerySnapshot([]) // Empty result
      );

      const response = await authenticatedPost(app, '/api/reports', {
        reportedNetid: 'reported456',
        reason: 'harassment',
        description: 'This is a test report description.',
      });

      expect(response.status).toBe(404);
      expect(response.body.error).toMatch(/user not found/i);
    });
  });
});
