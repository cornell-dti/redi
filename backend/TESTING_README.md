# Test Suite Documentation

## Overview

This document describes the comprehensive test suite for the reporting and blocking system. The test suite covers backend API endpoints, service layer logic, and includes helpers for mocking Firebase/Firestore operations.

## Test Structure

```
backend/src/
├── __tests__/
│   ├── setup.ts                          # Global test setup and mocks
│   └── helpers/
│       ├── testHelpers.ts                # Authentication and request helpers
│       ├── mockFirestore.ts              # Firestore mocking utilities
│       └── factories.ts                  # Test data factories
├── routes/__tests__/
│   ├── reports.test.ts                   # Reports API tests
│   ├── admin-reports.test.ts             # Admin reports API tests
│   └── profiles-blocking.test.ts         # Blocking API tests
└── services/__tests__/
    ├── reportsService.test.ts            # Reports service tests
    └── blockingService.test.ts           # Blocking service tests
```

## Running Tests

### All Tests

```bash
cd backend
npm test
```

### Watch Mode (for development)

```bash
npm run test:watch
```

### With Coverage

```bash
npm run test:coverage
```

### Specific Test File

```bash
npm test -- reports.test.ts
```

### Specific Test Suite

```bash
npm test -- --testNamePattern="POST /api/reports"
```

## Test Coverage

### Reports API (`routes/__tests__/reports.test.ts`)

**Coverage:** POST /api/reports

Test Cases:

- ✅ Authentication required
- ✅ Invalid token format rejection
- ✅ reportedNetid validation
- ✅ Reason validation (must be valid enum)
- ✅ Description length validation (10-1000 chars)
- ✅ Self-reporting prevention
- ✅ Successful report creation
- ✅ All required fields set correctly
- ✅ Spam prevention (3 reports per 24 hours)
- ✅ 4th report blocked within 24 hours
- ✅ Reported user not found error
- ✅ Reporter user not found error
- ✅ Firestore error handling

### Admin Reports API (`routes/__tests__/admin-reports.test.ts`)

**Coverage:**

- GET /api/admin/reports
- GET /api/admin/reports/:reportId
- PATCH /api/admin/reports/:reportId/status
- PATCH /api/admin/reports/:reportId/resolve

Test Cases:

- ✅ Authentication required
- ✅ Admin authorization required
- ✅ Get all reports with profile info
- ✅ Filter reports by status
- ✅ Sort reports by createdAt desc
- ✅ Invalid status filter rejection
- ✅ Get single report by ID
- ✅ Report not found (404)
- ✅ Update report status (under_review, dismissed)
- ✅ Status validation
- ✅ Audit log creation
- ✅ Resolve report with notes
- ✅ Resolution validation

### Blocking API (`routes/__tests__/profiles-blocking.test.ts`)

**Coverage:**

- POST /api/profiles/:netid/block
- DELETE /api/profiles/:netid/block
- GET /api/profiles/:netid/blocked

Test Cases:

- ✅ Authentication required
- ✅ blockedNetid validation
- ✅ Self-blocking prevention
- ✅ Blocked user not found error
- ✅ Block creation
- ✅ Idempotent blocking
- ✅ Unblock user
- ✅ Unblock non-existent block (404)
- ✅ Get blocked users list
- ✅ Authorization (users can only view own list)
- ✅ Admin can view any blocked list
- ✅ Empty blocked list

### Reports Service (`services/__tests__/reportsService.test.ts`)

**Functions Tested:**

- `createReport()`
- `getReportById()`
- `getAllReports()`
- `updateReportStatus()`
- `getReportsWithProfiles()`
- `reportToResponse()`
- `reportToResponseWithProfiles()`

Test Cases:

- ✅ Create report with all required fields
- ✅ Return report data and document ID
- ✅ Set status to pending
- ✅ Set timestamps
- ✅ Spam prevention enforcement
- ✅ Self-reporting prevention
- ✅ Description length validation
- ✅ Get report by ID
- ✅ Return null for non-existent report
- ✅ Get all reports with ordering
- ✅ Filter reports by status
- ✅ Update report status
- ✅ Set reviewedBy and reviewedAt
- ✅ Set resolution notes
- ✅ Include user profiles in responses
- ✅ Convert to response formats

