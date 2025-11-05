/**
 * Blocking API Tests
 * Tests for blocking endpoints in profiles route:
 * - POST /api/profiles/:netid/block
 * - DELETE /api/profiles/:netid/block
 * - GET /api/profiles/:netid/blocked
 */

import express from 'express';
import request from 'supertest';
import { db } from '../../../firebaseAdmin';
import profilesRouter from '../profiles';
import {
  mockFirebaseAuth,
  mockFirebaseAdminAuth,
  createTestApp,
  authenticatedPost,
  authenticatedDelete,
  authenticatedGet,
  unauthenticatedPost,
} from '../../__tests__/helpers/testHelpers';
import {
  createMockDocSnapshot,
  createMockQuerySnapshot,
  createMockCollection,
} from '../../__tests__/helpers/mockFirestore';
import {
  createMockUser,
  createMockProfile,
  createMockBlock,
} from '../../__tests__/helpers/factories';

// Create test app
const app = createTestApp(profilesRouter);

describe('Blocking API', () => {
  let mockUsersCollection: any;
  let mockProfilesCollection: any;
  let mockBlockedUsersCollection: any;
  let mockAuditLogsCollection: any;

  beforeEach(() => {
    // Create fresh mock collections for each test
    mockUsersCollection = createMockCollection();
    mockProfilesCollection = createMockCollection();
    mockBlockedUsersCollection = createMockCollection();
    mockAuditLogsCollection = createMockCollection();

    // Setup db.collection mock
    (db.collection as jest.Mock).mockImplementation(
      (collectionName: string) => {
        switch (collectionName) {
          case 'users':
            return mockUsersCollection;
          case 'profiles':
            return mockProfilesCollection;
          case 'blockedUsers':
            return mockBlockedUsersCollection;
          case 'auditLogs':
            return mockAuditLogsCollection;
          default:
            return createMockCollection();
        }
      }
    );
  });

  // =============================================================================
  // POST /api/profiles/:netid/block - Block a user
  // =============================================================================

  describe('POST /api/profiles/:netid/block', () => {
    describe('Authentication', () => {
      it('should require authentication', async () => {
        const response = await unauthenticatedPost(
          app,
          '/api/profiles/blocked456/block',
          {}
        );

        expect(response.status).toBe(401);
        expect(response.body.error).toMatch(/authentication token/i);
      });
    });

    describe('Validation', () => {
      beforeEach(() => {
        mockFirebaseAuth({ uid: 'blocker-uid' });

        // Mock blocker user lookup
        mockUsersCollection.where.mockReturnThis();
        mockUsersCollection.get.mockResolvedValue(
          createMockQuerySnapshot([
            {
              id: 'blocker-doc-id',
              data: createMockUser({
                netid: 'blocker123',
                firebaseUid: 'blocker-uid',
              }),
            },
          ])
        );
      });

      it('should validate blockedNetid is provided', async () => {
        const response = await authenticatedPost(
          app,
          '/api/profiles//block',
          {}
        );

        expect(response.status).toBe(404); // Express returns 404 for invalid route
      });

      it('should prevent users from blocking themselves', async () => {
        // Mock user lookup - same user
        mockUsersCollection.where.mockReturnThis();
        mockUsersCollection.get.mockResolvedValue(
          createMockQuerySnapshot([
            {
              id: 'user-doc-id',
              data: createMockUser({
                netid: 'blocker123',
                firebaseUid: 'blocker-uid',
              }),
            },
          ])
        );

        // Mock profile lookup
        mockProfilesCollection.where.mockReturnThis();
        mockProfilesCollection.get.mockResolvedValue(
          createMockQuerySnapshot([
            {
              id: 'profile-doc-id',
              data: createMockProfile({ netid: 'blocker123' }),
            },
          ])
        );

        const response = await authenticatedPost(
          app,
          '/api/profiles/blocker123/block',
          {}
        );

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/cannot block yourself/i);
      });

      it('should handle blocked user not found', async () => {
        // Mock blocked user doesn't exist
        mockProfilesCollection.where.mockReturnThis();
        mockProfilesCollection.get.mockResolvedValue(
          createMockQuerySnapshot([])
        );

        const response = await authenticatedPost(
          app,
          '/api/profiles/nonexistent/block',
          {}
        );

        expect(response.status).toBe(404);
        expect(response.body.error).toMatch(/user.*not found/i);
      });
    });

    describe('Success Cases', () => {
      beforeEach(() => {
        mockFirebaseAuth({ uid: 'blocker-uid' });

        // Mock blocker user lookup
        mockUsersCollection.where.mockReturnThis();
        mockUsersCollection.get.mockResolvedValue(
          createMockQuerySnapshot([
            {
              id: 'blocker-doc-id',
              data: createMockUser({
                netid: 'blocker123',
                firebaseUid: 'blocker-uid',
              }),
            },
          ])
        );

        // Mock blocked user exists
        mockProfilesCollection.where.mockReturnThis();
        mockProfilesCollection.get.mockResolvedValue(
          createMockQuerySnapshot([
            {
              id: 'blocked-doc-id',
              data: createMockProfile({ netid: 'blocked456' }),
            },
          ])
        );
      });

      it('should create a block record', async () => {
        const blockId = 'blocker123_blocked456';

        // Mock block doesn't exist yet
        mockBlockedUsersCollection.doc.mockReturnThis();
        mockBlockedUsersCollection.get.mockResolvedValueOnce(
          createMockDocSnapshot(blockId, null)
        );

        // Mock block creation
        mockBlockedUsersCollection.set.mockResolvedValue(undefined);
        mockBlockedUsersCollection.get.mockResolvedValueOnce(
          createMockDocSnapshot(
            blockId,
            createMockBlock({
              blockerNetid: 'blocker123',
              blockedNetid: 'blocked456',
            })
          )
        );

        const response = await authenticatedPost(
          app,
          '/api/profiles/blocked456/block',
          {}
        );

        expect(response.status).toBe(201);
        expect(response.body.message).toMatch(/blocked successfully/i);
        expect(response.body.blockerNetid).toBe('blocker123');
        expect(response.body.blockedNetid).toBe('blocked456');

        expect(mockBlockedUsersCollection.set).toHaveBeenCalledWith(
          expect.objectContaining({
            blockerNetid: 'blocker123',
            blockedNetid: 'blocked456',
          })
        );
      });

      it('should handle already blocked scenario', async () => {
        const blockId = 'blocker123_blocked456';
        const existingBlock = createMockBlock({
          blockerNetid: 'blocker123',
          blockedNetid: 'blocked456',
        });

        // Mock block already exists
        mockBlockedUsersCollection.doc.mockReturnThis();
        mockBlockedUsersCollection.get.mockResolvedValue(
          createMockDocSnapshot(blockId, existingBlock)
        );

        const response = await authenticatedPost(
          app,
          '/api/profiles/blocked456/block',
          {}
        );

        // Should return error when trying to block again (409 Conflict or 400 Bad Request)
        expect([400, 409]).toContain(response.status);
        expect(response.body.error).toMatch(/already blocked/i);
      });
    });
  });

  // =============================================================================
  // DELETE /api/profiles/:netid/block - Unblock a user
  // =============================================================================

  describe('DELETE /api/profiles/:netid/block', () => {
    describe('Authentication', () => {
      it('should require authentication', async () => {
        const response = await request(app).delete(
          '/api/profiles/blocked456/block'
        );

        expect(response.status).toBe(401);
      });
    });

    describe('Success Cases', () => {
      beforeEach(() => {
        mockFirebaseAuth({ uid: 'blocker-uid' });

        // Mock blocker user lookup
        mockUsersCollection.where.mockReturnThis();
        mockUsersCollection.get.mockResolvedValue(
          createMockQuerySnapshot([
            {
              id: 'blocker-doc-id',
              data: createMockUser({
                netid: 'blocker123',
                firebaseUid: 'blocker-uid',
              }),
            },
          ])
        );
      });

      it('should unblock user', async () => {
        const blockId = 'blocker123_blocked456';
        const existingBlock = createMockBlock({
          blockerNetid: 'blocker123',
          blockedNetid: 'blocked456',
        });

        // Mock block exists
        mockBlockedUsersCollection.doc.mockReturnThis();
        mockBlockedUsersCollection.get.mockResolvedValue(
          createMockDocSnapshot(blockId, existingBlock)
        );

        // Mock delete
        mockBlockedUsersCollection.delete.mockResolvedValue(undefined);

        const response = await authenticatedDelete(
          app,
          '/api/profiles/blocked456/block'
        );

        expect(response.status).toBe(200);
        expect(response.body.message).toMatch(/unblocked successfully/i);
        expect(mockBlockedUsersCollection.delete).toHaveBeenCalled();
      });

      it('should return 404 if block does not exist', async () => {
        const blockId = 'blocker123_nonexistent';

        // Mock block doesn't exist
        mockBlockedUsersCollection.doc.mockReturnThis();
        mockBlockedUsersCollection.get.mockResolvedValue(
          createMockDocSnapshot(blockId, null)
        );

        const response = await authenticatedDelete(
          app,
          '/api/profiles/nonexistent/block'
        );

        expect(response.status).toBe(404);
        expect(response.body.error).toMatch(/does not exist/i);
      });
    });
  });

  // =============================================================================
  // GET /api/profiles/:netid/blocked - Get list of blocked users
  // =============================================================================

  describe('GET /api/profiles/:netid/blocked', () => {
    describe('Authentication & Authorization', () => {
      it('should require authentication', async () => {
        const response = await request(app).get(
          '/api/profiles/blocker123/blocked'
        );

        expect(response.status).toBe(401);
      });

      it('should only allow users to view their own blocked list', async () => {
        mockFirebaseAuth({ uid: 'user-uid' });

        // Mock authenticated user
        mockUsersCollection.where.mockReturnThis();
        mockUsersCollection.get.mockResolvedValue(
          createMockQuerySnapshot([
            {
              id: 'user-doc-id',
              data: createMockUser({
                netid: 'user123',
                firebaseUid: 'user-uid',
              }),
            },
          ])
        );

        // Try to access another user's blocked list
        const response = await authenticatedGet(
          app,
          '/api/profiles/otheruser/blocked'
        );

        expect(response.status).toBe(403);
        expect(response.body.error).toMatch(/your own/i);
      });

      it('should allow admins to view any blocked list', async () => {
        mockFirebaseAdminAuth({ uid: 'admin-uid' });

        // Mock admin user
        mockUsersCollection.where.mockReturnThis();
        mockUsersCollection.get.mockResolvedValue(
          createMockQuerySnapshot([
            {
              id: 'admin-doc-id',
              data: createMockUser({
                netid: 'admin123',
                firebaseUid: 'admin-uid',
              }),
            },
          ])
        );

        // Mock admin check - user is admin
        const mockAdminsCollection = createMockCollection();
        mockAdminsCollection.doc.mockReturnThis();
        mockAdminsCollection.get.mockResolvedValue(
          createMockDocSnapshot('admin-uid', {
            uid: 'admin-uid',
            disabled: false,
          })
        );

        (db.collection as jest.Mock).mockImplementation((name: string) => {
          if (name === 'admins') return mockAdminsCollection;
          if (name === 'users') return mockUsersCollection;
          if (name === 'blockedUsers') return mockBlockedUsersCollection;
          return createMockCollection();
        });

        // Mock blocked users query
        mockBlockedUsersCollection.where.mockReturnThis();
        mockBlockedUsersCollection.get.mockResolvedValue(
          createMockQuerySnapshot([])
        );

        const response = await authenticatedGet(
          app,
          '/api/profiles/anyuser/blocked',
          'admin'
        );

        expect(response.status).toBe(200);
      });
    });

    describe('Success Cases', () => {
      beforeEach(() => {
        mockFirebaseAuth({ uid: 'blocker-uid' });

        // Mock user lookup
        mockUsersCollection.where.mockReturnThis();
        mockUsersCollection.get.mockResolvedValue(
          createMockQuerySnapshot([
            {
              id: 'blocker-doc-id',
              data: createMockUser({
                netid: 'blocker123',
                firebaseUid: 'blocker-uid',
              }),
            },
          ])
        );
      });

      it('should return list of blocked users', async () => {
        const blockedUsers = [
          createMockBlock({
            blockerNetid: 'blocker123',
            blockedNetid: 'blocked1',
          }),
          createMockBlock({
            blockerNetid: 'blocker123',
            blockedNetid: 'blocked2',
          }),
          createMockBlock({
            blockerNetid: 'blocker123',
            blockedNetid: 'blocked3',
          }),
        ];

        mockBlockedUsersCollection.where.mockReturnThis();
        mockBlockedUsersCollection.get.mockResolvedValue(
          createMockQuerySnapshot(
            blockedUsers.map((block, i) => ({
              id: `block-${i}`,
              data: block,
            }))
          )
        );

        const response = await authenticatedGet(
          app,
          '/api/profiles/blocker123/blocked'
        );

        expect(response.status).toBe(200);
        expect(response.body.blockerNetid).toBe('blocker123');
        expect(response.body.blockedUsers).toEqual([
          'blocked1',
          'blocked2',
          'blocked3',
        ]);
        expect(response.body.count).toBe(3);
      });

      it('should return empty array if no blocks', async () => {
        mockBlockedUsersCollection.where.mockReturnThis();
        mockBlockedUsersCollection.get.mockResolvedValue(
          createMockQuerySnapshot([])
        );

        const response = await authenticatedGet(
          app,
          '/api/profiles/blocker123/blocked'
        );

        expect(response.status).toBe(200);
        expect(response.body.blockedUsers).toEqual([]);
        expect(response.body.count).toBe(0);
      });
    });
  });
});
