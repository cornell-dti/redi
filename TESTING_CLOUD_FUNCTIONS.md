# Testing Cloud Functions - Step-by-Step Guide

## Prerequisites

Before testing, ensure you have:

- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project initialized
- Test data in Firestore (users, profiles, preferences)

---

## Method 1: Local Testing with Firebase Emulator (Recommended)

### Step 1: Start the Emulator

```bash
cd backend/functions
npm run serve
```

**Expected Output:**

```
✔  functions: Emulator started at http://127.0.0.1:5001
✔  functions[us-central1-activateWeeklyPrompt]: http function initialized
✔  functions[us-central1-generateWeeklyMatches]: http function initialized
```

### Step 2: Prepare Test Data

You'll need to manually create test data in Firestore. Use the Firebase Console or create a script:

#### A. Create Test Users (3-5 users minimum)

```javascript
// Example users
users: {
  "user1_uid": {
    netid: "abc123",
    email: "abc123@cornell.edu",
    firebaseUid: "user1_uid",
    createdAt: <timestamp>
  },
  "user2_uid": {
    netid: "def456",
    email: "def456@cornell.edu",
    firebaseUid: "user2_uid",
    createdAt: <timestamp>
  }
}
```

#### B. Create Test Profiles

```javascript
// Example profiles
profiles: {
  "profile1": {
    netid: "abc123",
    firstName: "Alice",
    gender: "female",
    birthdate: <date>, // e.g., 20 years old
    year: 2026, // Senior
    school: "College of Arts and Sciences",
    major: ["Computer Science"],
    interests: ["hiking", "reading"],
    clubs: ["Cornell Daily Sun"],
    bio: "Love exploring Ithaca!",
    pictures: [],
    createdAt: <timestamp>,
    updatedAt: <timestamp>
  }
}
```

#### C. Create Test Preferences

```javascript
// Example preferences
preferences: {
  "abc123": {
    netid: "abc123",
    ageRange: { min: 18, max: 25 },
    years: ["Junior", "Senior"],
    schools: [],
    majors: [],
    genders: ["male", "non-binary"],
    createdAt: <timestamp>,
    updatedAt: <timestamp>
  }
}
```

### Step 3: Create a Test Prompt

Using your admin API endpoint or Firebase Console:

```bash
# Create a prompt for this week
curl -X POST http://localhost:3001/api/admin/prompts \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseUid": "YOUR_TEST_ADMIN_UID",
    "promptId": "2025-W42",
    "question": "What is your favorite spot on campus to watch the sunset?",
    "releaseDate": "2025-10-20T04:01:00.000Z",
    "matchDate": "2025-10-24T04:01:00.000Z"
  }'
```

**Expected Response:**

```json
{
  "promptId": "2025-W42",
  "question": "What is your favorite spot on campus to watch the sunset?",
  "releaseDate": "2025-10-20T04:01:00.000Z",
  "matchDate": "2025-10-24T04:01:00.000Z",
  "active": false,
  "createdAt": "2025-10-13T..."
}
```

### Step 4: Test Prompt Activation Function

#### Option A: Using Firebase Functions Shell

```bash
cd backend/functions
npm run shell
```

In the shell:

```javascript
activateWeeklyPrompt();
```

**Expected Output:**

```
Starting weekly prompt activation
Looking for prompt with ID: 2025-W42
Deactivating prompt: 2025-W41
Successfully activated prompt: 2025-W42
Question: What is your favorite spot on campus to watch the sunset?
```

#### Option B: Using Firebase Emulator with Pub/Sub Trigger

```bash
# In a separate terminal
curl -X POST \
  "http://localhost:5001/YOUR_PROJECT_ID/us-central1/activateWeeklyPrompt"
```

### Step 5: Verify Prompt Activation

Check that the prompt is now active:

```bash
curl "http://localhost:3001/api/prompts/active?firebaseUid=YOUR_TEST_USER_UID"
```

**Expected Response:**

```json
{
  "promptId": "2025-W42",
  "question": "What is your favorite spot on campus to watch the sunset?",
  "active": true,
  "releaseDate": "2025-10-20T04:01:00.000Z",
  "matchDate": "2025-10-24T04:01:00.000Z",
  "createdAt": "..."
}
```

### Step 6: Submit Test Answers

Have your test users submit answers:

```bash
# User 1
curl -X POST http://localhost:3001/api/prompts/answers \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseUid": "user1_uid",
    "promptId": "2025-W42",
    "answer": "The slope at sunset is breathtaking!"
  }'

# User 2
curl -X POST http://localhost:3001/api/prompts/answers \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseUid": "user2_uid",
    "promptId": "2025-W42",
    "answer": "Libe Tower roof has the best view!"
  }'

# Repeat for all test users...
```

**Expected Response for each:**

```json
{
  "netid": "abc123",
  "promptId": "2025-W42",
  "answer": "The slope at sunset is breathtaking!",
  "createdAt": "..."
}
```

### Step 7: Verify Answers in Firestore

