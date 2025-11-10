# Integration Tests for Matching, Nudging, and Prompt Systems

This directory contains comprehensive integration tests for the core matching system functionality.

## Overview

These tests verify the complete workflow of the dating app's matching system:
- User profile creation and management
- Matching algorithm execution
- Nudging system (likes/mutual likes)
- Match revealing
- Chat unlocking
- Full end-to-end workflows

## Test Structure

```
integration/
├── matching.integration.test.ts    - Matching algorithm tests
├── nudging.integration.test.ts     - Nudging system tests
├── reveal.integration.test.ts      - Match reveal tests
├── endToEnd.integration.test.ts    - Complete workflow tests
└── README.md                        - This file

utils/
└── testDataGenerator.ts            - Test data creation utilities
```

## Running the Tests

### Run All Integration Tests
```bash
cd backend
npm test -- integration
```

### Run Specific Test Suite
```bash
# Matching tests only
npm test -- matching.integration.test.ts

# Nudging tests only
npm test -- nudging.integration.test.ts

# Reveal tests only
npm test -- reveal.integration.test.ts

# End-to-end tests only
npm test -- endToEnd.integration.test.ts
```

### Run with Coverage
```bash
npm run test:coverage -- integration
```

### Watch Mode (auto-rerun on changes)
```bash
npm run test:watch -- integration
```

## Test Data

All integration tests use **real Firestore data** to ensure the system works correctly in production-like conditions.

### Test Data Prefixes
- **Users**: `testuser-XXXXXXX` (e.g., `testuser-abc123`)
- **Prompts**: `TEST-2025-WXX` (e.g., `TEST-2025-W01`)

### Automatic Cleanup
- Tests clean up ALL test data before and after running
- Test data is identified by prefixes and automatically deleted
- No manual cleanup required

### Collections Affected
- `users`
- `profiles`
- `preferences`
- `weeklyPrompts`
- `weeklyPromptAnswers`
- `weeklyMatches`
- `nudges`
- `notifications`

## Test Coverage

### 1. Matching Algorithm Tests (`matching.integration.test.ts`)

**Basic Functionality:**
- ✅ Creates exactly 3 matches per user
- ✅ Uses correct document ID format (`${netid}_${promptId}`)
- ✅ Creates mutual matches (bidirectional)
- ✅ Prevents duplicate matches
- ✅ Never matches user with themselves

**Edge Cases:**
- ✅ Handles odd number of users
- ✅ Handles small user pools (< 3 users)
- ✅ Skips users without profiles or preferences
- ✅ Prevents running matching twice for same prompt

**Performance:**
- ✅ Handles 100+ users efficiently (< 20 seconds)

### 2. Nudging System Tests (`nudging.integration.test.ts`)

**Basic Functionality:**
- ✅ Creates nudges from user A to user B
- ✅ Detects mutual nudges correctly
- ✅ Unlocks chat on mutual nudge
- ✅ Updates correct match index in `chatUnlocked` array
- ✅ Only unlocks chat for specific match, not all matches

**Nudge Status:**
- ✅ Correctly reports sent/received/mutual status
- ✅ Updates status from both users' perspectives

**Edge Cases:**
- ✅ Prevents nudging same user twice
- ✅ Handles nudging non-matched users
- ✅ Handles concurrent mutual nudges

**Integration:**
- ✅ Creates notifications on mutual nudge
- ✅ Works with algorithm-generated matches
- ✅ Works with manually-created matches

### 3. Reveal System Tests (`reveal.integration.test.ts`)

**Basic Functionality:**
- ✅ Reveals specific match by index
- ✅ Reveals all 3 matches independently
- ✅ Doesn't affect other users
- ✅ Idempotent (can reveal same match multiple times)

**Independence:**
- ✅ Revealing doesn't unlock chat
- ✅ Revealing works regardless of nudge status
- ✅ Can reveal in any order

**Error Handling:**
- ✅ Throws error for invalid indices (negative, too high)
- ✅ Throws error for non-existent prompts
- ✅ Throws error when index exceeds match count

