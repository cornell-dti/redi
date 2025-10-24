# API Documentation

**Last Updated:** October 22, 2025
**Version:** 2.0 (Secure Bearer Token Authentication)

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Client](#api-client)
4. [User API](#user-api)
5. [Profile API](#profile-api)
6. [Preferences API](#preferences-api)
7. [Prompts API](#prompts-api)
8. [Image API](#image-api)
9. [Error Handling](#error-handling)
10. [Testing](#testing)

---

## Overview

This API uses **Bearer token authentication** with Firebase ID tokens. All requests automatically include the user's Firebase ID token in the `Authorization` header. The backend verifies the token and extracts the authenticated user's identity, ensuring that users can only access their own data.

### Base URL

```typescript
const API_BASE_URL = 'your-api-base-url'; // Set in constants/constants.ts
```

### Security Features

- 🔒 **Automatic token injection** - All API calls include verified Firebase ID tokens
- 🔄 **Automatic token refresh** - Stale tokens are refreshed and retried automatically
- 🛡️ **Server-side authorization** - Backend extracts `uid` from cryptographically signed tokens
- ⚡ **Rate limiting** - Built-in rate limit handling with retry-after support
- 🔐 **Defense in depth** - Input validation, sanitization, and CORS protection

---

## Authentication

### How It Works

1. User signs in with Firebase Auth
2. Frontend obtains Firebase ID token
3. Token is automatically attached to all API requests via `Authorization: Bearer <token>` header
4. Backend verifies token signature and extracts user's `uid`
5. Backend uses extracted `uid` for authorization

### Token Lifecycle

```typescript
// Token is obtained automatically by apiClient
const token = await auth().currentUser.getIdToken();

// Token is refreshed every 45 minutes (app/_layout.tsx)
useEffect(() => {
  const intervalId = setInterval(async () => {
    await auth().currentUser?.getIdToken(true);
  }, 45 * 60 * 1000);
  return () => clearInterval(intervalId);
}, [user]);

// Token is refreshed automatically on 403 errors
// No manual intervention required
```

---

## API Client

The centralized API client (`app/api/apiClient.ts`) handles all HTTP requests with automatic token management.

### Features

| Feature | Description |
|---------|-------------|
| **Automatic Token Injection** | All requests include Firebase ID token |
| **Token Refresh** | 403 errors trigger automatic token refresh and retry |
| **Error Handling** | Standardized error handling for 401, 403, 404, 429, 500 |
| **Rate Limiting** | Extracts `Retry-After` header from 429 responses |
| **Timeout Management** | 30-second default timeout with configurable override |
| **Type Safety** | Full TypeScript support with generic types |

### Usage

```typescript
import { apiClient, APIError } from './api/apiClient';

// GET request
const data = await apiClient.get<ResponseType>('/api/endpoint');

// POST request
const result = await apiClient.post<ResponseType>('/api/endpoint', requestData);

// PUT request
const updated = await apiClient.put<ResponseType>('/api/endpoint', updateData);

// DELETE request
await apiClient.delete('/api/endpoint');

// File upload
const formData = new FormData();
formData.append('file', file);
const response = await apiClient.uploadFiles<UploadResponse>('/api/upload', formData);
```

### Error Handling

```typescript
try {
  const data = await apiClient.get('/api/profiles/me');
} catch (error) {
  if (error instanceof APIError) {
    switch (error.code) {
      case 'AUTH_REQUIRED':
        // User not signed in
        router.push('/login');
        break;
      case 'FORBIDDEN':
        // Insufficient permissions
        Alert.alert('Access Denied');
        break;
      case 'NOT_FOUND':
        // Resource not found
        Alert.alert('Profile not found');
        break;
      case 'RATE_LIMITED':
        // Too many requests
        Alert.alert('Please try again later', error.message);
        break;
      case 'SERVER_ERROR':
        // Server error
        Alert.alert('Server error', 'Please try again later');
        break;
    }
  }
}
```

---

## User API

**File:** `app/api/userApi.ts`

### createUserInBackend

Creates a new user account.

**Signature:**
```typescript
createUserInBackend(email: string): Promise<User>
```

**Authentication:** Required (Bearer token)

**Parameters:**
- `email` (string) - User's email address

**Returns:** Promise<User>

**Example:**
```typescript
const user = await createUserInBackend('user@cornell.edu');
```

---

### loginUserInBackend

Logs in an existing user.

**Signature:**
```typescript
loginUserInBackend(email: string): Promise<User>
```

**Authentication:** Required (Bearer token)

**Parameters:**
- `email` (string) - User's email address

**Returns:** Promise<User>

**Example:**
```typescript
const user = await loginUserInBackend('user@cornell.edu');
```

---

## Profile API

**File:** `app/api/profileApi.ts`

### getCurrentUserProfile

Gets the current user's profile.

**Signature (NEW):**
```typescript
getCurrentUserProfile(): Promise<Profile>
```

**Old Signature (DEPRECATED):**
```typescript
// ❌ REMOVED: getCurrentUserProfile(firebaseUid: string)
```

**Authentication:** Required (Bearer token)

**Backend Behavior:** Extracts `uid` from Bearer token

**Example:**
```typescript
const profile = await getCurrentUserProfile();
```

---

### createProfile

Creates a new profile for the current user.

**Signature (NEW):**
```typescript
createProfile(profileData: Partial<Profile>): Promise<Profile>
```

**Old Signature (DEPRECATED):**
```typescript
// ❌ REMOVED: createProfile(firebaseUid: string, profileData: Partial<Profile>)
```

**Authentication:** Required (Bearer token)

**Parameters:**
- `profileData` (Partial<Profile>) - Profile information

**Example:**
```typescript
const profile = await createProfile({
  displayName: 'John Doe',
  age: 21,
  major: 'Computer Science',
  // ... other fields
});
```

---

### updateProfile

Updates the current user's profile.

**Signature (NEW):**
```typescript
updateProfile(updateData: Partial<Profile>): Promise<Profile>
```

**Old Signature (DEPRECATED):**
```typescript
// ❌ REMOVED: updateProfile(firebaseUid: string, updateData: Partial<Profile>)
```

**Authentication:** Required (Bearer token)

**Parameters:**
- `updateData` (Partial<Profile>) - Fields to update

**Example:**
```typescript
const updated = await updateProfile({
  bio: 'Updated bio',
  interests: ['hiking', 'reading'],
});
```

---

### deleteProfile

Deletes the current user's profile.

**Signature (NEW):**
```typescript
deleteProfile(): Promise<void>
```

**Old Signature (DEPRECATED):**
```typescript
// ❌ REMOVED: deleteProfile(firebaseUid: string)
```

**Authentication:** Required (Bearer token)

**Example:**
```typescript
await deleteProfile();
```

---

### getProfileByNetid

Gets another user's public profile by NetID.

**Signature:**
```typescript
getProfileByNetid(netid: string): Promise<Profile>
```

**Authentication:** Required (Bearer token)

**Parameters:**
- `netid` (string) - Cornell NetID

**Example:**
```typescript
const profile = await getProfileByNetid('abc123');
```

---

### getMatches

Gets matching profiles for the current user.

**Signature (NEW):**
```typescript
getMatches(limit?: number): Promise<Profile[]>
```

**Old Signature (DEPRECATED):**
```typescript
// ❌ REMOVED: getMatches(firebaseUid: string, limit?: number)
```

**Authentication:** Required (Bearer token)

**Parameters:**
- `limit` (number, optional) - Maximum number of matches to return

**Example:**
```typescript
const matches = await getMatches(10);
```

---

### getAllProfiles

Gets all profiles with optional filtering.

**Signature:**
```typescript
getAllProfiles(options?: FilterOptions): Promise<Profile[]>
```

**Authentication:** Required (Bearer token)

**Parameters:**
- `options` (FilterOptions, optional) - Filtering criteria

**Example:**
```typescript
const profiles = await getAllProfiles({
  major: 'Computer Science',
  minAge: 18,
  maxAge: 25,
});
```

---

## Preferences API

**File:** `app/api/preferencesApi.ts`

### getCurrentUserPreferences

Gets the current user's preferences.

**Signature (NEW):**
```typescript
getCurrentUserPreferences(): Promise<Preferences>
```

**Old Signature (DEPRECATED):**
```typescript
// ❌ REMOVED: getCurrentUserPreferences(firebaseUid: string)
```

**Authentication:** Required (Bearer token)

**Example:**
```typescript
const prefs = await getCurrentUserPreferences();
```

---

### updatePreferences

Updates the current user's preferences.

**Signature (NEW):**
```typescript
updatePreferences(updateData: Partial<Preferences>): Promise<Preferences>
```

**Old Signature (DEPRECATED):**
```typescript
// ❌ REMOVED: updatePreferences(firebaseUid: string, updateData: Partial<Preferences>)
```

**Authentication:** Required (Bearer token)

**Parameters:**
- `updateData` (Partial<Preferences>) - Preference fields to update

**Example:**
```typescript
const updated = await updatePreferences({
  ageRange: { min: 21, max: 25 },
  genderPreference: 'any',
});
```

---

### initializePreferences

Initializes default preferences for the current user.

**Signature (NEW):**
```typescript
initializePreferences(): Promise<Preferences>
```

**Old Signature (DEPRECATED):**
```typescript
// ❌ REMOVED: initializePreferences(firebaseUid: string)
```

**Authentication:** Required (Bearer token)

**Example:**
```typescript
const prefs = await initializePreferences();
```

---

## Prompts API

**File:** `app/api/promptsApi.ts`

### getActivePrompt

Gets the currently active prompt.

**Signature (NEW):**
```typescript
getActivePrompt(): Promise<Prompt>
```

**Old Signature (DEPRECATED):**
```typescript
// ❌ REMOVED: getActivePrompt(firebaseUid: string)
```

**Authentication:** Required (Bearer token)

**Example:**
```typescript
const prompt = await getActivePrompt();
```

---

### getPromptById

Gets a specific prompt by ID.

**Signature (NEW):**
```typescript
getPromptById(promptId: string): Promise<Prompt>
```

**Old Signature (DEPRECATED):**
```typescript
// ❌ REMOVED: getPromptById(firebaseUid: string, promptId: string)
```

**Authentication:** Required (Bearer token)

**Parameters:**
- `promptId` (string) - Prompt ID

**Example:**
```typescript
const prompt = await getPromptById('prompt-123');
```

---

### submitPromptAnswer

Submits an answer to a prompt.

**Signature (NEW):**
```typescript
submitPromptAnswer(promptId: string, answer: string): Promise<PromptAnswer>
```

**Old Signature (DEPRECATED):**
```typescript
// ❌ REMOVED: submitPromptAnswer(firebaseUid: string, promptId: string, answer: string)
```

**Authentication:** Required (Bearer token)

**Parameters:**
- `promptId` (string) - Prompt ID
- `answer` (string) - User's answer

**Example:**
```typescript
const answer = await submitPromptAnswer('prompt-123', 'My answer here');
```

---

### getPromptAnswer

Gets the current user's answer to a prompt.

**Signature (NEW):**
```typescript
getPromptAnswer(promptId: string): Promise<PromptAnswer>
```

**Old Signature (DEPRECATED):**
```typescript
// ❌ REMOVED: getPromptAnswer(firebaseUid: string, promptId: string)
```

**Authentication:** Required (Bearer token)

**Parameters:**
- `promptId` (string) - Prompt ID

**Example:**
```typescript
const answer = await getPromptAnswer('prompt-123');
```

---

### getPromptMatches

Gets matches for a specific prompt.

**Signature (NEW):**
```typescript
getPromptMatches(promptId: string): Promise<Match[]>
```

**Old Signature (DEPRECATED):**
```typescript
// ❌ REMOVED: getPromptMatches(firebaseUid: string, promptId: string)
```

**Authentication:** Required (Bearer token)

**Parameters:**
- `promptId` (string) - Prompt ID

**Example:**
```typescript
const matches = await getPromptMatches('prompt-123');
```

---

### getMatchHistory

Gets the current user's match history.

**Signature (NEW):**
```typescript
getMatchHistory(limit?: number): Promise<Match[]>
```

**Old Signature (DEPRECATED):**
```typescript
// ❌ REMOVED: getMatchHistory(firebaseUid: string, limit?: number)
```

**Authentication:** Required (Bearer token)

**Parameters:**
- `limit` (number, optional) - Maximum number of matches to return

**Example:**
```typescript
const history = await getMatchHistory(20);
```

---

### revealMatch

Reveals a match.

**Signature (NEW):**
```typescript
revealMatch(promptId: string, matchIndex: number): Promise<RevealedMatch>
```

**Old Signature (DEPRECATED):**
```typescript
// ❌ REMOVED: revealMatch(firebaseUid: string, promptId: string, matchIndex: number)
```

**Authentication:** Required (Bearer token)

**Parameters:**
- `promptId` (string) - Prompt ID
- `matchIndex` (number) - Index of the match to reveal

**Example:**
```typescript
const revealed = await revealMatch('prompt-123', 0);
```

---

## Image API

**File:** `app/api/imageApi.ts`

All image upload functions use the `apiClient.uploadFiles()` method with automatic Bearer token authentication.

**No changes to function signatures** - already secure.

---

## Error Handling

### Error Codes

| Code | Status | Description | Retry Logic |
|------|--------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | User not authenticated | No retry |
| `UNAUTHORIZED` | 401 | Invalid token | No retry |
| `FORBIDDEN` | 403 | Token expired or insufficient permissions | **Retries once with refreshed token** |
| `NOT_FOUND` | 404 | Resource not found | No retry |
| `CONFLICT` | 409 | Resource already exists | No retry |
| `RATE_LIMITED` | 429 | Too many requests | No retry (includes Retry-After) |
| `SERVER_ERROR` | 500/502/503 | Server error | No retry |
| `TIMEOUT` | 408 | Request timeout | No retry |
| `NETWORK_ERROR` | 0 | Network connection failed | No retry |

### APIError Class

```typescript
class APIError extends Error {
  status: number;  // HTTP status code
  code?: string;   // Error code (e.g., 'AUTH_REQUIRED')

  constructor(message: string, status: number, code?: string);
}
```

---

## Testing

### Running Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

The integration tests cover:

1. ✅ **Token Refresh Flow** - Verifies automatic token refresh on 403 errors
2. ✅ **403 Retry Logic** - Tests retry behavior with fresh tokens
3. ✅ **Rate Limiting** - Validates 429 error handling with Retry-After headers
4. ✅ **Authentication** - Tests 401 error handling
5. ✅ **Error Handling** - Network errors, timeouts, server errors
6. ✅ **HTTP Methods** - GET, POST, PUT, DELETE operations
7. ✅ **File Uploads** - Multipart form-data with Bearer tokens

### Example Test

```typescript
it('should retry once on 403 error', async () => {
  // First request returns 403, second succeeds
  mockFetch
    .mockResolvedValueOnce({ status: 403, ... })
    .mockResolvedValueOnce({ status: 200, ... });

  const result = await apiClient.get('/api/test');

  expect(mockFetch).toHaveBeenCalledTimes(2);
  expect(mockGetIdToken).toHaveBeenCalledWith(true); // Force refresh
});
```

---

## Migration Guide

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed instructions on updating existing code to use the new secure API.

---

## Security Considerations

### What Changed

**Before:**
```typescript
// ❌ INSECURE: Client controls which user's data to access
const profile = await getCurrentUserProfile(user.uid);
```

**After:**
```typescript
// ✅ SECURE: Backend extracts uid from verified token
const profile = await getCurrentUserProfile();
```

### Why This Is More Secure

1. **No client-controlled authorization** - Client cannot specify which user's data to access
2. **Cryptographic verification** - Firebase verifies token signatures before extracting uid
3. **Server-side enforcement** - Backend validates tokens on every request
4. **Defense in depth** - Input validation, rate limiting, and CORS protection

### Best Practices

1. ✅ Always use the `apiClient` for API calls
2. ✅ Handle `APIError` exceptions appropriately
3. ✅ Never store sensitive data in local state
4. ✅ Refresh user session periodically (handled automatically)
5. ✅ Log out users on `AUTH_REQUIRED` errors

---

**For questions or issues, please contact the development team.**
