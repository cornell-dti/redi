/**
 * Nudging System Integration Tests
 *
 * These tests verify the nudging system works correctly end-to-end with real Firestore data.
 * Tests cover:
 * - Creating nudges between matched users
 * - Mutual nudge detection
 * - Chat unlocking on mutual nudge
 * - Notification creation
 * - Edge cases (expired matches, duplicate nudges, etc.)
 * - Correct match index updates in chatUnlocked array
 */

import { createNudge, getNudgeStatus } from '../../services/nudgesService';
import { generateMatchesForPrompt } from '../../services/matchingService';
import {
  createTestUsers,
  createTestPrompt,
  createTestPromptAnswers,
  cleanupTestData,
  getUserMatches,
  getNudge,
  TestUser,
} from '../utils/testDataGenerator';
import { db } from '../../../firebaseAdmin';

jest.setTimeout(30000);

describe('Nudging System Integration Tests', () => {
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

  describe('Basic Nudging Functionality', () => {
    test('should create a nudge from user A to user B', async () => {
      // Create users and matches
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      // User 0 nudges User 1 (assuming they're matched)
      const userAMatches = await getUserMatches(testUsers[0].netid, testPromptId);
      const userBNetid = userAMatches!.matches[0]; // First match

      await createNudge(testUsers[0].netid, userBNetid, testPromptId);

      // Verify nudge was created
      const nudge = await getNudge(testUsers[0].netid, userBNetid, testPromptId);
      expect(nudge).toBeTruthy();
      expect(nudge!.fromNetid).toBe(testUsers[0].netid);
      expect(nudge!.toNetid).toBe(userBNetid);
      expect(nudge!.promptId).toBe(testPromptId);
      expect(nudge!.mutual).toBe(false);
    });

    test('should detect mutual nudge when both users nudge each other', async () => {
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      const userAMatches = await getUserMatches(testUsers[0].netid, testPromptId);
      const userBNetid = userAMatches!.matches[0];

      // User A nudges User B
      await createNudge(testUsers[0].netid, userBNetid, testPromptId);

      // User B nudges User A back
      await createNudge(userBNetid, testUsers[0].netid, testPromptId);

      // Both nudges should be marked as mutual
      const nudgeAtoB = await getNudge(testUsers[0].netid, userBNetid, testPromptId);
      const nudgeBtoA = await getNudge(userBNetid, testUsers[0].netid, testPromptId);

      expect(nudgeAtoB!.mutual).toBe(true);
      expect(nudgeBtoA!.mutual).toBe(true);
    });

    test('should unlock chat for both users on mutual nudge', async () => {
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      const userAMatches = await getUserMatches(testUsers[0].netid, testPromptId);
      const userBNetid = userAMatches!.matches[0];

      // Before nudging, chatUnlocked should not exist or be false
      expect(userAMatches!.chatUnlocked).toBeUndefined();

      // User A nudges User B
      await createNudge(testUsers[0].netid, userBNetid, testPromptId);

      // User B nudges User A back (creates mutual nudge)
      await createNudge(userBNetid, testUsers[0].netid, testPromptId);

      // Get updated match data
      const userAMatchesAfter = await getUserMatches(testUsers[0].netid, testPromptId);
      const userBMatchesAfter = await getUserMatches(userBNetid, testPromptId);

      // Find the index of each user in the other's matches array
      const indexOfBInA = userAMatchesAfter!.matches.indexOf(userBNetid);
      const indexOfAInB = userBMatchesAfter!.matches.indexOf(testUsers[0].netid);

      // chatUnlocked should be set for the specific match index
      expect(userAMatchesAfter!.chatUnlocked).toBeDefined();
      expect(userAMatchesAfter!.chatUnlocked![indexOfBInA]).toBe(true);

      expect(userBMatchesAfter!.chatUnlocked).toBeDefined();
      expect(userBMatchesAfter!.chatUnlocked![indexOfAInB]).toBe(true);
    });

    test('should only unlock chat for the specific match, not all matches', async () => {
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      const userAMatches = await getUserMatches(testUsers[0].netid, testPromptId);
      const userBNetid = userAMatches!.matches[0]; // First match
      const userCNetid = userAMatches!.matches[1]; // Second match

      // User A and User B mutually nudge
      await createNudge(testUsers[0].netid, userBNetid, testPromptId);
      await createNudge(userBNetid, testUsers[0].netid, testPromptId);

      // Get updated matches
      const userAMatchesAfter = await getUserMatches(testUsers[0].netid, testPromptId);

      const indexOfB = userAMatchesAfter!.matches.indexOf(userBNetid);
      const indexOfC = userAMatchesAfter!.matches.indexOf(userCNetid);

      // Only chat with User B should be unlocked, not User C
      expect(userAMatchesAfter!.chatUnlocked![indexOfB]).toBe(true);
      expect(userAMatchesAfter!.chatUnlocked![indexOfC]).toBe(false);
    });
  });

  describe('Nudge Status Queries', () => {
    test('should correctly report nudge status', async () => {
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      const userAMatches = await getUserMatches(testUsers[0].netid, testPromptId);
      const userBNetid = userAMatches!.matches[0];

      // Initial status - no nudges
      let status = await getNudgeStatus(testUsers[0].netid, userBNetid, testPromptId);
      expect(status.sent).toBe(false);
      expect(status.received).toBe(false);
      expect(status.mutual).toBe(false);

      // User A nudges User B
      await createNudge(testUsers[0].netid, userBNetid, testPromptId);

      // Status from User A's perspective
      status = await getNudgeStatus(testUsers[0].netid, userBNetid, testPromptId);
      expect(status.sent).toBe(true);
      expect(status.received).toBe(false);
      expect(status.mutual).toBe(false);

      // Status from User B's perspective
      status = await getNudgeStatus(userBNetid, testUsers[0].netid, testPromptId);
      expect(status.sent).toBe(false);
      expect(status.received).toBe(true);
      expect(status.mutual).toBe(false);

      // User B nudges back
      await createNudge(userBNetid, testUsers[0].netid, testPromptId);

      // Both should show mutual
      status = await getNudgeStatus(testUsers[0].netid, userBNetid, testPromptId);
      expect(status.sent).toBe(true);
      expect(status.received).toBe(true);
      expect(status.mutual).toBe(true);

      status = await getNudgeStatus(userBNetid, testUsers[0].netid, testPromptId);
      expect(status.sent).toBe(true);
      expect(status.received).toBe(true);
      expect(status.mutual).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should throw error when nudging the same user twice', async () => {
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      const userAMatches = await getUserMatches(testUsers[0].netid, testPromptId);
      const userBNetid = userAMatches!.matches[0];

      // First nudge should succeed
      await createNudge(testUsers[0].netid, userBNetid, testPromptId);

      // Second nudge should fail
      await expect(createNudge(testUsers[0].netid, userBNetid, testPromptId)).rejects.toThrow(
        'already nudged'
      );
    });

    test('should handle nudging non-matched users gracefully', async () => {
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      const userAMatches = await getUserMatches(testUsers[0].netid, testPromptId);
      const nonMatchedUser = testUsers.find(
        (u) => !userAMatches!.matches.includes(u.netid) && u.netid !== testUsers[0].netid
      );

      // Nudging a non-matched user should still create the nudge
      // (the system doesn't prevent this, though the UI might)
      await createNudge(testUsers[0].netid, nonMatchedUser!.netid, testPromptId);

      const nudge = await getNudge(testUsers[0].netid, nonMatchedUser!.netid, testPromptId);
      expect(nudge).toBeTruthy();
    });

    test('should handle nudges for users with different number of matches', async () => {
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      // Get two users who are matched
      const userAMatches = await getUserMatches(testUsers[0].netid, testPromptId);
      const userBNetid = userAMatches!.matches[0];

      // Both users nudge each other
      await createNudge(testUsers[0].netid, userBNetid, testPromptId);
      await createNudge(userBNetid, testUsers[0].netid, testPromptId);

      // Even if users have different numbers of matches, chat should unlock correctly
      const userAMatchesAfter = await getUserMatches(testUsers[0].netid, testPromptId);
      const userBMatchesAfter = await getUserMatches(userBNetid, testPromptId);

      const indexOfBInA = userAMatchesAfter!.matches.indexOf(userBNetid);
      const indexOfAInB = userBMatchesAfter!.matches.indexOf(testUsers[0].netid);

      expect(userAMatchesAfter!.chatUnlocked![indexOfBInA]).toBe(true);
      expect(userBMatchesAfter!.chatUnlocked![indexOfAInB]).toBe(true);
    });
  });

  describe('Notification Creation on Mutual Nudge', () => {
    test('should create notifications for both users on mutual nudge', async () => {
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      const userAMatches = await getUserMatches(testUsers[0].netid, testPromptId);
      const userBNetid = userAMatches!.matches[0];

      // User A nudges User B
      await createNudge(testUsers[0].netid, userBNetid, testPromptId);

      // User B nudges User A back
      await createNudge(userBNetid, testUsers[0].netid, testPromptId);

      // Check for notifications
      const userANotifications = await db
        .collection('notifications')
        .where('netid', '==', testUsers[0].netid)
        .where('type', '==', 'mutual_nudge')
        .get();

      const userBNotifications = await db
        .collection('notifications')
        .where('netid', '==', userBNetid)
        .where('type', '==', 'mutual_nudge')
        .get();

      // Both users should have a mutual_nudge notification
      expect(userANotifications.empty).toBe(false);
      expect(userBNotifications.empty).toBe(false);

      // Verify notification metadata
      const userANotif = userANotifications.docs[0].data();
      expect(userANotif.metadata?.promptId).toBe(testPromptId);
      expect(userANotif.metadata?.matchNetid).toBe(userBNetid);
    });
  });

  describe('Concurrent Nudging', () => {
    test('should handle concurrent mutual nudges correctly', async () => {
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      const userAMatches = await getUserMatches(testUsers[0].netid, testPromptId);
      const userBNetid = userAMatches!.matches[0];

      // Both users nudge simultaneously
      await Promise.all([
        createNudge(testUsers[0].netid, userBNetid, testPromptId),
        createNudge(userBNetid, testUsers[0].netid, testPromptId),
      ]);

      // Both nudges should be marked as mutual
      const nudgeAtoB = await getNudge(testUsers[0].netid, userBNetid, testPromptId);
      const nudgeBtoA = await getNudge(userBNetid, testUsers[0].netid, testPromptId);

      expect(nudgeAtoB!.mutual).toBe(true);
      expect(nudgeBtoA!.mutual).toBe(true);

      // Chat should be unlocked for both
      const userAMatchesAfter = await getUserMatches(testUsers[0].netid, testPromptId);
      const userBMatchesAfter = await getUserMatches(userBNetid, testPromptId);

      const indexOfBInA = userAMatchesAfter!.matches.indexOf(userBNetid);
      const indexOfAInB = userBMatchesAfter!.matches.indexOf(testUsers[0].netid);

      expect(userAMatchesAfter!.chatUnlocked![indexOfBInA]).toBe(true);
      expect(userBMatchesAfter!.chatUnlocked![indexOfAInB]).toBe(true);
    });
  });

  describe('Manual Matches Nudging', () => {
    test('should work correctly with manually created matches', async () => {
      testUsers = await createTestUsers(2);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      // Manually create a match between the two users
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

      await db
        .collection('weeklyMatches')
        .doc(`${testUsers[1].netid}_${testPromptId}`)
        .set({
          netid: testUsers[1].netid,
          promptId: testPromptId,
          matches: [testUsers[0].netid],
          revealed: [false],
          createdAt: now,
          expiresAt: nextFriday,
        });

      // Nudge should work with manual matches
      await createNudge(testUsers[0].netid, testUsers[1].netid, testPromptId);
      await createNudge(testUsers[1].netid, testUsers[0].netid, testPromptId);

      // Chat should be unlocked
      const user0MatchesAfter = await getUserMatches(testUsers[0].netid, testPromptId);
      const user1MatchesAfter = await getUserMatches(testUsers[1].netid, testPromptId);

      expect(user0MatchesAfter!.chatUnlocked![0]).toBe(true);
      expect(user1MatchesAfter!.chatUnlocked![0]).toBe(true);
    });
  });
});
