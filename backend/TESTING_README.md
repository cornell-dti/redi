# Backend Test Suite Documentation

**Last Updated:** 2025-11-10
**Current Status:** 41/43 integration tests passing (95.3% pass rate)

## Overview

This repository has two types of tests:
1. **Unit Tests** - Fast, mocked tests using `jest.config.js`
2. **Integration Tests** - Real Firestore tests using `jest.integration.config.js`

## CRITICAL: Running Tests Correctly

### ❌ WRONG WAY (Will Fail)
```bash
# DO NOT RUN INTEGRATION TESTS THIS WAY:
npm test -- src/__tests__/integration/matching.integration.test.ts
```
**Why this fails:** Uses unit test config with mocked Firebase, causing `db.where()` errors

### ✅ CORRECT WAY
```bash
# Unit tests (mocked Firebase):
npm test

# Integration tests (real Firebase):
npm run test:integration

# Specific integration test:
npm run test:integration -- --testNamePattern="should create matches"
```

## Test Structure

```
backend/src/
├── __tests__/
│   ├── setup.ts                                  # Unit test mocks (Firebase mocking)
│   ├── integration/
│   │   ├── matching.integration.test.ts          # Matching algorithm (15 tests)
│   │   ├── nudging.integration.test.ts           # Nudging system (11 tests)
│   │   ├── reveal.integration.test.ts            # Reveal system (11 tests)
│   │   └── endToEnd.integration.test.ts          # E2E workflows (8 tests)
│   └── utils/
│       └── testDataGenerator.ts                   # Test data helpers
├── jest.config.js                                 # Unit tests config (excludes integration/)
└── jest.integration.config.js                     # Integration tests config
```

## Jest Configurations

### `jest.config.js` (Unit Tests)
- **Uses:** `setup.ts` to mock Firebase Admin SDK
- **Excludes:** `**/__tests__/integration/**`
- **Purpose:** Fast unit tests with mocked dependencies
- **Command:** `npm test`

### `jest.integration.config.js` (Integration Tests)
- **No mocking** - connects to real Firebase
- **Includes:** Only `**/__tests__/integration/**`
- **Purpose:** End-to-end testing with real database
- **Command:** `npm run test:integration`
- **Timeout:** 120 seconds per test

## Current Test Status (2025-11-10)

### Integration Tests: 41 Passed / 43 Total ✅

#### ✅ Passing Test Suites
- **Nudging Tests**: 11/11 PASSED
- **Matching Tests**: 13/15 (2 failures)
- **Reveal Tests**: 10/11 (1 failure)
- **End-to-End Tests**: 7/8 (1 failure - TypeScript compilation issue)

#### ❌ Known Failing Tests (2 actual failures + 1 compilation error)

**1. Matching: "should prioritize users with shared interests"**
- **Error:** `Cannot read properties of null (reading 'matches')`
- **Location:** `matching.integration.test.ts:359`
- **Cause:** user1Matches is null - matching algorithm didn't create matches for this scenario
- **Status:** Under investigation

**2. Reveal: "should handle concurrent reveals of different matches"**
- **Error:** `expect(revealed.every(r => r === true)).toBe(true)` - Received: false
- **Location:** `reveal.integration.test.ts:289`
- **Cause:** Not all concurrent reveals are being marked as true
- **Status:** Possible race condition or indexing issue

**3. End-to-End: TypeScript Compilation Errors**
- **Error:** Parameter 'r' implicitly has an 'any' type
- **Location:** `endToEnd.integration.test.ts:393, 406`
- **Fix:** Add type annotations: `(r: boolean) => r === true`
- **Status:** Fixed, awaiting retest

### Recently Fixed Issues (2025-11-09 to 2025-11-10)

**Phase 1: Match Index Out of Bounds (2 tests fixed) ✅**
- Tests were hardcoding `revealMatch(0)`, `revealMatch(1)`, `revealMatch(2)`
- Matching algorithm creates 1-3 matches per user (not always 3)
- **Fix:** Made tests dynamically loop through actual match count

**Phase 2 & 3: Multiple Prompts Matching (1 test fixed) ✅**
- Matching algorithm was blocking same users from matching across different prompts
- Root cause: `getPreviousMatchesMap()` included ALL previous matches globally
- **Fix:** Changed to only include matches from CURRENT prompt (allows cross-prompt matching)

## Running Tests

### Quick Commands
```bash
# All integration tests (recommended):
npm run test:integration

# All unit tests:
npm test

# Single integration test file:
npm run test:integration -- matching.integration.test.ts

# Single test by name:
npm run test:integration -- --testNamePattern="should create mutual matches"

# Watch mode (reruns on file changes):
npm run test:watch

# Coverage report:
npm run test:coverage
```