### Blocking Service (`services/__tests__/blockingService.test.ts`)

**Functions Tested:**

- `blockUser()`
- `unblockUser()`
- `getBlockedUsers()`
- `isUserBlocked()`
- `areUsersBlocked()`
- `getBlockedUsersMap()`
- `blockedUserToResponse()`

Test Cases:

- ✅ Create block record
- ✅ Idempotent blocking (error on duplicate)
- ✅ Self-blocking prevention
- ✅ Remove block record
- ✅ Handle non-existent block
- ✅ Get list of blocked users
- ✅ Empty blocked list
- ✅ Check if user is blocked (true/false)
- ✅ Check bidirectional blocks
- ✅ Handle mutual blocks
- ✅ Get blocked users map for matching
- ✅ Handle empty netids array
- ✅ Initialize empty sets for no blocks
- ✅ Batch processing for >10 netids
- ✅ Convert to response format

## Test Helpers

### Authentication Helpers (`helpers/testHelpers.ts`)

```typescript
// Mock Firebase auth for regular users
mockFirebaseAuth({ uid: 'user-uid', email: 'user@cornell.edu' });

// Mock Firebase auth for admin users
mockFirebaseAdminAuth({ uid: 'admin-uid', email: 'admin@cornell.edu' });

// Create auth headers
createAuthHeader('user');
createAuthHeader('admin');

// Authenticated requests
authenticatedGet(app, '/api/reports', 'user');
authenticatedPost(app, '/api/reports', body, 'user');
authenticatedPatch(app, '/api/reports/123', body, 'admin');
authenticatedDelete(app, '/api/blocks/123', 'user');

// Unauthenticated requests
unauthenticatedGet(app, '/api/reports');
unauthenticatedPost(app, '/api/reports', body);
```

### Firestore Mocking (`helpers/mockFirestore.ts`)

```typescript
// Create mock document snapshot
createMockDocSnapshot('doc-id', { data: 'value' });

// Create mock query snapshot
createMockQuerySnapshot([
  { id: 'doc-1', data: { field: 'value1' } },
  { id: 'doc-2', data: { field: 'value2' } },
]);

// Create mock collection
const mockCollection = createMockCollection();
mockCollection.where.mockReturnThis();
mockCollection.get.mockResolvedValue(snapshot);
```

### Test Data Factories (`helpers/factories.ts`)

```typescript
// Create mock users
createMockUser({ netid: 'jd123', email: 'jd123@cornell.edu' });

// Create mock profiles
createMockProfile({ netid: 'jd123', firstName: 'John' });

// Create mock reports
createMockReport({ reason: 'harassment', status: 'pending' });

// Create multiple mock reports
createMockReports(5);

// Create mock blocks
createMockBlock({ blockerNetid: 'user1', blockedNetid: 'user2' });

// Create mock admin
createMockAdmin({ uid: 'admin-uid' });
```

## Writing New Tests

### 1. Basic Test Structure

```typescript
import { db } from '../../../firebaseAdmin';
import { createMockCollection } from '../../__tests__/helpers/mockFirestore';
import { mockFirebaseAuth } from '../../__tests__/helpers/testHelpers';

describe('Feature Name', () => {
  let mockCollection: any;

  beforeEach(() => {
    mockCollection = createMockCollection();
    (db.collection as jest.Mock).mockReturnValue(mockCollection);
  });

  it('should do something', async () => {
    // Setup mocks
    mockFirebaseAuth({ uid: 'test-uid' });

    // Execute test
    const result = await yourFunction();

    // Assert
    expect(result).toBeDefined();
  });
});
```

### 2. Testing API Endpoints

