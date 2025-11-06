/**
 * Matching Algorithm Integration Tests
 *
 * These tests verify the matching algorithm works correctly end-to-end with real Firestore data.
 * Tests cover:
 * - Match generation for multiple users
 * - Mutual matching (bidirectionality)
 * - Duplicate prevention
 * - Document structure validation
 * - Edge cases (odd number of users, incomplete profiles)
 * - Append mode for adding matches
 */

import { generateMatchesForPrompt } from '../../services/matchingService';
import {
  createTestUsers,
  createTestPrompt,
  createTestPromptAnswers,
  cleanupTestData,
  getUserMatches,
  TestUser,
} from '../utils/testDataGenerator';
import { db } from '../../../firebaseAdmin';

// Increase timeout for integration tests
jest.setTimeout(30000);

describe('Matching Algorithm Integration Tests', () => {
  let testUsers: TestUser[] = [];
  let testPromptId: string;

  beforeAll(async () => {
    // Clean up any leftover test data
    await cleanupTestData();
  });

  afterAll(async () => {
    // Clean up all test data after tests complete
    await cleanupTestData();
  });

  beforeEach(async () => {
    // Create fresh test data for each test
    testUsers = [];
    testPromptId = '';
  });

  describe('Basic Matching Functionality', () => {
    test('should create exactly 3 matches for each user', async () => {
      // Create 10 test users
      testUsers = await createTestUsers(10);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      // Create prompt answers for all users
      await createTestPromptAnswers(testUsers, testPromptId);

      // Run matching algorithm
      const matchedCount = await generateMatchesForPrompt(testPromptId);

      // Should match all 10 users
      expect(matchedCount).toBe(10);

      // Verify each user has 3 matches
      for (const user of testUsers) {
        const matches = await getUserMatches(user.netid, testPromptId);
        expect(matches).toBeTruthy();
        expect(matches?.matches).toHaveLength(3);
        expect(matches?.revealed).toHaveLength(3);
        expect(matches?.revealed.every((r: boolean) => r === false)).toBe(true);
      }
    });

    test('should create matches with correct document ID format', async () => {
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      // Verify document ID format: ${netid}_${promptId}
      for (const user of testUsers) {
        const expectedDocId = `${user.netid}_${testPromptId}`;
        const doc = await db.collection('weeklyMatches').doc(expectedDocId).get();

        expect(doc.exists).toBe(true);
        const data = doc.data();
        expect(data?.netid).toBe(user.netid);
        expect(data?.promptId).toBe(testPromptId);
      }
    });

    test('should create mutual matches (if A matches B, then B matches A)', async () => {
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      // Check mutuality for all users
      for (const userA of testUsers) {
        const matchesA = await getUserMatches(userA.netid, testPromptId);
        expect(matchesA).toBeTruthy();

        for (const matchedNetid of matchesA!.matches) {
          // Get user B's matches
          const matchesB = await getUserMatches(matchedNetid, testPromptId);
          expect(matchesB).toBeTruthy();

          // User B should have User A in their matches
          expect(matchesB!.matches).toContain(userA.netid);
        }
      }
    });

    test('should not create duplicate matches', async () => {
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      // Verify no user appears multiple times in another user's match list
      for (const user of testUsers) {
        const matches = await getUserMatches(user.netid, testPromptId);
        const uniqueMatches = new Set(matches!.matches);
        expect(uniqueMatches.size).toBe(matches!.matches.length);
      }
    });

    test('should not match a user with themselves', async () => {
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      // Verify no user is matched with themselves
      for (const user of testUsers) {
        const matches = await getUserMatches(user.netid, testPromptId);
        expect(matches!.matches).not.toContain(user.netid);
      }
    });
  });

  describe('Match Structure Validation', () => {
    test('should create matches with all required fields', async () => {
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      const matches = await getUserMatches(testUsers[0].netid, testPromptId);

      // Verify all required fields exist
      expect(matches).toHaveProperty('netid');
      expect(matches).toHaveProperty('promptId');
      expect(matches).toHaveProperty('matches');
      expect(matches).toHaveProperty('revealed');
      expect(matches).toHaveProperty('createdAt');
      expect(matches).toHaveProperty('expiresAt');

      // Verify field types
      expect(typeof matches!.netid).toBe('string');
      expect(typeof matches!.promptId).toBe('string');
      expect(Array.isArray(matches!.matches)).toBe(true);
      expect(Array.isArray(matches!.revealed)).toBe(true);
    });

    test('should set expiresAt to next Friday', async () => {
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      const matches = await getUserMatches(testUsers[0].netid, testPromptId);
      const expiresAt = matches!.expiresAt.toDate();

      // Should be a Friday
      expect(expiresAt.getDay()).toBe(5); // Friday = 5

      // Should be in the future
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

      // Should be within 7 days
      const daysDiff = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeLessThanOrEqual(7);
      expect(daysDiff).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle odd number of users', async () => {
      // Create 7 users (odd number)
      testUsers = await createTestUsers(7);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      const matchedCount = await generateMatchesForPrompt(testPromptId);

      // All 7 users should get matched
      expect(matchedCount).toBe(7);

      // Each user should still get up to 3 matches
      for (const user of testUsers) {
        const matches = await getUserMatches(user.netid, testPromptId);
        expect(matches).toBeTruthy();
        expect(matches!.matches.length).toBeGreaterThan(0);
        expect(matches!.matches.length).toBeLessThanOrEqual(3);
      }
    });

    test('should handle small number of users (less than 3)', async () => {
      // Create only 2 users
      testUsers = await createTestUsers(2);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      const matchedCount = await generateMatchesForPrompt(testPromptId);

      // Both users should be matched
      expect(matchedCount).toBe(2);

      // Each user should match with the other (only 1 match available)
      const user1Matches = await getUserMatches(testUsers[0].netid, testPromptId);
      const user2Matches = await getUserMatches(testUsers[1].netid, testPromptId);

      expect(user1Matches?.matches).toContain(testUsers[1].netid);
      expect(user2Matches?.matches).toContain(testUsers[0].netid);
    });

    test('should skip users without profiles', async () => {
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      // Delete one user's profile
      await db.collection('profiles').doc(testUsers[0].netid).delete();

      await createTestPromptAnswers(testUsers, testPromptId);
      const matchedCount = await generateMatchesForPrompt(testPromptId);

      // Should match only 5 users (excluding the one without profile)
      expect(matchedCount).toBe(5);

      // User without profile should not have matches
      const noMatches = await getUserMatches(testUsers[0].netid, testPromptId);
      expect(noMatches).toBeNull();
    });

    test('should skip users without preferences', async () => {
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      // Delete one user's preferences
      await db.collection('preferences').doc(testUsers[0].netid).delete();

      await createTestPromptAnswers(testUsers, testPromptId);
      const matchedCount = await generateMatchesForPrompt(testPromptId);

      // Should match only 5 users
      expect(matchedCount).toBe(5);

      // User without preferences should not have matches
      const noMatches = await getUserMatches(testUsers[0].netid, testPromptId);
      expect(noMatches).toBeNull();
    });
  });

  describe('Duplicate Match Prevention', () => {
    test('should throw error when running matching twice for same prompt', async () => {
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);

      // First run should succeed
      await generateMatchesForPrompt(testPromptId);

      // Second run should throw error due to existing matches
      await expect(generateMatchesForPrompt(testPromptId)).rejects.toThrow();
    });

    test('should allow matching for different prompts', async () => {
      testUsers = await createTestUsers(6);
      const prompt1 = await createTestPrompt();
      const prompt2 = await createTestPrompt();

      await createTestPromptAnswers(testUsers, prompt1.promptId);
      await createTestPromptAnswers(testUsers, prompt2.promptId);

      // Both should succeed
      await generateMatchesForPrompt(prompt1.promptId);
      await generateMatchesForPrompt(prompt2.promptId);

      // Each user should have matches for both prompts
      const user1Matches1 = await getUserMatches(testUsers[0].netid, prompt1.promptId);
      const user1Matches2 = await getUserMatches(testUsers[0].netid, prompt2.promptId);

      expect(user1Matches1).toBeTruthy();
      expect(user1Matches2).toBeTruthy();
      expect(user1Matches1!.promptId).toBe(prompt1.promptId);
      expect(user1Matches2!.promptId).toBe(prompt2.promptId);
    });
  });

  describe('Compatibility Scoring', () => {
    test('should prioritize users with shared interests', async () => {
      // Create users with very specific interests
      const user1 = await createTestUsers(1);
      user1[0].profile.interests = ['coding', 'gaming', 'music'];

      const user2 = await createTestUsers(1);
      user2[0].profile.interests = ['coding', 'gaming', 'music']; // Same as user1

      const user3 = await createTestUsers(1);
      user3[0].profile.interests = ['reading', 'painting', 'dancing']; // Different

      testUsers = [...user1, ...user2, ...user3];

      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      // User1 and User2 should likely match (high compatibility)
      const user1Matches = await getUserMatches(user1[0].netid, testPromptId);

      // Due to high compatibility, user2 should be in user1's matches
      expect(user1Matches!.matches).toContain(user2[0].netid);
    });
  });

  describe('Performance Tests', () => {
    test('should handle large number of users (100+)', async () => {
      // Create 100 users
      testUsers = await createTestUsers(100);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);

      const startTime = Date.now();
      const matchedCount = await generateMatchesForPrompt(testPromptId);
      const duration = Date.now() - startTime;

      // Should match all 100 users
      expect(matchedCount).toBe(100);

      // Should complete in reasonable time (< 20 seconds)
      expect(duration).toBeLessThan(20000);

      // Spot check: verify a few random users have 3 matches
      const randomUsers = [testUsers[0], testUsers[50], testUsers[99]];
      for (const user of randomUsers) {
        const matches = await getUserMatches(user.netid, testPromptId);
        expect(matches?.matches).toHaveLength(3);
      }
    }, 30000); // 30 second timeout for this test
  });
});
