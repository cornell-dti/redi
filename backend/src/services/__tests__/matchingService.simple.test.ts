/**
 * Simplified unit tests for Two-Phase Mutual Matching Algorithm
 * Tests core logic without full Firestore mocking complexity
 */

import {
  validateMatchMutuality,
} from '../matchingService';
import { db } from '../../../firebaseAdmin';

// Mock Firebase
jest.mock('../../../firebaseAdmin');

const mockDb = db as jest.Mocked<typeof db>;

describe('Two-Phase Mutual Matching - Core Logic Tests', () => {
  describe('validateMatchMutuality', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should detect non-mutual matches', async () => {
      const promptId = 'test-prompt-1';

      // Mock Firestore to return non-mutual matches
      const mockDocs = [
        {
          data: () => ({
            netid: 'user_a',
            promptId,
            matches: ['user_b'],
            revealed: [false],
          }),
        },
        {
          data: () => ({
            netid: 'user_b',
            promptId,
            matches: ['user_c'], // B doesn't have A!
            revealed: [false],
          }),
        },
        {
          data: () => ({
            netid: 'user_c',
            promptId,
            matches: ['user_b'],
            revealed: [false],
          }),
        },
      ];

      const mockGet = jest.fn().mockResolvedValue({
        forEach: (callback: any) => mockDocs.forEach(callback),
      });

      const mockWhere = jest.fn().mockReturnValue({
        get: mockGet,
      });

      const mockCollection = jest.fn().mockReturnValue({
        where: mockWhere,
      });

      mockDb.collection = mockCollection as any;

      const result = await validateMatchMutuality(promptId);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes('NON-MUTUAL'))).toBe(true);
    });

    test('should detect empty strings in matches', async () => {
      const promptId = 'test-prompt-2';

      const mockDocs = [
        {
          data: () => ({
            netid: 'user_a',
            promptId,
            matches: ['user_b', '', 'user_c'],
            revealed: [false, false, false],
          }),
        },
      ];

      const mockGet = jest.fn().mockResolvedValue({
        forEach: (callback: any) => mockDocs.forEach(callback),
      });

      const mockWhere = jest.fn().mockReturnValue({
        get: mockGet,
      });

      const mockCollection = jest.fn().mockReturnValue({
        where: mockWhere,
      });

      mockDb.collection = mockCollection as any;

      const result = await validateMatchMutuality(promptId);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes('invalid match values'))).toBe(true);
    });

    test('should pass validation for all mutual matches', async () => {
      const promptId = 'test-prompt-3';

      const mockDocs = [
        {
          data: () => ({
            netid: 'user_a',
            promptId,
            matches: ['user_b', 'user_c'],
            revealed: [false, false],
          }),
        },
        {
          data: () => ({
            netid: 'user_b',
            promptId,
            matches: ['user_a'],
            revealed: [false],
          }),
        },
        {
          data: () => ({
            netid: 'user_c',
            promptId,
            matches: ['user_a'],
            revealed: [false],
          }),
        },
      ];

      const mockGet = jest.fn().mockResolvedValue({
        forEach: (callback: any) => mockDocs.forEach(callback),
      });

      const mockWhere = jest.fn().mockReturnValue({
        get: mockGet,
      });

      const mockCollection = jest.fn().mockReturnValue({
        where: mockWhere,
      });

      mockDb.collection = mockCollection as any;

      const result = await validateMatchMutuality(promptId);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('should validate complex mutual matching scenario', async () => {
      const promptId = 'test-prompt-4';

      // 6 users with various mutual matches:
      // A ↔ B, A ↔ C, A ↔ D (A has 3 matches, all mutual)
      // B ↔ A, B ↔ E (B has 2 matches, both mutual)
      // C ↔ A (C has 1 match, mutual)
      // D ↔ A (D has 1 match, mutual)
      // E ↔ B (E has 1 match, mutual)
      // F has no matches
      const mockDocs = [
        {
          data: () => ({
            netid: 'user_a',
            promptId,
            matches: ['user_b', 'user_c', 'user_d'],
            revealed: [false, false, false],
          }),
        },
        {
          data: () => ({
            netid: 'user_b',
            promptId,
            matches: ['user_a', 'user_e'],
            revealed: [false, false],
          }),
        },
        {
          data: () => ({
            netid: 'user_c',
            promptId,
            matches: ['user_a'],
            revealed: [false],
          }),
        },
        {
          data: () => ({
            netid: 'user_d',
            promptId,
            matches: ['user_a'],
            revealed: [false],
          }),
        },
        {
          data: () => ({
            netid: 'user_e',
            promptId,
            matches: ['user_b'],
            revealed: [false],
          }),
        },
      ];

      const mockGet = jest.fn().mockResolvedValue({
        forEach: (callback: any) => mockDocs.forEach(callback),
      });

      const mockWhere = jest.fn().mockReturnValue({
        get: mockGet,
      });

      const mockCollection = jest.fn().mockReturnValue({
        where: mockWhere,
      });

      mockDb.collection = mockCollection as any;

      const result = await validateMatchMutuality(promptId);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('should detect null values in matches', async () => {
      const promptId = 'test-prompt-5';

      const mockDocs = [
        {
          data: () => ({
            netid: 'user_a',
            promptId,
            matches: ['user_b', null, 'user_c'],
            revealed: [false, false, false],
          }),
        },
      ];

      const mockGet = jest.fn().mockResolvedValue({
        forEach: (callback: any) => mockDocs.forEach(callback),
      });

      const mockWhere = jest.fn().mockReturnValue({
        get: mockGet,
      });

      const mockCollection = jest.fn().mockReturnValue({
        where: mockWhere,
      });

      mockDb.collection = mockCollection as any;

      const result = await validateMatchMutuality(promptId);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('invalid match values'))).toBe(true);
    });

    test('should detect whitespace-only strings', async () => {
      const promptId = 'test-prompt-6';

      const mockDocs = [
        {
          data: () => ({
            netid: 'user_a',
            promptId,
            matches: ['user_b', '   ', 'user_c'],
            revealed: [false, false, false],
          }),
        },
      ];

      const mockGet = jest.fn().mockResolvedValue({
        forEach: (callback: any) => mockDocs.forEach(callback),
      });

      const mockWhere = jest.fn().mockReturnValue({
        get: mockGet,
      });

      const mockCollection = jest.fn().mockReturnValue({
        where: mockWhere,
      });

      mockDb.collection = mockCollection as any;

      const result = await validateMatchMutuality(promptId);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('invalid match values'))).toBe(true);
    });

    test('should handle empty matches collection', async () => {
      const promptId = 'test-prompt-7';

      const mockGet = jest.fn().mockResolvedValue({
        forEach: jest.fn(), // No docs
      });

      const mockWhere = jest.fn().mockReturnValue({
        get: mockGet,
      });

      const mockCollection = jest.fn().mockReturnValue({
        where: mockWhere,
      });

      mockDb.collection = mockCollection as any;

      const result = await validateMatchMutuality(promptId);

      // Empty collection should still be valid (no errors)
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Algorithm Properties', () => {
    test('mutual matching guarantees: if A matches B, then B matches A', () => {
      // This is a documentation test to describe the algorithm guarantee

      // Phase 1: Calculate potential matches
      const potentialMatches = new Map<string, string[]>();
      potentialMatches.set('userA', ['userB', 'userC']);
      potentialMatches.set('userB', ['userA', 'userD']);
      potentialMatches.set('userC', ['userD']);
      potentialMatches.set('userD', ['userB', 'userC']);

      // Phase 2: Create only mutual pairs
      const finalMatches = new Map<string, string[]>();
      const processedPairs = new Set<string>();

      for (const [userA, userAMatches] of potentialMatches) {
        if (!finalMatches.has(userA)) {
          finalMatches.set(userA, []);
        }

        for (const userB of userAMatches) {
          const pairId = [userA, userB].sort().join('-');

          if (processedPairs.has(pairId)) {
            continue;
          }

          const userBMatches = potentialMatches.get(userB) || [];

          if (userBMatches.includes(userA)) {
            // MUTUAL MATCH
            finalMatches.get(userA)!.push(userB);

            if (!finalMatches.has(userB)) {
              finalMatches.set(userB, []);
            }
            finalMatches.get(userB)!.push(userA);

            processedPairs.add(pairId);
          }
        }
      }

      // Verify mutuality
      for (const [userA, matches] of finalMatches) {
        for (const userB of matches) {
          expect(finalMatches.get(userB)).toContain(userA);
        }
      }

      // Expected results:
      // userA ↔ userB (mutual)
      // userB ↔ userD (mutual)
      // userC ↔ userD (mutual)
      expect(finalMatches.get('userA')).toEqual(['userB']);
      expect(finalMatches.get('userB')).toEqual(expect.arrayContaining(['userA', 'userD']));
      expect(finalMatches.get('userC')).toEqual(['userD']);
      expect(finalMatches.get('userD')).toEqual(expect.arrayContaining(['userB', 'userC']));
    });

    test('filtering guarantees: empty strings, nulls, and self-references are removed', () => {
      const mockMatches = ['userB', '', null, '  ', 'userA', 'userC', 'userA'];

      // Apply the same filtering logic as Phase 1
      const validMatches = mockMatches.filter(
        (m: any) =>
          m && // Not null/undefined
          typeof m === 'string' && // Is a string
          m.trim() !== '' && // Not empty or whitespace
          m !== 'userA' // Not matching with self (assuming current user is userA)
      );

      expect(validMatches).toEqual(['userB', 'userC']);
      expect(validMatches).not.toContain('');
      expect(validMatches).not.toContain(null);
      expect(validMatches).not.toContain('  ');
      expect(validMatches).not.toContain('userA'); // No self-reference
    });

    test('match limit: users get maximum of 3 matches', () => {
      const potentialMatches = new Map<string, string[]>();
      potentialMatches.set('userA', ['userB', 'userC', 'userD', 'userE', 'userF']);
      potentialMatches.set('userB', ['userA']);
      potentialMatches.set('userC', ['userA']);
      potentialMatches.set('userD', ['userA']);
      potentialMatches.set('userE', ['userA']);
      potentialMatches.set('userF', ['userA']);

      const finalMatches = new Map<string, string[]>();
      const processedPairs = new Set<string>();

      for (const [userA, userAMatches] of potentialMatches) {
        if (!finalMatches.has(userA)) {
          finalMatches.set(userA, []);
        }

        for (const userB of userAMatches) {
          const pairId = [userA, userB].sort().join('-');

          if (processedPairs.has(pairId)) {
            continue;
          }

          const userBMatches = potentialMatches.get(userB) || [];

          if (userBMatches.includes(userA)) {
            const userAFinal = finalMatches.get(userA)!;
            const userBFinal = finalMatches.get(userB) || [];

            // Apply 3-match limit
            if (userAFinal.length < 3) {
              userAFinal.push(userB);
            }

            if (userBFinal.length < 3) {
              userBFinal.push(userA);
              finalMatches.set(userB, userBFinal);
            }

            processedPairs.add(pairId);
          }
        }
      }

      // UserA should have exactly 3 matches (not 5)
      expect(finalMatches.get('userA')!.length).toBe(3);
      expect(finalMatches.get('userA')!.length).toBeLessThanOrEqual(3);
    });
  });
});
