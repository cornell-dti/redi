# Comprehensive Testing Guide

**Last Updated:** 2025-11-10
**Test Status:** 41/43 integration tests passing (95.3%)

## Quick Reference

```bash
# Integration tests (real Firebase) - RECOMMENDED
npm run test:integration

# Unit tests (mocked Firebase)
npm test

# Single test by name
npm run test:integration -- --testNamePattern="mutual matches"

# Watch mode
npm run test:watch

# Cleanup test data
npm run test:cleanup
```

## Test Suite Overview

### Test Statistics
- **Total Test Files:** 4 integration test suites
- **Total Test Cases:** 43 integration tests
- **Current Pass Rate:** 95.3% (41/43)
- **Runtime:** ~7 minutes (426 seconds)
- **Coverage:** 95%+ for matching/nudging/reveal systems

### Test Suites

| Suite | Tests | Status | Runtime |
|-------|-------|--------|---------|
| **matching.integration.test.ts** | 15 | 13 passing, 2 failing | ~200s |
| **nudging.integration.test.ts** | 11 | 11 passing ✅ | ~45s |
| **reveal.integration.test.ts** | 11 | 10 passing, 1 failing | ~150s |
| **endToEnd.integration.test.ts** | 8 | 7 passing, 1 failing | ~30s |

---

## Current Test Failures (Updated 2025-11-10)

### ❌ Failure 1: "should prioritize users with shared interests"
- **File:** `matching.integration.test.ts:359`
- **Error:** `Cannot read properties of null (reading 'matches')`
- **Root Cause:** Matching algorithm returns null - users with identical interests aren't matching
- **Impact:** Medium - tests specific compatibility scoring edge case
- **Next Steps:** Investigate why high-compatibility users don't get matched

### ❌ Failure 2: "should handle concurrent reveals of different matches"
- **File:** `reveal.integration.test.ts:289`
- **Error:** `expect(revealed.every(r => r === true)).toBe(true)` → Received: false
- **Root Cause:** Not all concurrent reveals are marking matches as revealed
- **Impact:** Low - edge case with concurrent operations
- **Next Steps:** Check for race condition in `revealMatch()` or test timing issue

### ⚠️ Failure 3: TypeScript Compilation Errors
- **File:** `endToEnd.integration.test.ts:393, 406`
- **Error:** Parameter 'r' implicitly has an 'any' type
- **Fix Applied:** Added type annotations `(r: boolean) => r === true`
- **Status:** Fixed, needs retest

---

## Recently Fixed Issues ✅

### Phase 1: Match Index Out of Bounds (2 tests) - FIXED
**Problem:** Tests hardcoded revealing indices 0, 1, 2 assuming all users have exactly 3 matches

**Root Cause:** Matching algorithm creates 1-3 matches based on compatibility (not always 3)

**Solution:**
```typescript
// Before (WRONG):
await revealMatch(netid, promptId, 0);
await revealMatch(netid, promptId, 1);
await revealMatch(netid, promptId, 2); // FAILS if user has <3 matches

// After (CORRECT):
const matches = await getUserMatches(netid, promptId);
for (let i = 0; i < matches.matches.length; i++) {
  await revealMatch(netid, promptId, i);
}
```

**Tests Fixed:**
- "One user reveals all matches before nudging"
- "Match data remains consistent after multiple operations"

### Phase 2 & 3: Multiple Prompts Matching (1 test) - FIXED
**Problem:** Users couldn't match with the same person across different prompts

**Root Cause:** `getPreviousMatchesMap()` included ALL previous matches globally, blocking cross-prompt pairings

**Initial Fix (Phase 2):** WRONG - inverted logic
```typescript
// Phase 2 (WRONG):
if (match.promptId === currentPromptId) {
  return; // Skip current prompt
}
// This kept prompt1 matches when generating prompt2!
```

**Correct Fix (Phase 3):**
```typescript
// Phase 3 (CORRECT):
if (match.promptId !== currentPromptId) {
  return; // Skip OTHER prompts
}
// Now only includes matches from CURRENT prompt
```

**Why This Works:**
- When generating matches for prompt1: previousMatches is empty (no prompt1 history yet)
- When generating matches for prompt2: previousMatches only contains prompt2 matches
- Users from prompt1 can now match again in prompt2 ✅

**Test Fixed:**
- "should allow matching for different prompts"

---

## Test File Details

### 1. `matching.integration.test.ts` (15 tests)

