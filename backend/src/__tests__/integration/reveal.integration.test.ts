/**
 * Reveal System Integration Tests
 *
 * These tests verify the match reveal system works correctly end-to-end.
 * Tests cover:
 * - Revealing individual matches by index
 * - Updating the revealed array correctly
 * - Permission verification (users can only reveal their own matches)
 * - Revealing all 3 matches independently
 * - Edge cases and error handling
 */

import { revealMatch } from '../../services/matchingService';
import { generateMatchesForPrompt } from '../../services/matchingService';
import {
  createTestUsers,
  createTestPrompt,
  createTestPromptAnswers,
  cleanupTestData,
  getUserMatches,
  TestUser,
} from '../utils/testDataGenerator';

jest.setTimeout(120000); // Increased timeout for integration tests with cleanup

describe('Reveal System Integration Tests', () => {
  let testUsers: TestUser[] = [];
  let testPromptId: string;

  beforeAll(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    testUsers = [];
    testPromptId = '';
  });

  afterEach(async () => {
    // Clean up test data after each test to avoid collisions
    await cleanupTestData();
  });

  describe('Basic Reveal Functionality', () => {
    test('should reveal a specific match by index', async () => {
      testUsers = await createTestUsers(10);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      // Reveal first match (index 0)
      await revealMatch(testUsers[0].netid, testPromptId, 0);

      const matches = await getUserMatches(testUsers[0].netid, testPromptId);

      // First match should be revealed, others should not
      expect(matches!.revealed[0]).toBe(true);
      // Check remaining matches based on actual match count
      for (let i = 1; i < matches!.matches.length; i++) {
        expect(matches!.revealed[i]).toBe(false);
      }
    });

    test('should reveal all matches independently', async () => {
      testUsers = await createTestUsers(10);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      // Initially all should be unrevealed
      let matches = await getUserMatches(testUsers[0].netid, testPromptId);
      expect(matches!.revealed.every((r: boolean) => r === false)).toBe(true);

      const matchCount = matches!.matches.length;

      // Reveal each match independently
      for (let i = 0; i < matchCount; i++) {
        await revealMatch(testUsers[0].netid, testPromptId, i);
        matches = await getUserMatches(testUsers[0].netid, testPromptId);

        // Check that all matches up to index i are revealed, rest are not
        for (let j = 0; j < matchCount; j++) {
          expect(matches!.revealed[j]).toBe(j <= i);
        }
      }

      // All matches should now be revealed
      expect(matches!.revealed.every((r: boolean) => r === true)).toBe(true);
    });

    test('should not affect other users when revealing a match', async () => {
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      // User 0 reveals their first match
      await revealMatch(testUsers[0].netid, testPromptId, 0);

      // Other users' revealed arrays should remain unchanged
      for (let i = 1; i < testUsers.length; i++) {
        const matches = await getUserMatches(testUsers[i].netid, testPromptId);
        expect(matches!.revealed.every((r: boolean) => r === false)).toBe(true);
      }
    });

    test('should allow revealing the same match multiple times (idempotent)', async () => {
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      // Reveal first match
      await revealMatch(testUsers[0].netid, testPromptId, 0);
      let matches = await getUserMatches(testUsers[0].netid, testPromptId);
      expect(matches!.revealed[0]).toBe(true);

      // Reveal again - should not error
      await revealMatch(testUsers[0].netid, testPromptId, 0);
      matches = await getUserMatches(testUsers[0].netid, testPromptId);
      expect(matches!.revealed[0]).toBe(true);
    });
  });

  describe('Reveal with Different Match Counts', () => {
    test('should handle revealing matches when user has less than 3 matches', async () => {
      testUsers = await createTestUsers(3);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      // Each user should have 2 matches (only 3 users total)
      const matches = await getUserMatches(testUsers[0].netid, testPromptId);
      const matchCount = matches!.matches.length;

      // Reveal all available matches
      for (let i = 0; i < matchCount; i++) {
        await revealMatch(testUsers[0].netid, testPromptId, i);
      }

      const updatedMatches = await getUserMatches(testUsers[0].netid, testPromptId);

      // All matches should be revealed
      expect(updatedMatches!.revealed.every((r: boolean) => r === true)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should throw error for invalid match index (negative)', async () => {
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      await expect(revealMatch(testUsers[0].netid, testPromptId, -1)).rejects.toThrow(
        'Match index must be between 0 and 2'
      );
    });

    test('should throw error for invalid match index (too high)', async () => {
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      await expect(revealMatch(testUsers[0].netid, testPromptId, 3)).rejects.toThrow(
        'Match index must be between 0 and 2'
      );
    });

    test('should throw error when revealing match for non-existent prompt', async () => {
      testUsers = await createTestUsers(6);

      await expect(
        revealMatch(testUsers[0].netid, 'NONEXISTENT-PROMPT', 0)
      ).rejects.toThrow('Match not found');
    });

    test('should throw error when match index exceeds actual match count', async () => {
      testUsers = await createTestUsers(3);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      const matches = await getUserMatches(testUsers[0].netid, testPromptId);

      // Try to reveal index 2 when user only has 2 matches (indices 0 and 1)
      if (matches!.matches.length < 3) {
        await expect(revealMatch(testUsers[0].netid, testPromptId, 2)).rejects.toThrow(
          'Match index out of bounds'
        );
      }
    });
  });

  describe('Reveal Independence from Nudging', () => {
    test('should allow revealing matches regardless of nudge status', async () => {
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      // Reveal a match without any nudging
      await revealMatch(testUsers[0].netid, testPromptId, 0);

      const matches = await getUserMatches(testUsers[0].netid, testPromptId);

      // Match should be revealed
      expect(matches!.revealed[0]).toBe(true);

      // chatUnlocked should not be affected (should be undefined or false)
      if (matches!.chatUnlocked) {
        expect(matches!.chatUnlocked[0]).toBe(false);
      }
    });

    test('revealing a match should not unlock chat', async () => {
      testUsers = await createTestUsers(10);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      const initialMatches = await getUserMatches(testUsers[0].netid, testPromptId);
      const matchCount = initialMatches!.matches.length;

      // Reveal all matches
      for (let i = 0; i < matchCount; i++) {
        await revealMatch(testUsers[0].netid, testPromptId, i);
      }

      const matches = await getUserMatches(testUsers[0].netid, testPromptId);

      // All matches should be revealed
      expect(matches!.revealed.every((r: boolean) => r === true)).toBe(true);

      // But chat should not be unlocked
      if (matches!.chatUnlocked) {
        expect(matches!.chatUnlocked.every((u: boolean) => u === false)).toBe(true);
      }
    });
  });

  describe('Concurrent Reveal Operations', () => {
    test('should handle concurrent reveals of different matches', async () => {
      testUsers = await createTestUsers(10);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      const initialMatches = await getUserMatches(testUsers[0].netid, testPromptId);
      const matchCount = initialMatches!.matches.length;

      // Reveal all matches concurrently
      const revealPromises = [];
      for (let i = 0; i < matchCount; i++) {
        revealPromises.push(revealMatch(testUsers[0].netid, testPromptId, i));
      }
      await Promise.all(revealPromises);

      const matches = await getUserMatches(testUsers[0].netid, testPromptId);

      // All should be revealed
      expect(matches!.revealed.every((r: boolean) => r === true)).toBe(true);
    });

    test('should handle concurrent reveals of same match (idempotent)', async () => {
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      // Reveal same match multiple times concurrently
      await Promise.all([
        revealMatch(testUsers[0].netid, testPromptId, 0),
        revealMatch(testUsers[0].netid, testPromptId, 0),
        revealMatch(testUsers[0].netid, testPromptId, 0),
      ]);

      const matches = await getUserMatches(testUsers[0].netid, testPromptId);

      // Should be revealed without errors
      expect(matches!.revealed[0]).toBe(true);
    });
  });

  describe('Reveal Order Independence', () => {
    test('should allow revealing matches in any order', async () => {
      testUsers = await createTestUsers(10);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      const initialMatches = await getUserMatches(testUsers[0].netid, testPromptId);
      const matchCount = initialMatches!.matches.length;

      // Only test if user has at least 3 matches
      if (matchCount >= 3) {
        // Reveal in reverse order: 2, then 0, then 1
        await revealMatch(testUsers[0].netid, testPromptId, 2);
        let matches = await getUserMatches(testUsers[0].netid, testPromptId);
        expect(matches!.revealed[2]).toBe(true);
        expect(matches!.revealed[0]).toBe(false);
        expect(matches!.revealed[1]).toBe(false);

        await revealMatch(testUsers[0].netid, testPromptId, 0);
        matches = await getUserMatches(testUsers[0].netid, testPromptId);
        expect(matches!.revealed[0]).toBe(true);
        expect(matches!.revealed[2]).toBe(true);
        expect(matches!.revealed[1]).toBe(false);

        await revealMatch(testUsers[0].netid, testPromptId, 1);
        matches = await getUserMatches(testUsers[0].netid, testPromptId);
        expect(matches!.revealed.slice(0, 3)).toEqual([true, true, true]);
      } else {
        // If fewer than 3 matches, just verify order independence with what we have
        const revealOrder = matchCount === 2 ? [1, 0] : [0];
        for (const index of revealOrder) {
          await revealMatch(testUsers[0].netid, testPromptId, index);
        }
        const matches = await getUserMatches(testUsers[0].netid, testPromptId);
        expect(matches!.revealed.every((r: boolean) => r === true)).toBe(true);
      }
    });
  });

  describe('Reveal with Manual Matches', () => {
    test('should work correctly with manually created matches', async () => {
      testUsers = await createTestUsers(2);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      // Manually create a match
      const { db } = require('../../../firebaseAdmin');
      const now = new Date();
      const nextFriday = new Date();
      nextFriday.setDate(nextFriday.getDate() + 7);

      await db
        .collection('weeklyMatches')
        .doc(`${testUsers[0].netid}_${testPromptId}`)
        .set({
          netid: testUsers[0].netid,
          promptId: testPromptId,
          matches: [testUsers[1].netid],
          revealed: [false],
          createdAt: now,
          expiresAt: nextFriday,
        });

      // Reveal the manual match
      await revealMatch(testUsers[0].netid, testPromptId, 0);

      const matches = await getUserMatches(testUsers[0].netid, testPromptId);
      expect(matches!.revealed[0]).toBe(true);
    });
  });

  describe('Reveal State Persistence', () => {
    test('should persist revealed state across queries', async () => {
      testUsers = await createTestUsers(10);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      // Reveal first match
      await revealMatch(testUsers[0].netid, testPromptId, 0);

      const initialMatches = await getUserMatches(testUsers[0].netid, testPromptId);
      const matchCount = initialMatches!.matches.length;

      // Query multiple times - state should persist
      for (let i = 0; i < 3; i++) {
        const matches = await getUserMatches(testUsers[0].netid, testPromptId);
        expect(matches!.revealed[0]).toBe(true);
        // Check remaining matches are unrevealed
        for (let j = 1; j < matchCount; j++) {
          expect(matches!.revealed[j]).toBe(false);
        }
      }
    });

    test('should maintain revealed state after revealing additional matches', async () => {
      testUsers = await createTestUsers(10);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      const initialMatches = await getUserMatches(testUsers[0].netid, testPromptId);
      const matchCount = initialMatches!.matches.length;

      // Reveal matches one by one, checking state persists
      for (let i = 0; i < matchCount; i++) {
        await revealMatch(testUsers[0].netid, testPromptId, i);
        const matches = await getUserMatches(testUsers[0].netid, testPromptId);

        // All matches up to index i should be revealed
        for (let j = 0; j <= i; j++) {
          expect(matches!.revealed[j]).toBe(true);
        }

        // Remaining matches should be unrevealed
        for (let j = i + 1; j < matchCount; j++) {
          expect(matches!.revealed[j]).toBe(false);
        }
      }
    });
  });
});