Check the `weeklyPromptAnswers` collection:

```bash
# Should see documents with IDs like: abc123_2025-W42, def456_2025-W42, etc.
```

### Step 8: Test Match Generation Function

In the Firebase Functions Shell:

```javascript
generateWeeklyMatches();
```

**Expected Output:**

```
Starting weekly match generation
Generating matches for prompt: 2025-W42
Question: What is your favorite spot on campus to watch the sunset?
Found 5 users who answered the prompt
Created 3 matches for user abc123
Created 2 matches for user def456
Created 3 matches for user ghi789
No compatible matches found for user jkl012
Match generation complete. Created matches for 4 users.
```

### Step 9: Verify Matches Were Created

Check matches for a user:

```bash
curl "http://localhost:3001/api/prompts/2025-W42/matches?firebaseUid=user1_uid"
```

**Expected Response:**

```json
{
  "netid": "abc123",
  "promptId": "2025-W42",
  "matches": ["def456", "ghi789", "jkl012"],
  "revealed": [false, false, false],
  "createdAt": "..."
}
```

### Step 10: Test Match Reveal

```bash
curl -X POST http://localhost:3001/api/prompts/2025-W42/matches/reveal \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseUid": "user1_uid",
    "matchIndex": 0
  }'
```

**Expected Response:**

```json
{
  "netid": "abc123",
  "promptId": "2025-W42",
  "matches": ["def456", "ghi789", "jkl012"],
  "revealed": [true, false, false],
  "createdAt": "..."
}
```

---

## Method 2: Production Testing (After Deployment)

### Step 1: Deploy Functions

```bash
cd backend/functions
firebase deploy --only functions
```

**Expected Output:**

```
✔  functions[activateWeeklyPrompt(us-central1)] Successful create operation.
✔  functions[generateWeeklyMatches(us-central1)] Successful create operation.
```

### Step 2: View Function Logs

```bash
# View all function logs
firebase functions:log

# View specific function logs
firebase functions:log --only activateWeeklyPrompt
firebase functions:log --only generateWeeklyMatches
```

### Step 3: Manually Trigger Functions (For Testing)

Since the functions are scheduled, you can manually trigger them for testing:

#### Option A: Using Firebase Console

1. Go to Firebase Console → Functions
2. Find your function
3. Click "Run" or "Test"

#### Option B: Using Firebase CLI

```bash
# Trigger a function manually
firebase functions:shell

# In the shell:
activateWeeklyPrompt()
generateWeeklyMatches()
```

### Step 4: Monitor Scheduled Execution

The functions will automatically run on their schedules:

- **Monday 12:01 AM ET**: `activateWeeklyPrompt`
- **Friday 12:01 AM ET**: `generateWeeklyMatches`

Check logs on Monday/Friday mornings:

```bash
firebase functions:log --since 1h
```

---

## Validation Checklist

### ✅ Prompt Activation (`activateWeeklyPrompt`)

**Success Indicators:**

- [ ] Function executes without errors
- [ ] Target prompt's `active` field is set to `true`
- [ ] All other prompts' `active` fields are set to `false`
- [ ] Logs show: "Successfully activated prompt: [promptId]"
- [ ] You can fetch the active prompt via `/api/prompts/active`

**Common Issues:**

- ❌ "No prompt found for week [promptId]"
  - **Fix**: Create a prompt with `releaseDate` matching today (Monday)
- ❌ "Release date does not match today"
  - **Fix**: Ensure prompt's `releaseDate` is set to today's Monday date
- ❌ Function doesn't run
  - **Fix**: Check function is deployed and scheduled correctly

### ✅ Match Generation (`generateWeeklyMatches`)

**Success Indicators:**

- [ ] Function executes without errors
- [ ] Logs show: "Found [N] users who answered the prompt"
- [ ] Logs show: "Created [N] matches for user [netid]" for each user
- [ ] Logs show: "Match generation complete. Created matches for [N] users"
- [ ] `weeklyMatches` collection has new documents with ID format: `{netid}_{promptId}`
- [ ] Each match document has 3 matches (or fewer if insufficient users)
- [ ] Users can fetch their matches via `/api/prompts/:promptId/matches`

**Common Issues:**

- ❌ "No active prompt found"
  - **Fix**: Run `activateWeeklyPrompt` first or manually activate a prompt
- ❌ "No users to match"
  - **Fix**: Ensure users have submitted answers to the active prompt
- ❌ "Skipping user [netid]: missing profile or preferences"
  - **Fix**: Ensure all users who answered have complete profiles and preferences
- ❌ "No compatible matches found for user [netid]"
  - **Fix**: Check user's preferences aren't too restrictive, or add more test users

---

## Testing the Matching Algorithm

### Test Case 1: Basic Compatibility

**Setup:**

- User A: Female, interested in Male
- User B: Male, interested in Female
- Both have overlapping age ranges and years

**Expected Result:**

- User A's matches should include User B
- User B's matches should include User A

