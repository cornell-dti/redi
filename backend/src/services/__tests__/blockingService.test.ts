/**
 * Blocking Service Tests
 * Tests for blocking service layer functions
 */

import { db } from '../../../firebaseAdmin';
import {
  blockUser,
  unblockUser,
  getBlockedUsers,
  isUserBlocked,
  areUsersBlocked,
  getBlockedUsersMap,
  blockedUserToResponse,
} from '../blockingService';
import {
  createMockDocSnapshot,
  createMockQuerySnapshot,
  createMockCollection,
} from '../../__tests__/helpers/mockFirestore';
import { createMockBlock } from '../../__tests__/helpers/factories';

describe('BlockingService', () => {
  let mockBlockedUsersCollection: any;

  beforeEach(() => {
    mockBlockedUsersCollection = createMockCollection();

    (db.collection as jest.Mock).mockImplementation(
      (collectionName: string) => {
        if (collectionName === 'blockedUsers') {
          return mockBlockedUsersCollection;
        }
        return createMockCollection();
      }
    );
  });

  // =============================================================================
  // blockUser Tests
  // =============================================================================

  describe('blockUser', () => {
    it('should create block record', async () => {
      const blockId = 'blocker123_blocked456';

      // Mock block doesn't exist yet
      mockBlockedUsersCollection.doc.mockReturnThis();
      mockBlockedUsersCollection.get
        .mockResolvedValueOnce(createMockDocSnapshot(blockId, null))
        .mockResolvedValueOnce(
          createMockDocSnapshot(
            blockId,
            createMockBlock({
              blockerNetid: 'blocker123',
              blockedNetid: 'blocked456',
            })
          )
        );

      mockBlockedUsersCollection.set.mockResolvedValue(undefined);

      const result = await blockUser('blocker123', 'blocked456');

      expect(result).toBeDefined();
      expect(result.blockerNetid).toBe('blocker123');
      expect(result.blockedNetid).toBe('blocked456');
      expect(result.createdAt).toBeDefined();

      expect(mockBlockedUsersCollection.set).toHaveBeenCalledWith(
        expect.objectContaining({
          blockerNetid: 'blocker123',
          blockedNetid: 'blocked456',
        })
      );
    });

    it('should be idempotent - throw error if already blocked', async () => {
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

      await expect(blockUser('blocker123', 'blocked456')).rejects.toThrow(
        /already blocked/i
      );
    });

    it('should prevent self-blocking', async () => {
      await expect(blockUser('same123', 'same123')).rejects.toThrow(
        /cannot block yourself/i
      );
    });
  });

  // =============================================================================
  // unblockUser Tests
  // =============================================================================

  describe('unblockUser', () => {
    it('should remove block record', async () => {
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

      mockBlockedUsersCollection.delete.mockResolvedValue(undefined);

      await unblockUser('blocker123', 'blocked456');

      expect(mockBlockedUsersCollection.delete).toHaveBeenCalled();
    });

    it('should handle non-existent block gracefully', async () => {
      const blockId = 'blocker123_nonexistent';

      // Mock block doesn't exist
      mockBlockedUsersCollection.doc.mockReturnThis();
      mockBlockedUsersCollection.get.mockResolvedValue(
        createMockDocSnapshot(blockId, null)
      );

      await expect(unblockUser('blocker123', 'nonexistent')).rejects.toThrow(
        /does not exist/i
      );
    });
  });

  // =============================================================================
  // getBlockedUsers Tests
  // =============================================================================

  describe('getBlockedUsers', () => {
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

      const result = await getBlockedUsers('blocker123');

      expect(result).toHaveLength(3);
      expect(result).toEqual(['blocked1', 'blocked2', 'blocked3']);
      expect(mockBlockedUsersCollection.where).toHaveBeenCalledWith(
        'blockerNetid',
        '==',
        'blocker123'
      );
    });

    it('should return empty array if no blocks', async () => {
      mockBlockedUsersCollection.where.mockReturnThis();
      mockBlockedUsersCollection.get.mockResolvedValue(
        createMockQuerySnapshot([])
      );

      const result = await getBlockedUsers('blocker123');

      expect(result).toEqual([]);
    });
  });

  // =============================================================================
  // isUserBlocked Tests
  // =============================================================================

  describe('isUserBlocked', () => {
    it('should return true if user is blocked', async () => {
      const blockId = 'blocker123_blocked456';
      const block = createMockBlock({
        blockerNetid: 'blocker123',
        blockedNetid: 'blocked456',
      });

      mockBlockedUsersCollection.doc.mockReturnThis();
      mockBlockedUsersCollection.get.mockResolvedValue(
        createMockDocSnapshot(blockId, block)
      );

      const result = await isUserBlocked('blocker123', 'blocked456');

      expect(result).toBe(true);
    });

    it('should return false if user is not blocked', async () => {
      const blockId = 'blocker123_notblocked';

      mockBlockedUsersCollection.doc.mockReturnThis();
      mockBlockedUsersCollection.get.mockResolvedValue(
        createMockDocSnapshot(blockId, null)
      );

      const result = await isUserBlocked('blocker123', 'notblocked');

      expect(result).toBe(false);
    });
  });

  // =============================================================================
  // areUsersBlocked Tests
  // =============================================================================

  describe('areUsersBlocked', () => {
    it('should check if user A blocked user B', async () => {
      const blockId1 = 'user1_user2';
      const blockId2 = 'user2_user1';

      // User1 has blocked User2
      mockBlockedUsersCollection.doc.mockReturnThis();
      mockBlockedUsersCollection.get
        .mockResolvedValueOnce(
          createMockDocSnapshot(
            blockId1,
            createMockBlock({ blockerNetid: 'user1', blockedNetid: 'user2' })
          )
        )
        .mockResolvedValueOnce(createMockDocSnapshot(blockId2, null));

      const result = await areUsersBlocked('user1', 'user2');

      expect(result).toBe(true);
    });

    it('should check if user B blocked user A', async () => {
      const blockId1 = 'user1_user2';
      const blockId2 = 'user2_user1';

      // User2 has blocked User1
      mockBlockedUsersCollection.doc.mockReturnThis();
      mockBlockedUsersCollection.get
        .mockResolvedValueOnce(createMockDocSnapshot(blockId1, null))
        .mockResolvedValueOnce(
          createMockDocSnapshot(
            blockId2,
            createMockBlock({ blockerNetid: 'user2', blockedNetid: 'user1' })
          )
        );

      const result = await areUsersBlocked('user1', 'user2');

      expect(result).toBe(true);
    });

    it('should handle mutual blocks', async () => {
      const blockId1 = 'user1_user2';
      const blockId2 = 'user2_user1';

      // Both users have blocked each other
      mockBlockedUsersCollection.doc.mockReturnThis();
      mockBlockedUsersCollection.get
        .mockResolvedValueOnce(
          createMockDocSnapshot(
            blockId1,
            createMockBlock({ blockerNetid: 'user1', blockedNetid: 'user2' })
          )
        )
        .mockResolvedValueOnce(
          createMockDocSnapshot(
            blockId2,
            createMockBlock({ blockerNetid: 'user2', blockedNetid: 'user1' })
          )
        );

      const result = await areUsersBlocked('user1', 'user2');

      expect(result).toBe(true);
    });

    it('should return false if neither user has blocked the other', async () => {
      mockBlockedUsersCollection.doc.mockReturnThis();
      mockBlockedUsersCollection.get
        .mockResolvedValueOnce(createMockDocSnapshot('user1_user2', null))
        .mockResolvedValueOnce(createMockDocSnapshot('user2_user1', null));

      const result = await areUsersBlocked('user1', 'user2');

      expect(result).toBe(false);
    });
  });

  // =============================================================================
  // getBlockedUsersMap Tests
  // =============================================================================

  describe('getBlockedUsersMap', () => {
    it('should return blocked users map for matching algorithm', async () => {
      const netids = ['user1', 'user2', 'user3'];

      // user1 blocked user2
      // user3 blocked user1
      const blocks = [
        createMockBlock({ blockerNetid: 'user1', blockedNetid: 'user2' }),
        createMockBlock({ blockerNetid: 'user3', blockedNetid: 'user1' }),
      ];

      mockBlockedUsersCollection.where.mockReturnThis();
      mockBlockedUsersCollection.get
        .mockResolvedValueOnce(
          createMockQuerySnapshot([{ id: 'block-1', data: blocks[0] }])
        )
        .mockResolvedValueOnce(
          createMockQuerySnapshot([{ id: 'block-2', data: blocks[1] }])
        );

      const result = await getBlockedUsersMap(netids);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(3);

      // user1 should have user2 in their blocked set
      expect(result.get('user1')?.has('user2')).toBe(true);

      // user1 should also have user3 in their blocked set (bidirectional - user3 blocked user1)
      expect(result.get('user1')?.has('user3')).toBe(true);

      // user3 should have user1 in their blocked set
      expect(result.get('user3')?.has('user1')).toBe(false); // user3 is the blocker, not blocked by user1

      // user2 should be in user1's blocked set
      expect(result.get('user2')?.has('user1')).toBe(false); // user2 is not blocking anyone in this test
    });

    it('should handle empty netids array', async () => {
      // Don't need to mock anything for empty array
      // The function should return early
      mockBlockedUsersCollection.where.mockReturnThis();
      mockBlockedUsersCollection.get.mockResolvedValue(
        createMockQuerySnapshot([])
      );

      const result = await getBlockedUsersMap([]);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it('should initialize empty sets for users with no blocks', async () => {
      const netids = ['user1', 'user2'];

      mockBlockedUsersCollection.where.mockReturnThis();
      mockBlockedUsersCollection.get
        .mockResolvedValueOnce(createMockQuerySnapshot([]))
        .mockResolvedValueOnce(createMockQuerySnapshot([]));

      const result = await getBlockedUsersMap(netids);

      expect(result.size).toBe(2);
      expect(result.get('user1')).toBeInstanceOf(Set);
      expect(result.get('user1')?.size).toBe(0);
      expect(result.get('user2')).toBeInstanceOf(Set);
      expect(result.get('user2')?.size).toBe(0);
    });

    it('should handle batching for more than 10 netids', async () => {
      const netids = Array.from({ length: 15 }, (_, i) => `user${i}`);

      mockBlockedUsersCollection.where.mockReturnThis();
      mockBlockedUsersCollection.get.mockResolvedValue(
        createMockQuerySnapshot([])
      );

      const result = await getBlockedUsersMap(netids);

      expect(result.size).toBe(15);
      // Verify multiple batches were called
      expect(mockBlockedUsersCollection.where).toHaveBeenCalledTimes(4); // 2 calls per batch, 2 batches
    });
  });

  // =============================================================================
  // blockedUserToResponse Tests
  // =============================================================================

  describe('blockedUserToResponse', () => {
    it('should convert BlockedUserDoc to BlockedUserResponse', () => {
      const blockDoc = createMockBlock({
        blockerNetid: 'blocker123',
        blockedNetid: 'blocked456',
        createdAt: new Date('2024-01-01'),
      });

      const response = blockedUserToResponse(blockDoc);

      expect(response).toHaveProperty('blockerNetid', 'blocker123');
      expect(response).toHaveProperty('blockedNetid', 'blocked456');
      expect(response).toHaveProperty('createdAt');
      expect(typeof response.createdAt).toBe('string');
    });

    it('should handle Firestore Timestamp', () => {
      const mockTimestamp = {
        toDate: jest.fn().mockReturnValue(new Date('2024-01-01')),
      };

      const blockDoc = createMockBlock({
        blockerNetid: 'blocker123',
        blockedNetid: 'blocked456',
        createdAt: mockTimestamp as any,
      });

      const response = blockedUserToResponse(blockDoc);

      expect(response.createdAt).toBeDefined();
      expect(typeof response.createdAt).toBe('string');
    });
  });
});
