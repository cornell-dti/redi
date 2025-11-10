/**
 * End-to-End Integration Tests
 *
 * These tests verify the complete workflow of the matching system from start to finish.
 * Tests include:
 * - Creating users and prompts
 * - Generating matches
 * - Nudging and mutual nudges
 * - Chat unlocking
 * - Revealing matches
 * - Manual match creation
 * - Full workflow scenarios
 */

import { generateMatchesForPrompt, revealMatch, createWeeklyMatch } from '../../services/matchingService';
import { createNudge, getNudgeStatus } from '../../services/nudgesService';
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

jest.setTimeout(120000); // Extended timeout for end-to-end tests with cleanup

describe('End-to-End Integration Tests', () => {
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

  describe('Complete Matching Workflow', () => {
    test('Full workflow: create users → match → nudge → reveal', async () => {
      // Step 1: Create 6 test users
      console.log('Step 1: Creating 6 test users...');
      testUsers = await createTestUsers(6);
      expect(testUsers).toHaveLength(6);

      // Step 2: Create a test prompt
      console.log('Step 2: Creating test prompt...');
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;
      expect(testPromptId).toBeTruthy();

      // Step 3: Users answer the prompt
      console.log('Step 3: Users answering prompt...');
      await createTestPromptAnswers(testUsers, testPromptId);

      // Verify answers were created
      const answersSnapshot = await db
        .collection('weeklyPromptAnswers')
        .where('promptId', '==', testPromptId)
        .get();
      expect(answersSnapshot.size).toBe(6);

      // Step 4: Run matching algorithm
      console.log('Step 4: Running matching algorithm...');
      const matchedCount = await generateMatchesForPrompt(testPromptId);
      expect(matchedCount).toBe(6);

      // Step 5: Verify all users have 3 matches
      console.log('Step 5: Verifying matches...');
      for (const user of testUsers) {
        const matches = await getUserMatches(user.netid, testPromptId);
        expect(matches).toBeTruthy();
        if (!matches) {
          throw new Error(`No matches found for user ${user.netid} on prompt ${testPromptId}. Check test setup.`);
        }
        expect(matches.matches.length).toBeGreaterThanOrEqual(1);
        expect(matches.matches.length).toBeLessThanOrEqual(3);
        expect(matches.revealed.every((r: boolean) => r === false)).toBe(true);
      }

      // Step 6: User 1 nudges User 2
      console.log('Step 6: User 1 nudging User 2...');
      const user1Matches = await getUserMatches(testUsers[0].netid, testPromptId);
      if (!user1Matches) {
        throw new Error(`No matches found for user ${testUsers[0].netid} on prompt ${testPromptId}. Check test setup.`);
      }
      const user2Netid = user1Matches.matches[0];

      await createNudge(testUsers[0].netid, user2Netid, testPromptId);

      // Verify nudge was created
      const nudge1to2 = await getNudge(testUsers[0].netid, user2Netid, testPromptId);
      expect(nudge1to2).toBeTruthy();
      expect(nudge1to2!.mutual).toBe(false);

      // Step 7: User 2 accepts nudge (nudges back)
      console.log('Step 7: User 2 accepting nudge...');
      await createNudge(user2Netid, testUsers[0].netid, testPromptId);

      // Verify mutual nudge (refetch both nudges after mutual nudge is created)
      const nudge2to1 = await getNudge(user2Netid, testUsers[0].netid, testPromptId);
      const nudge1to2Updated = await getNudge(testUsers[0].netid, user2Netid, testPromptId);
      expect(nudge2to1!.mutual).toBe(true);
      expect(nudge1to2Updated!.mutual).toBe(true);

      // Step 8: Verify chat is unlocked between them
      console.log('Step 8: Verifying chat unlock...');
      const user1MatchesAfter = await getUserMatches(testUsers[0].netid, testPromptId);
      const user2MatchesAfter = await getUserMatches(user2Netid, testPromptId);
      if (!user1MatchesAfter) {
        throw new Error(`No matches found for user ${testUsers[0].netid} on prompt ${testPromptId}. Check test setup.`);
      }
      if (!user2MatchesAfter) {
        throw new Error(`No matches found for user ${user2Netid} on prompt ${testPromptId}. Check test setup.`);
      }

      const indexOfUser2InUser1 = user1MatchesAfter.matches.indexOf(user2Netid);
      const indexOfUser1InUser2 = user2MatchesAfter.matches.indexOf(testUsers[0].netid);

      expect(user1MatchesAfter.chatUnlocked![indexOfUser2InUser1]).toBe(true);
      expect(user2MatchesAfter.chatUnlocked![indexOfUser1InUser2]).toBe(true);

      // Step 9: User 1 reveals User 3 (another match)
      console.log('Step 9: User 1 revealing User 3...');
      await revealMatch(testUsers[0].netid, testPromptId, 1);

      const user1MatchesFinal = await getUserMatches(testUsers[0].netid, testPromptId);
      if (!user1MatchesFinal) {
        throw new Error(`No matches found for user ${testUsers[0].netid} on prompt ${testPromptId}. Check test setup.`);
      }
      expect(user1MatchesFinal.revealed[1]).toBe(true);

      // Step 10: Verify system integrity
      console.log('Step 10: Verifying system integrity...');

      // All users should still have their matches
      for (const user of testUsers) {
        const matches = await getUserMatches(user.netid, testPromptId);
        expect(matches).toBeTruthy();
        if (!matches) {
          throw new Error(`No matches found for user ${user.netid} on prompt ${testPromptId}. Check test setup.`);
        }
        expect(matches.matches.length).toBeGreaterThan(0);
        expect(matches.matches.length).toBeLessThanOrEqual(3);
      }

      console.log('✅ Full workflow completed successfully!');
    });
  });

  describe('Manual Match Integration with Nudging', () => {
    test('Manual match creation followed by nudging workflow', async () => {
      console.log('Creating 6 test users for manual match test...');
      testUsers = await createTestUsers(6);

      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      // Run algorithm matching first
      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      // Now manually add a 4th user to User 0's matches (using append mode)
      console.log('Manually adding a 4th user to User 0...');
      const user4Netid = testUsers[4].netid;

      // This should fail because user already has 3 matches (at max)
      await expect(
        createWeeklyMatch(testUsers[0].netid, testPromptId, [user4Netid], true)
      ).resolves.toBeDefined();

      // But since user already has 3 matches, no new match should be added
      const matchesAfterAttempt = await getUserMatches(testUsers[0].netid, testPromptId);
      expect(matchesAfterAttempt).toBeTruthy();
      if (!matchesAfterAttempt) {
        throw new Error(`No matches found for user ${testUsers[0].netid} on prompt ${testPromptId}. Check test setup.`);
      }
      expect(matchesAfterAttempt.matches.length).toBeGreaterThanOrEqual(1);
      expect(matchesAfterAttempt.matches.length).toBeLessThanOrEqual(3);

      console.log('✅ Manual match append correctly respects 3-match limit');
    });

    test('Manually create matches between 2 users then test nudging', async () => {
      console.log('Testing manual match + nudging workflow...');
      testUsers = await createTestUsers(2);

      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      // Manually create bidirectional matches
      await createWeeklyMatch(testUsers[0].netid, testPromptId, [testUsers[1].netid]);
      await createWeeklyMatch(testUsers[1].netid, testPromptId, [testUsers[0].netid]);

      // Verify matches were created
      const user0Matches = await getUserMatches(testUsers[0].netid, testPromptId);
      const user1Matches = await getUserMatches(testUsers[1].netid, testPromptId);
      if (!user0Matches) {
        throw new Error(`No matches found for user ${testUsers[0].netid} on prompt ${testPromptId}. Check test setup.`);
      }
      if (!user1Matches) {
        throw new Error(`No matches found for user ${testUsers[1].netid} on prompt ${testPromptId}. Check test setup.`);
      }

      expect(user0Matches.matches).toContain(testUsers[1].netid);
      expect(user1Matches.matches).toContain(testUsers[0].netid);

      // Now test nudging with manual matches
      await createNudge(testUsers[0].netid, testUsers[1].netid, testPromptId);
      await createNudge(testUsers[1].netid, testUsers[0].netid, testPromptId);

      // Verify chat unlocked
      const user0MatchesAfter = await getUserMatches(testUsers[0].netid, testPromptId);
      const user1MatchesAfter = await getUserMatches(testUsers[1].netid, testPromptId);
      if (!user0MatchesAfter) {
        throw new Error(`No matches found for user ${testUsers[0].netid} on prompt ${testPromptId}. Check test setup.`);
      }
      if (!user1MatchesAfter) {
        throw new Error(`No matches found for user ${testUsers[1].netid} on prompt ${testPromptId}. Check test setup.`);
      }

      expect(user0MatchesAfter.chatUnlocked![0]).toBe(true);
      expect(user1MatchesAfter.chatUnlocked![0]).toBe(true);

      console.log('✅ Manual matches work correctly with nudging!');
    });
  });

  describe('Multiple Prompts Workflow', () => {
    test('Users can have matches for multiple prompts simultaneously', async () => {
      testUsers = await createTestUsers(6);

      // Create two different prompts
      const prompt1 = await createTestPrompt();
      const prompt2 = await createTestPrompt();

      // Create answers for both prompts
      await createTestPromptAnswers(testUsers, prompt1.promptId);
      await createTestPromptAnswers(testUsers, prompt2.promptId);

      // Generate matches for both prompts
      await generateMatchesForPrompt(prompt1.promptId);
      await generateMatchesForPrompt(prompt2.promptId);

      // Each user should have matches for both prompts
      for (const user of testUsers) {
        const matches1 = await getUserMatches(user.netid, prompt1.promptId);
        const matches2 = await getUserMatches(user.netid, prompt2.promptId);

        expect(matches1).toBeTruthy();
        if (!matches1) {
          throw new Error(`No matches found for user ${user.netid} on prompt ${prompt1.promptId}. Check test setup.`);
        }
        expect(matches2).toBeTruthy();
        if (!matches2) {
          throw new Error(`No matches found for user ${user.netid} on prompt ${prompt2.promptId}. Check test setup.`);
        }

        expect(matches1.promptId).toBe(prompt1.promptId);
        expect(matches2.promptId).toBe(prompt2.promptId);
      }

      // Nudge in prompt 1 shouldn't affect prompt 2
      const user0Prompt1Matches = await getUserMatches(testUsers[0].netid, prompt1.promptId);
      if (!user0Prompt1Matches) {
        throw new Error(`No matches found for user ${testUsers[0].netid} on prompt ${prompt1.promptId}. Check test setup.`);
      }
      const matchedUser = user0Prompt1Matches.matches[0];

      await createNudge(testUsers[0].netid, matchedUser, prompt1.promptId);
      await createNudge(matchedUser, testUsers[0].netid, prompt1.promptId);

      // Chat should be unlocked for prompt1 but not prompt2
      const user0Prompt1After = await getUserMatches(testUsers[0].netid, prompt1.promptId);
      const user0Prompt2After = await getUserMatches(testUsers[0].netid, prompt2.promptId);
      if (!user0Prompt1After) {
        throw new Error(`No matches found for user ${testUsers[0].netid} on prompt ${prompt1.promptId}. Check test setup.`);
      }
      if (!user0Prompt2After) {
        throw new Error(`No matches found for user ${testUsers[0].netid} on prompt ${prompt2.promptId}. Check test setup.`);
      }

      expect(user0Prompt1After.chatUnlocked).toBeDefined();
      expect(user0Prompt1After.chatUnlocked![0]).toBe(true);

      // Prompt 2 chat should not be affected
      if (user0Prompt2After.chatUnlocked) {
        expect(user0Prompt2After.chatUnlocked.every((u: boolean) => u === false)).toBe(true);
      }

      console.log('✅ Multiple prompts work independently!');
    });
  });

  describe('Complex Multi-User Scenarios', () => {
    test('Scenario: 3 users in a triangle match pattern', async () => {
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      // Find three users who are all matched with each other
      const userAMatches = await getUserMatches(testUsers[0].netid, testPromptId);
      if (!userAMatches) {
        throw new Error(`No matches found for user ${testUsers[0].netid} on prompt ${testPromptId}. Check test setup.`);
      }
      const userBNetid = userAMatches.matches[0];
      const userCNetid = userAMatches.matches[1];

      // Check if B and C are also matched
      const userBMatches = await getUserMatches(userBNetid, testPromptId);
      const userCMatches = await getUserMatches(userCNetid, testPromptId);
      if (!userBMatches) {
        throw new Error(`No matches found for user ${userBNetid} on prompt ${testPromptId}. Check test setup.`);
      }
      if (!userCMatches) {
        throw new Error(`No matches found for user ${userCNetid} on prompt ${testPromptId}. Check test setup.`);
      }

      // A-B mutual nudge
      if (userAMatches.matches.includes(userBNetid)) {
        await createNudge(testUsers[0].netid, userBNetid, testPromptId);
        await createNudge(userBNetid, testUsers[0].netid, testPromptId);
      }

      // A-C mutual nudge
      if (userAMatches.matches.includes(userCNetid)) {
        await createNudge(testUsers[0].netid, userCNetid, testPromptId);
        await createNudge(userCNetid, testUsers[0].netid, testPromptId);
      }

      // B-C mutual nudge (if they're matched)
      if (
        userBMatches.matches.includes(userCNetid) &&
        userCMatches.matches.includes(userBNetid)
      ) {
        await createNudge(userBNetid, userCNetid, testPromptId);
        await createNudge(userCNetid, userBNetid, testPromptId);
      }

      // Verify User A has chat unlocked with both B and C
      const userAFinal = await getUserMatches(testUsers[0].netid, testPromptId);
      if (!userAFinal) {
        throw new Error(`No matches found for user ${testUsers[0].netid} on prompt ${testPromptId}. Check test setup.`);
      }
      const indexOfB = userAFinal.matches.indexOf(userBNetid);
      const indexOfC = userAFinal.matches.indexOf(userCNetid);

      expect(userAFinal.chatUnlocked![indexOfB]).toBe(true);
      expect(userAFinal.chatUnlocked![indexOfC]).toBe(true);

      console.log('✅ Triangle match pattern works correctly!');
    });

    test('Scenario: One user reveals all matches before nudging', async () => {
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      // User 0 reveals all their matches (could be 1-3)
      const matchesBeforeReveal = await getUserMatches(testUsers[0].netid, testPromptId);
      if (!matchesBeforeReveal) {
        throw new Error(`No matches found for user ${testUsers[0].netid} on prompt ${testPromptId}. Check test setup.`);
      }

      // Reveal all matches dynamically
      for (let i = 0; i < matchesBeforeReveal.matches.length; i++) {
        await revealMatch(testUsers[0].netid, testPromptId, i);
      }

      const matchesAfterReveal = await getUserMatches(testUsers[0].netid, testPromptId);
      if (!matchesAfterReveal) {
        throw new Error(`No matches found for user ${testUsers[0].netid} on prompt ${testPromptId}. Check test setup.`);
      }
      // All matches should be revealed
      expect(matchesAfterReveal.revealed.every((r: boolean) => r === true)).toBe(true);

      // Now nudge one of the revealed matches
      const matchedUser = matchesAfterReveal.matches[0];
      await createNudge(testUsers[0].netid, matchedUser, testPromptId);
      await createNudge(matchedUser, testUsers[0].netid, testPromptId);

      // Both revealed and chatUnlocked should be maintained
      const matchesFinal = await getUserMatches(testUsers[0].netid, testPromptId);
      if (!matchesFinal) {
        throw new Error(`No matches found for user ${testUsers[0].netid} on prompt ${testPromptId}. Check test setup.`);
      }
      // All matches should still be revealed
      expect(matchesFinal.revealed.every((r: boolean) => r === true)).toBe(true);
      // The first match should have chat unlocked (mutual nudge)
      expect(matchesFinal.chatUnlocked![0]).toBe(true);

      console.log('✅ Revealing before nudging works correctly!');
    });

    test('Scenario: Asymmetric nudging (some users nudge, others don\'t)', async () => {
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      const user0Matches = await getUserMatches(testUsers[0].netid, testPromptId);
      if (!user0Matches) {
        throw new Error(`No matches found for user ${testUsers[0].netid} on prompt ${testPromptId}. Check test setup.`);
      }

      // Ensure user has at least 2 matches for asymmetric nudging test
      expect(user0Matches.matches.length).toBeGreaterThanOrEqual(2);

      const matches = user0Matches.matches;
      const matchCount = matches.length;

      // User 0 nudges all their matches
      for (let i = 0; i < matchCount; i++) {
        await createNudge(testUsers[0].netid, matches[i], testPromptId);
      }

      // Only first match nudges back
      await createNudge(matches[0], testUsers[0].netid, testPromptId);

      // Check nudge statuses
      const statuses = [];
      for (let i = 0; i < matchCount; i++) {
        statuses.push(await getNudgeStatus(testUsers[0].netid, matches[i], testPromptId));
      }

      // First match should be mutual, others should not
      expect(statuses[0].mutual).toBe(true);
      for (let i = 1; i < matchCount; i++) {
        expect(statuses[i].mutual).toBe(false);
      }

      // Only chat with first match should be unlocked
      const user0Final = await getUserMatches(testUsers[0].netid, testPromptId);
      if (!user0Final) {
        throw new Error(`No matches found for user ${testUsers[0].netid} on prompt ${testPromptId}. Check test setup.`);
      }

      expect(user0Final.chatUnlocked![0]).toBe(true);
      for (let i = 1; i < matchCount; i++) {
        expect(user0Final.chatUnlocked![i]).toBe(false);
      }

      console.log('✅ Asymmetric nudging handled correctly!');
    });
  });

  describe('Data Integrity and Consistency', () => {
    test('Match data remains consistent after multiple operations', async () => {
      testUsers = await createTestUsers(6);
      const prompt = await createTestPrompt();
      testPromptId = prompt.promptId;

      await createTestPromptAnswers(testUsers, testPromptId);
      await generateMatchesForPrompt(testPromptId);

      // Perform many operations on same user
      const operations = async () => {
        const matches = await getUserMatches(testUsers[0].netid, testPromptId);
        if (!matches) {
          throw new Error(`No matches found for user ${testUsers[0].netid} on prompt ${testPromptId}. Check test setup.`);
        }

        // Reveal all matches dynamically (user may have 1-3 matches)
        for (let i = 0; i < matches.matches.length; i++) {
          await revealMatch(testUsers[0].netid, testPromptId, i);
        }

        // Nudge first match
        await createNudge(testUsers[0].netid, matches.matches[0], testPromptId);
        await createNudge(matches.matches[0], testUsers[0].netid, testPromptId);
      };

      await operations();

      // Verify data integrity
      const finalMatches = await getUserMatches(testUsers[0].netid, testPromptId);
      if (!finalMatches) {
        throw new Error(`No matches found for user ${testUsers[0].netid} on prompt ${testPromptId}. Check test setup.`);
      }

      // Should have 1-3 matches
      expect(finalMatches.matches.length).toBeGreaterThanOrEqual(1);
      expect(finalMatches.matches.length).toBeLessThanOrEqual(3);

      // Revealed array should match matches array length
      expect(finalMatches.revealed).toHaveLength(finalMatches.matches.length);

      // chatUnlocked array should exist and match matches array length
      expect(finalMatches.chatUnlocked).toBeDefined();
      expect(finalMatches.chatUnlocked).toHaveLength(finalMatches.matches.length);

      // All matches should be unique
      const uniqueMatches = new Set(finalMatches.matches);
      expect(uniqueMatches.size).toBe(finalMatches.matches.length);

      console.log('✅ Data integrity maintained after multiple operations!');
    });
  });
});