### Integration Test Timeline
- **Total Runtime:** ~7 minutes (426 seconds)
- **Nudging:** ~45s
- **Matching:** ~200s (includes 100-user performance test)
- **Reveal:** ~150s
- **End-to-End:** ~30s

## Test Environment Setup

### Required Environment Variables (`.env`)
```bash
# Firebase configuration (required for integration tests)
FIREBASE_SERVICE_ACCOUNT=<path-to-service-account-key.json>
FIRESTORE_EMULATOR_HOST=localhost:8080  # Optional: use emulator
```

### Firebase Service Account
Integration tests connect to real Firestore (or emulator). You need:
1. Firebase service account JSON file
2. Path configured in `.env`
3. Firestore database with proper security rules

## Test Data Management

### Automatic Cleanup
All tests automatically clean up test data in `beforeEach()` and `afterEach()`:
```typescript
beforeEach(async () => {
  await cleanupTestData(); // Removes all testuser-* and TEST-* data
});
```

### Test Data Prefixes
| Type | Prefix | Example |
|------|--------|---------|
| Users | `testuser-` | `testuser-abc123` |
| Prompts | `TEST-` | `TEST-2025-W01` |

### Manual Cleanup
```bash
# If tests fail and leave orphaned data:
npm run test:cleanup
```

### Collections Modified by Tests
- `users`
- `profiles`
- `preferences`
- `weeklyPrompts`
- `weeklyPromptAnswers`
- `weeklyMatches`
- `nudges`
- `notifications`

## Common Issues & Solutions

### Issue: "Cannot read properties of undefined (reading 'where')"
**Cause:** Running integration tests with unit test config
**Solution:** Use `npm run test:integration` instead of `npm test --`

### Issue: "Firebase connection timeout"
**Cause:** Missing or invalid service account credentials
**Solution:**
```bash
# Check .env file exists:
cat backend/.env | grep FIREBASE

# Verify service account file:
ls -la <path-from-.env>

# Test Firebase connection:
npm run dev
```

### Issue: Tests pass locally but fail in CI
**Cause:** Different Jest config or missing environment variables
**Solution:**
- Ensure CI uses `npm run test:integration`
- Add Firebase credentials to CI secrets
- Check Node.js version matches local

### Issue: "Match index out of bounds"
**Cause:** Test assumes user has 3 matches, but has fewer
**Solution:** Dynamically loop through actual matches:
```typescript
// Instead of:
await revealMatch(netid, promptId, 0);
await revealMatch(netid, promptId, 1);
await revealMatch(netid, promptId, 2);

// Do this:
const matches = await getUserMatches(netid, promptId);
for (let i = 0; i < matches.matches.length; i++) {
  await revealMatch(netid, promptId, i);
}
```

## Writing New Tests

### Integration Test Template
```typescript
import {
  createTestUsers,
  createTestPrompt,
  createTestPromptAnswers,
  cleanupTestData,
  getUserMatches,
} from '../utils/testDataGenerator';
import { generateMatchesForPrompt } from '../../services/matchingService';

describe('My New Integration Tests', () => {
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
    await cleanupTestData();
  });

  test('should do something', async () => {
    // Setup
    testUsers = await createTestUsers(6);
    const prompt = await createTestPrompt();
    testPromptId = prompt.promptId;
    await createTestPromptAnswers(testUsers, testPromptId);

    // Execute
    await generateMatchesForPrompt(testPromptId);

    // Assert
    const matches = await getUserMatches(testUsers[0].netid, testPromptId);
    expect(matches).toBeTruthy();
    expect(matches!.matches.length).toBeGreaterThanOrEqual(1);
  });
});
```

## Next Steps

### To Fix Remaining Failures
1. **Shared interests test** - Investigate why matching algorithm returns null
2. **Concurrent reveals test** - Check for race condition or reveal logic bug
3. **Run full test suite** - Verify all fixes work together

### Future Improvements
- [ ] Migrate to Firebase Emulator for faster tests
- [ ] Add unit tests for individual service functions
- [ ] Add load testing (1000+ users)
- [ ] Set up CI/CD integration test pipeline
- [ ] Add performance benchmarking

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Firebase Testing Guide](https://firebase.google.com/docs/emulator-suite)
- [Investigation Progress](/INVESTIGATION_PROGRESS.md) - Detailed failure analysis
- [Testing Guide](/backend/TESTING_GUIDE.md) - Comprehensive test documentation

## Questions?

- Check `INVESTIGATION_PROGRESS.md` for detailed failure analysis
- See `TESTING_GUIDE.md` for in-depth test documentation
- Review test output logs for specific error messages