```typescript
import {
  createTestApp,
  authenticatedPost,
} from '../../__tests__/helpers/testHelpers';
import router from '../your-route';

const app = createTestApp(router);

it('should handle POST request', async () => {
  mockFirebaseAuth({ uid: 'user-uid' });

  const response = await authenticatedPost(app, '/api/endpoint', {
    field: 'value',
  });

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
});
```

### 3. Testing Service Functions

```typescript
import { yourServiceFunction } from '../yourService';
import { createMockDocSnapshot } from '../../__tests__/helpers/mockFirestore';

it('should process data correctly', async () => {
  mockCollection.doc.mockReturnThis();
  mockCollection.get.mockResolvedValue(
    createMockDocSnapshot('doc-id', { data: 'value' })
  );

  const result = await yourServiceFunction('doc-id');

  expect(result).toMatchObject({ data: 'value' });
});
```

## Testing Best Practices

### 1. Isolation

- Each test should be independent
- Use `beforeEach()` to reset mocks
- Don't rely on test execution order

### 2. Mock Setup

- Always mock Firebase Admin SDK
- Mock Firestore collections and documents
- Use factories for consistent test data

### 3. Assertions

- Test both success and failure paths
- Verify error messages
- Check that mocks were called correctly

### 4. Coverage

- Aim for >80% code coverage
- Test edge cases (empty data, max length, etc.)
- Test error handling

### 5. Naming

- Use descriptive test names
- Follow pattern: "should [expected behavior] when [condition]"
- Group related tests with `describe()`

## Common Testing Patterns

### Testing Authentication

```typescript
describe('Authentication', () => {
  it('should require authentication', async () => {
    const response = await unauthenticatedPost(app, '/api/endpoint', {});
    expect(response.status).toBe(401);
  });

  it('should require admin access', async () => {
    mockFirebaseAuth({ uid: 'user-uid', admin: false });
    const response = await authenticatedGet(
      app,
      '/api/admin/endpoint',
      'admin'
    );
    expect(response.status).toBe(403);
  });
});
```

### Testing Validation

```typescript
describe('Validation', () => {
  it('should validate required field', async () => {
    const response = await authenticatedPost(app, '/api/endpoint', {
      // missing required field
    });
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/required/i);
  });
});
```

### Testing Database Operations

```typescript
it('should create document in Firestore', async () => {
  mockCollection.add.mockResolvedValue({
    id: 'new-doc-id',
    get: jest
      .fn()
      .mockResolvedValue(createMockDocSnapshot('new-doc-id', mockData)),
  });

  const result = await createFunction(data);

  expect(mockCollection.add).toHaveBeenCalledWith(
    expect.objectContaining({ field: 'value' })
  );
});
```

## Troubleshooting

### Tests Failing with "Cannot find module"

- Ensure all imports use correct paths
- Check that `tsconfig.json` is configured correctly
- Run `npm install` to install dependencies

### Mocks Not Working

- Check that mocks are set up in `setup.ts`
- Ensure `jest.clearAllMocks()` is called in `beforeEach()`
- Verify mock return values match expected types

### Timeout Errors

- Increase timeout in `jest.config.js` (default: 10000ms)
- Check for missing `await` keywords
- Ensure all Promises are resolved

### Firebase Admin Errors

- Verify Firebase Admin is mocked in `setup.ts`
- Check that `admin.auth()` is mocked correctly
- Ensure Firestore methods return Promises

## Next Steps

### TODO: Frontend Tests

- [ ] Create frontend API client tests (`frontend/app/api/__tests__/reportsApi.test.ts`)
- [ ] Create blocking API client tests (`frontend/app/api/__tests__/blockingApi.test.ts`)

### TODO: Integration Tests

- [ ] Set up Firebase Emulator Suite
- [ ] Create integration test for complete report flow
- [ ] Create integration test for complete blocking flow
- [ ] Test multi-user scenarios

### TODO: Security Rules Tests

- [ ] Test reports security rules
- [ ] Test blocks security rules
- [ ] Test conversations security rules with blocking

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Firebase Testing Guide](https://firebase.google.com/docs/rules/unit-tests)
- [Testing Best Practices](https://testingjavascript.com/)