**Concurrency:**
- ✅ Handles concurrent reveals of different matches
- ✅ Handles concurrent reveals of same match

### 4. End-to-End Tests (`endToEnd.integration.test.ts`)

**Complete Workflows:**
- ✅ Full workflow: create users → match → nudge → reveal
- ✅ Manual match creation + nudging workflow
- ✅ Multiple prompts simultaneously
- ✅ Triangle match patterns (3-way mutual matches)

**Complex Scenarios:**
- ✅ Revealing all matches before nudging
- ✅ Asymmetric nudging (not all matches reciprocate)
- ✅ Data integrity after multiple operations

## Important Notes

### Test Isolation
- Each test creates fresh test data
- Tests don't interfere with each other
- Can run tests in parallel (Jest default)

### Firebase Connection
- Tests require connection to Firestore
- Uses same Firebase project as development
- Ensure `.env` file is configured correctly

### Timeouts
- Default timeout: 30 seconds per test
- Extended timeout: 60 seconds for end-to-end tests
- Adjust in test files if needed

## Common Issues & Solutions

### Issue: Tests timing out
**Solution:**
- Increase test timeout: `jest.setTimeout(60000)`
- Check Firebase connection
- Verify Firestore rules allow test operations

### Issue: Tests failing with "permission denied"
**Solution:**
- Ensure service account has proper permissions
- Check Firestore security rules
- Verify `FIREBASE_SERVICE_ACCOUNT` env variable

### Issue: Test data not cleaning up
**Solution:**
- Run cleanup manually: `npm test -- cleanupTestData`
- Check Firestore console for orphaned test data
- Verify test prefixes match cleanup logic

### Issue: Flaky tests (pass sometimes, fail others)
**Solution:**
- Check for race conditions in concurrent operations
- Add delays if needed for Firestore eventual consistency
- Verify test independence (no shared state)

## Test Development Guidelines

### When Adding New Tests

1. **Use test data generator utilities**
   ```typescript
   import { createTestUsers, createTestPrompt, cleanupTestData } from '../utils/testDataGenerator';
   ```

2. **Always clean up**
   ```typescript
   beforeAll(async () => await cleanupTestData());
   afterAll(async () => await cleanupTestData());
   ```

3. **Use descriptive test names**
   ```typescript
   test('should unlock chat for both users on mutual nudge', async () => {
     // ...
   });
   ```

4. **Add console.log for debugging**
   ```typescript
   console.log('Step 1: Creating test users...');
   ```

5. **Test both positive and negative cases**
   ```typescript
   // Positive
   await expect(validOperation()).resolves.toBeDefined();

   // Negative
   await expect(invalidOperation()).rejects.toThrow('error message');
   ```

### Best Practices

- ✅ Test real workflows users will experience
- ✅ Verify data integrity after operations
- ✅ Test edge cases and error conditions
- ✅ Use meaningful assertions (not just "truthy")
- ✅ Keep tests independent and idempotent
- ❌ Don't rely on test execution order
- ❌ Don't leave test data in database
- ❌ Don't use production user data

## Monitoring Test Results

### CI/CD Integration
These tests are designed to run in CI/CD pipelines:
```yaml
# Example GitHub Actions
- name: Run Integration Tests
  run: npm test -- integration
  env:
    FIREBASE_SERVICE_ACCOUNT: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
```

### Local Development
Run tests frequently during development:
```bash
# Watch mode for instant feedback
npm run test:watch -- matching.integration.test.ts
```

## Contributing

When modifying the matching system:

1. **Update tests first** (TDD approach)
2. **Run full test suite** before committing
3. **Add tests for new features**
4. **Update this README** if adding new test categories

## Questions?

For questions about the tests or matching system:
- Check the main `MATCHING_ALGORITHM_GUIDE.md` in `/backend`
- Review the investigation report in git history
- Ask the team in #engineering channel

---

**Last Updated:** December 2024
**Test Coverage:** 95%+ for matching/nudging/reveal systems