### Test Case 2: Preference Filtering

**Setup:**

- User A: Interested in "Computer Science" majors only
- User B: Major is "Biology"
- User C: Major is "Computer Science"

**Expected Result:**

- User A should match with User C, not User B

### Test Case 3: Mutual Compatibility

**Setup:**

- User A: Female, age 20, interested in Males ages 21-25
- User B: Male, age 19, interested in Females ages 18-22

**Expected Result:**

- User A should NOT match with User B (User B is too young for User A)
- User B SHOULD match with User A (User A fits User B's criteria)
- **Important**: Match is only created if BOTH users are compatible

### Test Case 4: Previous Matches

**Setup:**

- Week 1: User A matched with User B
- Week 2: User A and B both answer new prompt

**Expected Result:**

- User A and User B should NOT be matched together again in Week 2

### Test Case 5: Insufficient Matches

**Setup:**

- Only 2 compatible users answered the prompt

**Expected Result:**

- Each user should receive only 1 match (not the full 3)
- No errors should occur

---

## Debugging Tips

### Check Firestore Data

```bash
# View collection data
firebase firestore:dump weeklyPrompts
firebase firestore:dump weeklyPromptAnswers
firebase firestore:dump weeklyMatches
```

### Enable Verbose Logging

In your functions, add more `console.log` statements:

```typescript
console.log('User data:', JSON.stringify(userData));
console.log('Compatibility check result:', isCompatible);
console.log('Compatibility score:', score);
```

### Test Individual Helper Functions

Create a test file:

```typescript
// test.ts
import { calculateAge, getYearString } from './index';

const testDate = new Date('2003-05-15');
console.log('Age:', calculateAge(testDate)); // Should be ~22

console.log('Year:', getYearString(2026)); // Should be "Senior"
```

### Check Function Execution Time

```bash
firebase functions:log --limit 50
```

Look for execution time in logs. Match generation should complete in:

- < 5 seconds for 100 users
- < 30 seconds for 500 users

---

## Sample Test Script

Create a test script to automate testing:

```bash
#!/bin/bash
# test-functions.sh

echo "🧪 Testing Cloud Functions"

# Step 1: Create prompt
echo "📝 Creating test prompt..."
curl -X POST http://localhost:3001/api/admin/prompts \
  -H "Content-Type: application/json" \
  -d @test-prompt.json

# Step 2: Activate prompt
echo "🔄 Activating prompt..."
# Run function via Firebase shell or API

# Step 3: Submit answers
echo "💬 Submitting test answers..."
for user in user1 user2 user3; do
  curl -X POST http://localhost:3001/api/prompts/answers \
    -H "Content-Type: application/json" \
    -d @"answers/${user}.json"
done

# Step 4: Generate matches
echo "💘 Generating matches..."
# Run function via Firebase shell

# Step 5: Verify matches
echo "✅ Verifying matches..."
for user in user1 user2 user3; do
  curl "http://localhost:3001/api/prompts/2025-W42/matches?firebaseUid=${user}_uid"
done

echo "✨ Testing complete!"
```

---

## Success Criteria Summary

Your Cloud Functions are working correctly if:

1. ✅ **Prompt Activation**
   - Runs every Monday at 12:01 AM ET
   - Activates correct prompt
   - Deactivates old prompts
   - Logs show success

2. ✅ **Match Generation**
   - Runs every Friday at 12:01 AM ET
   - Processes all users who answered
   - Creates appropriate number of matches (up to 3)
   - Respects mutual compatibility
   - Avoids duplicate matches
   - Logs show match counts

3. ✅ **Data Integrity**
   - All matches exist in Firestore
   - Match document structure is correct
   - No orphaned data
   - Timestamps are accurate

4. ✅ **Performance**
   - Functions complete within timeout (9 minutes max)
   - No memory errors
   - Batch operations succeed

---

## Troubleshooting Common Errors

### "Permission Denied"

- **Cause**: Firestore security rules blocking function access
- **Fix**: Cloud Functions use admin SDK which bypasses rules, but ensure service account has proper permissions

### "Index Required"

- **Cause**: Missing Firestore composite index
- **Fix**: Click the link in the error message to create the index, or use `FIRESTORE_INDEXES.md`

### "Deadline Exceeded"

- **Cause**: Function taking too long (timeout)
- **Fix**: Optimize matching algorithm, reduce batch sizes, or increase function timeout

### "Cannot Read Property of Undefined"

- **Cause**: Missing user data (profile or preferences)
- **Fix**: Add null checks and skip users with incomplete data

---

## Next Steps After Testing

Once functions work correctly:

1. **Create Initial Prompts**: Create prompts for the next 4-8 weeks
2. **Set Up Monitoring**: Configure alerts for function failures
3. **Document Process**: Write admin guide for creating weekly prompts
4. **Scale Testing**: Test with larger datasets (100+ users)
5. **Optimize**: Profile performance and optimize bottlenecks

---

**Testing Date**: October 13, 2025
**Status**: Ready for testing