**Purpose:** Verify matching algorithm creates correct, mutual, non-duplicate matches

**Test Categories:**

**Basic Functionality** (5 tests)
- ✅ Creates 1-3 matches per user based on compatibility
- ✅ Uses correct document ID format (`${netid}_${promptId}`)
- ✅ Creates mutual/bidirectional matches (A matches B ↔ B matches A)
- ✅ No duplicate matches within same user
- ✅ Never matches user with themselves

**Match Structure** (2 tests)
- ✅ All required fields present (netid, promptId, matches, revealed, createdAt, expiresAt)
- ✅ expiresAt set to next Friday at midnight

**Edge Cases** (3 tests)
- ✅ Handles odd number of users (7 users → all get matched)
- ✅ Handles small groups (2 users → match each other)
- ✅ Skips users without profiles or preferences

**Duplicate Prevention** (2 tests)
- ✅ Returns 0 when running matching twice for same prompt
- ✅ Allows matching for different prompts (cross-prompt matching)

**Compatibility Scoring** (1 test)
- ❌ Should prioritize users with shared interests (FAILING)

**Performance** (1 test)
- ✅ Handles 100+ users in < 40 seconds

**Key Bugs This Catches:**
- ❌ Non-mutual matches (A matches B but B doesn't match A)
- ❌ Duplicate pairings within same prompt
- ❌ Self-matching
- ❌ Cross-prompt match blocking

---

### 2. `nudging.integration.test.ts` (11 tests) ✅ ALL PASSING

**Purpose:** Verify nudging system correctly handles likes and mutual likes

**Test Categories:**

**Basic Functionality** (4 tests)
- ✅ Creates nudge from user A to user B
- ✅ Detects mutual nudges (A→B and B→A)
- ✅ Unlocks chat ONLY on mutual nudge
- ✅ Only unlocks specific match (not all 3 matches)

**Nudge Status** (1 test)
- ✅ Correctly reports sent/received/mutual status for each match

**Edge Cases** (2 tests)
- ✅ Prevents duplicate nudges (idempotent)
- ✅ Handles users with different match counts (1-3)

**Notifications** (1 test)
- ✅ Creates notification on mutual nudge

**Concurrency** (1 test)
- ✅ Handles concurrent mutual nudges without race conditions

**Manual Matches** (1 test)
- ✅ Works with manually-created matches (not just algorithm-generated)

**Array Index Management** (1 test)
- ✅ Updates correct index in chatUnlocked array

**Key Bugs This Catches:**
- ❌ Chat unlock affecting all matches instead of just one
- ❌ Mutual nudge not detected
- ❌ Incorrect array index in chatUnlocked
- ❌ Missing notifications
- ❌ Race conditions

---

### 3. `reveal.integration.test.ts` (11 tests)

**Purpose:** Verify match reveal system works correctly

**Test Categories:**

**Basic Functionality** (4 tests)
- ✅ Reveals specific match by index (0, 1, or 2)
- ✅ Can reveal all 3 matches independently
- ✅ Revealing doesn't affect other users' matches
- ✅ Idempotent (can reveal same match multiple times)

**Different Match Counts** (1 test)
- ✅ Handles users with 1-2 matches (not always 3)

**Error Handling** (4 tests)
- ✅ Rejects negative indices
- ✅ Rejects indices > 2
- ✅ Returns null for non-existent prompt
- ✅ Throws error when index exceeds actual match count

**Independence** (2 tests)
- ✅ Revealing doesn't unlock chat (only mutual nudge unlocks chat)
- ❌ Can handle concurrent reveals of different matches (FAILING)

**Key Bugs This Catches:**
- ❌ Revealing wrong match index
- ❌ Cross-user contamination
- ❌ Revealing unlocking chat prematurely

---

### 4. `endToEnd.integration.test.ts` (8 tests)

**Purpose:** Verify complete user workflows from start to finish

**Test Categories:**

**Complete Workflow** (1 test)
- ✅ Full 10-step workflow: create users → match → nudge → reveal

**Manual Match Integration** (2 tests)
- ✅ Manual match + algorithm match interaction
- ✅ Manual match + nudging workflow

**Multiple Prompts** (1 test)
- ✅ Users have matches for multiple prompts
- ✅ Nudges in prompt1 don't affect prompt2

**Complex Scenarios** (3 tests)
- ✅ Triangle match pattern (3-way mutual matching)
- ⚠️ Revealing all matches before nudging (TypeScript error)
- ✅ Asymmetric nudging (only some users reciprocate)

**Data Integrity** (1 test)
- ✅ Consistency after multiple operations
- ✅ Array lengths stay synchronized (matches, revealed, chatUnlocked)

**Key Bugs This Catches:**
- ❌ State inconsistencies across operations
- ❌ Cross-prompt contamination
- ❌ Array length mismatches
- ❌ Data corruption during complex workflows

---

## Test Utilities

### `testDataGenerator.ts` Helpers

```typescript
// Create test users with random profiles/preferences
const users = await createTestUsers(10);

// Create test prompt
const prompt = await createTestPrompt();

// Create prompt answers for users
await createTestPromptAnswers(users, prompt.promptId);

// Get user's matches
const matches = await getUserMatches(netid, promptId);

// Get nudge status
const nudge = await getNudge(fromNetid, toNetid, promptId);

// Cleanup all test data
await cleanupTestData();
```

### Test Data Identification

| Type | Prefix | Example |
|------|--------|---------|
| Users | `testuser-` | `testuser-1nt1er` |
| Prompts | `TEST-` | `TEST-2025-W15` |

### Collections Affected
- `users`, `profiles`, `preferences`
- `weeklyPrompts`, `weeklyPromptAnswers`
- `weeklyMatches`, `nudges`, `notifications`

---

## Running Specific Tests

### By File
```bash
npm run test:integration -- matching.integration.test.ts
npm run test:integration -- nudging.integration.test.ts
npm run test:integration -- reveal.integration.test.ts
npm run test:integration -- endToEnd.integration.test.ts
```

### By Test Name
```bash
npm run test:integration -- --testNamePattern="mutual matches"
npm run test:integration -- --testNamePattern="reveal"
npm run test:integration -- --testNamePattern="concurrent"
```

### By Category
```bash
# All matching tests
npm run test:integration -- matching

# All nudging tests
npm run test:integration -- nudging

# Specific describe block
npm run test:integration -- --testNamePattern="Basic Functionality"
```

---

## Common Issues & Debugging

### Issue: Tests Pass Locally But Fail on Another Machine
**Cause:** Different Firebase instances or environment setup
**Solution:**
- Ensure `.env` file is properly configured
- Check Firebase service account credentials
- Verify Firestore database has same data structure

### Issue: "Match index out of bounds"
**Cause:** Test assumes user has 3 matches, but has fewer
**Solution:** Use dynamic loops instead of hardcoded indices (see Phase 1 fix above)

### Issue: Tests Leave Orphaned Data
**Cause:** Test interrupted before cleanup
**Solution:**
```bash
npm run test:cleanup
```

### Issue: Slow Test Execution
**Optimization Tips:**
- Run specific test files instead of full suite
- Use `--testNamePattern` to run single tests
- Increase Jest timeout if tests are timing out

---

## Best Practices

### ✅ DO
- Use `npm run test:integration` for integration tests
- Dynamically handle variable match counts (1-3)
- Clean up test data in `beforeEach()` and `afterEach()`
- Use descriptive test names
- Test both success and failure paths
- Verify mutual operations (A→B and B→A)

### ❌ DON'T
- Run integration tests with `npm test --` (wrong config)
- Hardcode match indices (use loops)
- Assume all users have exactly 3 matches
- Skip cleanup (leaves orphaned data)
- Test implementation details (test behavior)
- Rely on test execution order

---

## Next Steps

### Immediate Priorities
1. ✅ Fix TypeScript errors in endToEnd tests
2. ❌ Debug "shared interests" compatibility test
3. ❌ Fix concurrent reveals race condition
4. 🔄 Run full test suite to verify all fixes

### Future Improvements
- [ ] Migrate to Firebase Emulator for faster tests
- [ ] Add unit tests for service functions
- [ ] Add load testing (1000+ users)
- [ ] Set up CI/CD integration
- [ ] Add performance benchmarking

---

## Resources

- **INVESTIGATION_PROGRESS.md** - Detailed failure analysis and fixes
- **TESTING_README.md** - Quick reference and common issues
- [Jest Documentation](https://jestjs.io/)
- [Firebase Testing Guide](https://firebase.google.com/docs/emulator-suite)

---

**Questions?** Check INVESTIGATION_PROGRESS.md for detailed analysis or review test logs for specific errors.
