# 🎯 Matching Algorithm Development Guide

> **The Complete Guide to Understanding, Testing, and Deploying the REDI Matching Algorithm**

---

## 📑 Table of Contents

1. [📋 Overview](#-overview)
2. [📁 File Structure](#-file-structure)
3. [🔄 Development Workflow](#-development-workflow)
4. [🧪 Testing Guide](#-testing-guide)
5. [🚀 Deployment Guide](#-deployment-guide)
6. [⚙️ How the Build System Works](#️-how-the-build-system-works)
7. [🐛 Common Issues & Troubleshooting](#-common-issues--troubleshooting)
8. [📊 Quick Reference](#-quick-reference)
9. [🎯 Best Practices](#-best-practices)
10. [📚 Understanding the Matching Algorithm](#-understanding-the-matching-algorithm)
11. [❓ Questions?](#-questions)

---

## 📋 Overview

### What is the Matching Algorithm?

The REDI matching algorithm is a compatibility-based system that pairs users each week based on:

- **Mutual preferences** (age, gender, year, school, major)
- **Compatibility scoring** (shared interests, clubs, academic proximity)
- **Historical data** (prevents repeat matches)

### Architecture: The Shared File Challenge

Firebase Cloud Functions can **only deploy files from the `/backend/functions/` directory**. However, our matching algorithm logic is used in both:

- **Backend API** (`/backend/src/services/`) - For testing and development
- **Cloud Functions** (`/backend/functions/src/services/`) - For production deployment

**The Solution:** Automated file copying during build!

```
┌─────────────────────────────────────────────────────────────┐
│  Development Flow                                           │
└─────────────────────────────────────────────────────────────┘

1️⃣  EDIT SOURCE FILES                    📝 Source of Truth
    /backend/src/services/matchingAlgorithm.ts
    /backend/types.ts

2️⃣  RUN BUILD                              🔨 Copy + Compile
    npm run build
    └─> Copies files to /backend/functions/
    └─> Compiles TypeScript to JavaScript

3️⃣  DEPLOY TO FIREBASE                    🚀 Production
    firebase deploy --only functions
    └─> Deploys compiled functions
```

### Key Principles

✅ **Single Source of Truth**: Always edit files in `/backend/src/`
✅ **Automated Copying**: Build scripts handle file synchronization
✅ **Git Ignored**: Copied files never committed
✅ **Type Safety**: Shared types ensure consistency

---

## 📁 File Structure

```
backend/
├── src/
│   ├── services/
│   │   ├── matchingAlgorithm.ts          ✅ EDIT HERE: Algorithm source of truth
│   │   └── matchingService.ts            ⚠️  EDIT: Backend CRUD/API operations only
│   ├── types.ts                          ✅ EDIT HERE: Type definitions source of truth
│   └── index.ts                          Main backend server
│
├── functions/                            🔥 Firebase Cloud Functions
│   ├── src/
│   │   ├── services/
│   │   │   ├── matchingAlgorithm.ts      ❌ NEVER EDIT: Auto-copied during build
│   │   │   └── matchingService.ts        ⚠️  EDIT: Cloud function-specific logic only
│   │   ├── types.ts                      ❌ NEVER EDIT: Auto-copied during build
│   │   └── index.ts                      Cloud function exports
│   │
│   ├── lib/                              📦 Compiled JavaScript output
│   │   ├── index.js
│   │   ├── types.js
│   │   └── services/
│   │       ├── matchingAlgorithm.js
│   │       └── matchingService.js
│   │
│   ├── package.json                      📝 Build scripts + dependencies
│   ├── tsconfig.json                     ⚙️  TypeScript configuration (rootDir: "src")
│   └── .gitignore                        🚫 Ignores: src/types.ts, src/services/matchingAlgorithm.ts
│
├── scripts/                              🔧 Helper utilities
│   ├── list-emails.ts                    Email management
│   └── upload-emails.ts
│
├── package.json                          Main backend scripts
└── types.ts                              ✅ EDIT HERE: Master type definitions
```

### Color Legend

| Icon | Meaning                                                      |
| ---- | ------------------------------------------------------------ |
| ✅   | **EDIT HERE** - Source of truth, make changes here           |
| ❌   | **NEVER EDIT** - Auto-generated, changes will be overwritten |
| ⚠️   | **CONDITIONAL** - Edit only for specific purposes            |
| 📝   | Configuration file                                           |
| 🔥   | Firebase-related                                             |
| 📦   | Build output                                                 |

---

## 🔄 Development Workflow

### One-Time Setup

```bash
# 1. Install dependencies for main backend
cd backend
npm install

# 2. Install dependencies for cloud functions
cd functions
npm install
cd ..

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your Firebase credentials

# 4. Start local development server (optional)
npm run dev
```

### Making Algorithm Changes

#### Step 1: Edit Source Files ✏️

```bash
# Open the source of truth files
code src/services/matchingAlgorithm.ts
code types.ts
```

**Example Change:** Increase points for shared interests

```typescript
// In matchingAlgorithm.ts, line ~188
// OLD: score += Math.min(20, interestOverlap * 4);
// NEW: score += Math.min(20, interestOverlap * 5);  // More weight!
```

#### Step 2: Test Locally (Manual) 🧪

> **Note:** Automated test scripts are coming soon! For now, test manually:

```bash
# Option A: Use Firebase Emulators
cd functions
npm run serve
# Then trigger functions via REST API or Firebase Console

# Option B: Test with backend dev server
cd ..
npm run dev
# Call matching service endpoints
```

**Manual Testing Checklist:**

- [ ] Create test users in Firestore
- [ ] Add preferences for test users
- [ ] Create a test prompt (e.g., "TEST-W01")
- [ ] Add answers from test users to the prompt
- [ ] Trigger match generation
- [ ] Verify matches in Firestore `weeklyMatches` collection

#### Step 3: Verify Type Safety ✓

```bash
# Check for TypeScript errors in main backend
npm run build

# Check for TypeScript errors in functions
cd functions
npm run build
cd ..
```

💡 **Tip:** If the build succeeds in both places, your changes are type-safe!

---

## 🧪 Testing Guide

### Current Testing Approach (Manual)

Since automated test scripts are not yet implemented, follow this manual testing workflow:

#### 1. Set Up Test Data

You can create test data either via **curl commands** (faster) or manually in Firestore Console.

##### Option A: Using curl Commands (Recommended)

```bash
# Set your backend URL (adjust for your environment)
BACKEND_URL="http://localhost:3001"
ADMIN_UID="JPc53Ry1kJO52nW0t8ZB8898vuB3"

# Step 1: Create test profiles
curl -X POST "http://localhost:3001/api/profiles" \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseUid": "test-user-jane-123",
    "netid": "jd123",
    "firstName": "Jane",
    "bio": "CS major who loves hiking and coding!",
    "gender": "female",
    "birthdate": "2002-05-15T00:00:00.000Z",
    "year": 2026,
    "school": "College of Engineering",
    "major": ["Computer Science"],
    "interests": ["hiking", "coding", "music"],
    "clubs": ["CUAppDev", "Hiking Club"],
    "pictures": []
  }'

curl -X POST "$BACKEND_URL/api/profiles" \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseUid": "test-user-john-456",
    "netid": "js456",
    "firstName": "John",
    "bio": "Engineering student, gamer, and outdoor enthusiast.",
    "gender": "male",
    "birthdate": "2003-08-20T00:00:00.000Z",
    "year": 2026,
    "school": "College of Engineering",
    "major": ["Computer Science"],
    "interests": ["hiking", "gaming", "music"],
    "clubs": ["CUAppDev"],
    "pictures": []
  }'

# Step 2: Update preferences (auto-created with profiles, but customize here)
curl -X PUT "$BACKEND_URL/api/preferences" \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseUid": "test-user-jane-123",
    "ageRange": { "min": 18, "max": 25 },
    "years": ["Freshman", "Sophomore", "Junior", "Senior"],
    "schools": [],
    "majors": [],
    "genders": ["male"]
  }'

curl -X PUT "$BACKEND_URL/api/preferences" \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseUid": "test-user-john-456",
    "ageRange": { "min": 18, "max": 25 },
    "years": ["Freshman", "Sophomore", "Junior", "Senior"],
    "schools": [],
    "majors": [],
    "genders": ["female"]
  }'

# Step 3: Create test prompt (requires admin)
curl -X POST "$BACKEND_URL/api/admin/prompts" \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseUid": "'$ADMIN_UID'",
    "promptId": "TEST-W01",
    "question": "What'\''s your favorite way to spend a weekend?",
    "releaseDate": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'",
    "matchDate": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'"
  }'

# Step 4: Add prompt answers (requires prompts API endpoint)

# User 1: JEA3El8jvvPPBjPE80tyq4iUhi83
curl -X POST http://localhost:3001/api/prompts/answers \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseUid": "JEA3El8jvvPPBjPE80tyq4iUhi83",
    "promptId": "TEST-W01",
    "answer": "I love hiking in the mountains and exploring new trails with friends."
  }'

# User 2: Awogz2HfvHcRpq9Wo34asJbbCWE3
curl -X POST http://localhost:3001/api/prompts/answers \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseUid": "Awogz2HfvHcRpq9Wo34asJbbCWE3",
    "promptId": "TEST-W01",
    "answer": "Reading books at a cozy cafe and catching up on my favorite shows."
  }'

# User 3: DnlD6l9BZhNfpU6lXdGBctWsW6D3
curl -X POST http://localhost:3001/api/prompts/answers \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseUid": "DnlD6l9BZhNfpU6lXdGBctWsW6D3",
    "promptId": "TEST-W01",
    "answer": "Playing basketball with my team and working on side projects."
  }'

# User 4: QmTGIZ03N1geMVrVeLQMMkq8jB93
curl -X POST http://localhost:3001/api/prompts/answers \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseUid": "QmTGIZ03N1geMVrVeLQMMkq8jB93",
    "promptId": "TEST-W01",
    "answer": "Cooking new recipes and hosting dinner parties for friends."
  }'

# User 5: idPSvkUCIxggxeGRKFNr8FOudg42
curl -X POST http://localhost:3001/api/prompts/answers \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseUid": "idPSvkUCIxggxeGRKFNr8FOudg42",
    "promptId": "TEST-W01",
    "answer": "Going to concerts and discovering new music at local venues."
  }'

# User 6: kpVRoIbeDtNh2qSnZIRPoCgQ2Px1
curl -X POST http://localhost:3001/api/prompts/answers \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseUid": "kpVRoIbeDtNh2qSnZIRPoCgQ2Px1",
    "promptId": "TEST-W01",
    "answer": "Volunteering at the animal shelter and spending time with my dog."
  }'

# User 7: oSjqcNHxolQ4fXFMzhZZr3JYvvC3
curl -X POST http://localhost:3001/api/prompts/answers \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseUid": "oSjqcNHxolQ4fXFMzhZZr3JYvvC3",
    "promptId": "TEST-W01",
    "answer": "Practicing photography and editing photos from my weekend adventures."
  }'

# User 8: pt8txPOKRmcfUpL7v47OzuN09Mn1
curl -X POST http://localhost:3001/api/prompts/answers \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseUid": "pt8txPOKRmcfUpL7v47OzuN09Mn1",
    "promptId": "TEST-W01",
    "answer": "Gaming with online friends and attending esports tournaments."
  }'

# See "Option B" below for manual creation
```

💡 **Tip:** Save these commands in a script file (`scripts/setup-test-data.sh`) for easy reuse!

##### Option B: Using Firestore Console (Manual)

If curl commands fail or you prefer manual setup:

**Create Test Users in 'profiles' collection:**

```javascript
// User 1: jd123
{
  netid: "jd123",
  firstName: "Jane",
  bio: "CS major who loves hiking and coding!",
  gender: "female",
  birthdate: Timestamp(2002-05-15),
  year: 2026,
  school: "College of Engineering",
  major: ["Computer Science"],
  interests: ["hiking", "coding", "music"],
  clubs: ["CUAppDev", "Hiking Club"],
  pictures: [],
  createdAt: Timestamp(now),
  updatedAt: Timestamp(now)
}

// User 2: js456
{
  netid: "js456",
  firstName: "John",
  bio: "Engineering student, gamer, and outdoor enthusiast.",
  gender: "male",
  birthdate: Timestamp(2003-08-20),
  year: 2026,
  school: "College of Engineering",
  major: ["Computer Science"],
  interests: ["hiking", "gaming", "music"],
  clubs: ["CUAppDev"],
  pictures: [],
  createdAt: Timestamp(now),
  updatedAt: Timestamp(now)
}
```

**Create Preferences in 'preferences' collection:**

```javascript
// Document ID: jd123
{
  netid: "jd123",
  ageRange: { min: 18, max: 25 },
  years: ["Freshman", "Sophomore", "Junior", "Senior"],
  schools: [],  // Empty = all schools
  majors: [],   // Empty = all majors
  genders: ["male"],
  createdAt: Timestamp(now),
  updatedAt: Timestamp(now)
}

// Document ID: js456
{
  netid: "js456",
  ageRange: { min: 18, max: 25 },
  years: ["Freshman", "Sophomore", "Junior", "Senior"],
  schools: [],
  majors: [],
  genders: ["female"],
  createdAt: Timestamp(now),
  updatedAt: Timestamp(now)
}
```

**Create Test Prompt in 'weeklyPrompts' collection:**

```javascript
// Document with promptId as field
{
  promptId: "TEST-W01",
  question: "What's your favorite way to spend a weekend?",
  releaseDate: Timestamp(now),
  matchDate: Timestamp(now),
  active: true,
  createdAt: Timestamp(now)
}
```

**Add Test Answers in 'weeklyPromptAnswers' collection:**

```javascript
// Document ID: jd123_TEST-W01
{
  netid: "jd123",
  promptId: "TEST-W01",
  answer: "I love hiking in the gorges and listening to music!",
  createdAt: Timestamp(now)
}

// Document ID: js456_TEST-W01
{
  netid: "js456",
  promptId: "TEST-W01",
  answer: "Gaming with friends and exploring nature trails.",
  createdAt: Timestamp(now)
}
```

#### 2. Trigger Match Generation

##### Option A: Via Backend API (Recommended for Testing)

```bash
# Trigger match generation for TEST-W01 prompt
BACKEND_URL="http://localhost:3001"
ADMIN_UID="JPc53Ry1kJO52nW0t8ZB8898vuB3"

curl -X POST "$BACKEND_URL/api/admin/prompts/TEST-W01/generate-matches" \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseUid": "'$ADMIN_UID'"
  }'
```

curl -X POST "http://localhost:3001/api/admin/prompts/TEST-W01/generate-matches" \
 -H "Content-Type: application/json" \
 -d '{
"firebaseUid": "JPc53Ry1kJO52nW0t8ZB8898vuB3"
}'

**Expected Response:**

```json
{
  "message": "Match generation completed",
  "promptId": "TEST-W01",
  "matchedCount": 2
}
```

##### Option B: Via Firebase Console (Production)

1. Go to Firebase Console → Functions
2. Find the `generateMatches` function
3. Test with payload: `{ "promptId": "TEST-W01" }`

##### Option C: Via Cloud Function URL (if deployed)

```bash
curl -X POST https://your-region-project-id.cloudfunctions.net/generateMatches \
  -H "Content-Type: application/json" \
  -d '{"promptId": "TEST-W01"}'
```

#### 3. Verify Results

**Check Firestore:**

1. Go to `weeklyMatches` collection
2. Look for documents: `jd123_TEST-W01` and `js456_TEST-W01`
3. Verify the `matches` array contains expected netids

**Expected Result:**

```javascript
// Document: jd123_TEST-W01
{
  netid: "jd123",
  promptId: "TEST-W01",
  matches: ["js456"],  // Should include John if compatible
  revealed: [false],
  createdAt: Timestamp(now)
}
```

#### 4. Debugging Match Scores

To understand why users matched (or didn't), check the function logs:

```bash
cd functions
npm run logs
```

Look for compatibility score calculations in the output.

### 🚧 Coming Soon: Automated Test Scripts

Future test scripts will include:

- `npm run setup-test-prompt` - Creates TEST-W01 with test users
- `npm run test-matching` - Runs matching algorithm on TEST-W01
- `npm run check-algorithm-sync` - Verifies source and copy are identical

---

## 🚀 Deployment Guide

### Pre-Deployment Checklist

Before deploying to production, verify:

- [ ] Algorithm changes tested manually in Firestore
- [ ] TypeScript compiles without errors (`npm run build` in both directories)
- [ ] Import paths are correct (using `../types`)
- [ ] No sensitive data or console.logs in production code
- [ ] Git committed your source changes (but not copied files!)

### Deploying to Production

#### Option 1: From `/backend/functions` (Recommended)

```bash
cd backend/functions
npm run deploy
```

**What happens automatically:**

1. `predeploy` hook runs → executes `npm run build`
2. `copy-shared` script copies:
   - `../src/services/matchingAlgorithm.ts` → `./src/services/matchingAlgorithm.ts`
   - `../types.ts` → `./src/types.ts`
3. TypeScript compiler (`tsc`) compiles to JavaScript in `lib/`
4. Firebase CLI deploys all functions from `lib/`

#### Option 2: Manual Build + Deploy

```bash
cd backend/functions

# Step 1: Build
npm run build

# Step 2: Verify compilation succeeded
ls lib/  # Should see index.js, types.js, services/

# Step 3: Deploy
firebase deploy --only functions
```

#### Deploying Specific Functions Only

```bash
# Deploy only the generateMatches function
firebase deploy --only functions:generateMatches

# Deploy multiple specific functions
firebase deploy --only functions:generateMatches,functions:getWeeklyMatches
```

### Verifying Deployment

#### 1. Check Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Functions**
4. Verify the deployment timestamp is recent
5. Check that functions are in "Ready" state (green)

#### 2. Check Function Logs

```bash
cd backend/functions
npm run logs

# Or filter by function name
firebase functions:log --only generateMatches

# Follow logs in real-time
firebase functions:log --only generateMatches --follow
```

#### 3. Test in Production

Project Console: https://console.firebase.google.com/project/redi-1c25e/overview

https://us-central1-redi-1c25e.cloudfunctions.net/generateWeeklyMatches

Trigger a test match generation:

```bash
# Call your production cloud function
curl -X POST https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/generateWeeklyMatches \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  -d '{"promptId": "TEST-W01"}'
```

⚠️ **Warning:** Always test with `TEST-W01` or test prompts, not production prompts!

### Rollback Instructions

If something goes wrong after deployment:

#### Option 1: Revert Code Changes

```bash
# Find the commit hash before your changes
git log --oneline

# Revert to previous commit
git revert HEAD

# Redeploy
cd functions
npm run deploy
```

#### Option 2: Rollback via Firebase Console

1. Go to Firebase Console → Functions
2. Click on the function name
3. Go to "Version History" tab
4. Select a previous version and click "Rollback"

💡 **Tip:** Firebase keeps multiple versions. You can roll back to any previous deployment within the retention period.

---

## ⚙️ How the Build System Works

### The Copy-Shared Script

Located in `/backend/functions/package.json`:

```json
{
  "scripts": {
    "copy-shared": "cp ../src/services/matchingAlgorithm.ts ./src/services/matchingAlgorithm.ts && cp ../types.ts ./src/types.ts",
    "build": "npm run copy-shared && tsc",
    "predeploy": "npm run build"
  }
}
```

#### Step-by-Step Execution

When you run `npm run deploy`:

```
1. predeploy hook triggers
   └─> Runs: npm run build

2. npm run build executes
   └─> First: npm run copy-shared
       ├─> cp ../src/services/matchingAlgorithm.ts ./src/services/matchingAlgorithm.ts
       └─> cp ../types.ts ./src/types.ts
   └─> Then: tsc (TypeScript compiler)
       └─> Compiles src/ → lib/

3. firebase deploy continues
   └─> Uploads lib/ directory to Firebase
```

### Why Import Paths Work

The algorithm file uses `import { ... } from '../types'`:

```typescript
// /backend/src/services/matchingAlgorithm.ts
import { ProfileDoc, PreferencesDoc, Year } from '../types';
//                                                   ^^^^^^^^
//                                              Relative path!
```

**Resolution from different locations:**

| Location                                               | Import Path | Resolves To                          |
| ------------------------------------------------------ | ----------- | ------------------------------------ |
| `/backend/src/services/matchingAlgorithm.ts`           | `../types`  | `/backend/src/types.ts` ✅           |
| `/backend/functions/src/services/matchingAlgorithm.ts` | `../types`  | `/backend/functions/src/types.ts` ✅ |

Both resolve correctly because **both `types.ts` files exist** after copying!

### TypeScript Configuration

**Key setting in `/backend/functions/tsconfig.json`:**

```json
{
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "lib"
    // ... other options
  },
  "include": ["src"]
}
```

- `"rootDir": "src"` - Treats `src/` as the root, so output is flat
- `"outDir": "lib"` - Compiled JavaScript goes to `lib/`
- Result: `src/index.ts` → `lib/index.js` (not `lib/src/index.js`)

### Git Ignore Configuration

**In `/backend/functions/.gitignore`:**

```gitignore
# Copied shared files (source of truth is in /backend/)
src/services/matchingAlgorithm.ts
src/types.ts
```

**Why?**

- These files are auto-generated during build
- Source of truth is in `/backend/src/`
- Committing copies would cause sync issues
- Git status will show them as "Ignored"

### Verification Commands

```bash
# Verify files are being copied correctly
cd backend/functions
npm run copy-shared
ls -la src/services/matchingAlgorithm.ts  # Should exist
ls -la src/types.ts  # Should exist

# Verify TypeScript compilation
npm run build
ls -la lib/services/matchingAlgorithm.js  # Should exist after build
ls -la lib/types.js  # Should exist after build

# Verify git ignores copied files
git status
# Should NOT show src/services/matchingAlgorithm.ts or src/types.ts as modified
```

---

## 🐛 Common Issues & Troubleshooting

### Issue 1: Files Out of Sync

**Problem:** Local tests work, but deployed function uses old algorithm

**Symptoms:**

- Changes not reflected in production
- Old compatibility scores appearing
- Expected matches not generated

**Solution:**

```bash
# Step 1: Verify source file was edited
cat backend/src/services/matchingAlgorithm.ts | grep "your change"

# Step 2: Rebuild functions
cd backend/functions
npm run build

# Step 3: Verify copied file has changes
cat src/services/matchingAlgorithm.ts | grep "your change"

# Step 4: Redeploy
npm run deploy

# Step 5: Check deployment logs
npm run logs
```

### Issue 2: TypeScript Compilation Errors

**Problem:** `npm run build` fails with type errors

**Symptoms:**

```
error TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'
```

**Solution:**

```bash
# Step 1: Check which file has the error
# The error message will show the file path

# Step 2: If error is in copied file, edit the SOURCE
# ❌ DON'T: Edit /backend/functions/src/services/matchingAlgorithm.ts
# ✅ DO: Edit /backend/src/services/matchingAlgorithm.ts

# Step 3: Fix type mismatches
# Common fixes:
# - Add missing type imports
# - Update type definitions in types.ts
# - Add type assertions where needed

# Step 4: Test in both locations
cd backend
npm run build  # Should succeed

cd functions
npm run build  # Should succeed
```

### Issue 3: Import Resolution Errors

**Problem:** `Cannot find module '../types'`

**Symptoms:**

```
error TS2307: Cannot find module '../types' or its corresponding type declarations
```

**Solution:**

```bash
# Step 1: Verify types.ts was copied
cd backend/functions
ls -la src/types.ts

# If missing:
npm run copy-shared

# Step 2: Verify import path uses relative path
cat src/services/matchingAlgorithm.ts | grep "from '../types'"
# Should show: import { ... } from '../types'

# Step 3: Clean and rebuild
rm -rf lib/
npm run build
```

### Issue 4: No Users Found Who Answered Prompt

**Problem:** Match generation returns 0 matches

**Symptoms:**

- Function logs show: "Found 0 users who answered the prompt"
- No matches created in Firestore

**Solution:**

```bash
# Step 1: Verify prompt exists in Firestore
# Check 'weeklyPrompts' collection for your promptId

# Step 2: Verify users answered the prompt
# Check 'weeklyPromptAnswers' collection
# Document IDs should be: {netid}_{promptId}

# Step 3: For TEST-W01, manually create test data
# Use the Firestore Console to create:
# - Test users in 'profiles'
# - Test preferences in 'preferences'
# - Test answers in 'weeklyPromptAnswers'
```

### Issue 5: Changes Not Reflecting After Deployment

**Problem:** Deployed function still uses old code

**Symptoms:**

- New logs not appearing
- Old behavior persisting
- Deployment succeeded but code unchanged

**Checklist:**

```bash
# ✓ Did you run `npm run deploy`?
cd backend/functions && npm run deploy

# ✓ Did the build succeed?
# Check for errors in deploy output

# ✓ Is the deployment recent?
# Check Firebase Console → Functions → deployment timestamp

# ✓ Are you calling the right function?
# Verify function URL and endpoint

# ✓ Are you caching results?
# Clear any caching layers

# ✓ Did you wait for cold start?
# First call after deploy takes longer
```

### Issue 6: rootDir TypeScript Error

**Problem:** `File '/path/types.ts' is not under 'rootDir'`

**Symptoms:**

```
error TS6059: File is not under 'rootDir' /backend/functions/src
```

**Solution:**

This means `types.ts` is outside the `src/` directory. Verify:

```bash
cd backend/functions

# Check tsconfig.json has rootDir
cat tsconfig.json | grep rootDir
# Should show: "rootDir": "src"

# Check types.ts is in src/
ls -la src/types.ts  # Should exist

# If types.ts is in wrong location:
rm types.ts  # Remove from root if it exists
npm run copy-shared  # Recopy to correct location
```

---

## 📊 Quick Reference

### Essential Commands

| Task                 | Command                                                                       | Run From                   | Notes                       |
| -------------------- | ----------------------------------------------------------------------------- | -------------------------- | --------------------------- |
| **Development**      |
| Edit algorithm       | `code src/services/matchingAlgorithm.ts`                                      | `/backend`                 | ✅ Source of truth          |
| Edit types           | `code types.ts`                                                               | `/backend`                 | ✅ Source of truth          |
| Start dev server     | `npm run dev`                                                                 | `/backend`                 | For local backend testing   |
| **Building**         |
| Copy shared files    | `npm run copy-shared`                                                         | `/backend/functions`       | Manual file sync            |
| Build functions      | `npm run build`                                                               | `/backend/functions`       | Copy + compile              |
| Watch mode           | `npm run build:watch`                                                         | `/backend/functions`       | Auto-recompile on changes   |
| **Testing**          |
| _Create test prompt_ | _Coming soon_                                                                 | `/backend`                 | 🚧 Script TBD               |
| _Test matching_      | _Coming soon_                                                                 | `/backend`                 | 🚧 Script TBD               |
| Manual test          | Use Firestore Console                                                         | Firebase Console           | Create test data manually   |
| Check TypeScript     | `npm run build`                                                               | `/backend` or `/functions` | Verify no errors            |
| **Deployment**       |
| Deploy all functions | `npm run deploy`                                                              | `/backend/functions`       | Auto-builds first           |
| Deploy specific      | `firebase deploy --only functions:funcName`                                   | `/backend/functions`       | Single function             |
| View logs            | `npm run logs`                                                                | `/backend/functions`       | Real-time logs              |
| Follow logs          | `firebase functions:log --follow`                                             | `/backend/functions`       | Stream logs live            |
| **Debugging**        |
| Check sync           | `diff ../src/services/matchingAlgorithm.ts src/services/matchingAlgorithm.ts` | `/backend/functions`       | Compare source vs copy      |
| Clean build          | `rm -rf lib && npm run build`                                                 | `/backend/functions`       | Fresh compilation           |
| Git status           | `git status`                                                                  | `/backend`                 | Verify copied files ignored |
| List functions       | `firebase functions:list`                                                     | `/backend/functions`       | See all deployed functions  |

---

## 🎯 Best Practices

### ✅ DO

- ✅ **Always edit source files** in `/backend/src/` and `/backend/types.ts`
- ✅ **Test locally** before deploying (manual Firestore testing for now)
- ✅ **Build before deploying** - The predeploy hook does this, but verify
- ✅ **Check logs after deployment** - Catch errors early
- ✅ **Use TEST-W01 for testing** - Never test on production prompts
- ✅ **Commit source changes** - But not copied files
- ✅ **Document algorithm changes** - Add comments explaining scoring changes
- ✅ **Run TypeScript checks** - Use `npm run build` to catch type errors
- ✅ **Review diffs before deploying** - Make sure you're deploying what you think
- ✅ **Keep types in sync** - Update `/backend/types.ts` when changing data structures

### ❌ DON'T

- ❌ **Don't edit copied files** in `/backend/functions/src/services/matchingAlgorithm.ts` or `/functions/src/types.ts`
- ❌ **Don't commit ignored files** - They're auto-generated
- ❌ **Don't skip testing** - Even manual testing is better than none
- ❌ **Don't deploy without building** - Though predeploy prevents this
- ❌ **Don't test on production data** - Use TEST-W01 or dedicated test prompts
- ❌ **Don't change import paths** - Keep using `../types` pattern
- ❌ **Don't remove predeploy hook** - It ensures consistency
- ❌ **Don't manually copy files** - Use `npm run copy-shared` script
- ❌ **Don't modify .gitignore for copied files** - They should stay ignored
- ❌ **Don't assume deployment worked** - Always verify via logs

### 💡 Pro Tips

1. **Use version control branches** for major algorithm changes
2. **Document scoring changes** with comments and git commit messages
3. **Monitor function execution time** - Keep functions under 60s timeout
4. **Log compatibility scores during development** - Helps debug matching logic
5. **Keep test data realistic** - Use Cornell-specific schools, majors, interests
6. **Review Firebase costs** - Function executions and Firestore reads add up
7. **Set up alerts** - Monitor function errors in Firebase Console

---

## 📚 Understanding the Matching Algorithm

### How Matching Works

The algorithm operates in several phases:

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 1: Fetch Users                                       │
│  Get all users who answered this week's prompt              │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 2: Load Data                                         │
│  Fetch profiles and preferences for all users               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 3: Check Previous Matches                            │
│  Prevent matching users who've matched before               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 4: Compatibility Filtering                           │
│  For each user pair, check mutual compatibility:            │
│  • Gender preferences                                        │
│  • Age range preferences                                     │
│  • Year preferences                                          │
│  • School preferences                                        │
│  • Major preferences                                         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 5: Compatibility Scoring                             │
│  Calculate 0-100 score for compatible pairs                 │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 6: Select Top Matches                                │
│  Sort by score, return top 3 for each user                  │
└─────────────────────────────────────────────────────────────┘
```

### Compatibility Scoring Breakdown

The algorithm assigns points (0-100 scale) based on:

| Factor               | Max Points | Calculation                                     |
| -------------------- | ---------- | ----------------------------------------------- |
| **School Match**     | 20         | Same school? +20 points                         |
| **Major Overlap**    | 15         | +5 points per shared major (max 15)             |
| **Year Proximity**   | 15         | 15 points for same year, -3 per year difference |
| **Age Proximity**    | 15         | 15 points for same age, -2 per year difference  |
| **Interest Overlap** | 20         | +4 points per shared interest (max 20)          |
| **Club Overlap**     | 15         | +5 points per shared club (max 15)              |
| **Total**            | **100**    | Sum of all factors                              |

### Example Match Calculation

Let's walk through a real example:

```typescript
User A: Jane (jd123)
├─ School: College of Engineering
├─ Major: [Computer Science]
├─ Year: 2026 (Sophomore)
├─ Age: 20
├─ Interests: [hiking, coding, music, reading]
└─ Clubs: [CUAppDev, Hiking Club]

User B: John (js456)
├─ School: College of Engineering           ← Same school
├─ Major: [Computer Science, Mathematics]   ← CS overlaps
├─ Year: 2027 (Junior)                      ← 1 year apart
├─ Age: 21                                  ← 1 year age difference
├─ Interests: [hiking, gaming, music]       ← 2 shared: hiking, music
└─ Clubs: [CUAppDev]                        ← 1 shared: CUAppDev
```

**Score Calculation:**

```
School Match:        +20 points (Engineering = Engineering)
Major Overlap:       +5 points  (1 shared major: CS)
Year Proximity:      +12 points (15 - |2026-2027| * 3 = 15 - 3)
Age Proximity:       +13 points (15 - |20-21| * 2 = 15 - 2)
Interest Overlap:    +8 points  (2 shared * 4 = 8)
Club Overlap:        +5 points  (1 shared * 5 = 5)
────────────────────────────────────────────
Total Score:         63 / 100
```

**Interpretation:**

- **0-30:** Poor match
- **31-50:** Weak match
- **51-70:** Good match ✅ (Jane & John)
- **71-85:** Great match
- **86-100:** Excellent match

### Mutual Compatibility

⚠️ **Important:** Before scoring, users must be **mutually compatible**.

Both users must satisfy each other's preferences:

```typescript
// User A's preferences applied to User B's profile
✓ User B's gender is in User A's preferred genders
✓ User B's age is in User A's preferred age range
✓ User B's year is in User A's preferred years
✓ User B's school is in User A's preferred schools (or empty = all)
✓ User B's major is in User A's preferred majors (or empty = all)

AND

// User B's preferences applied to User A's profile
✓ User A's gender is in User B's preferred genders
✓ User A's age is in User B's preferred age range
✓ User A's year is in User B's preferred years
✓ User A's school is in User B's preferred schools (or empty = all)
✓ User A's major is in User B's preferred majors (or empty = all)
```

If **either** check fails → **No match**, regardless of compatibility score.

### Code Reference

All matching logic lives in:

**`/backend/src/services/matchingAlgorithm.ts`**

Key functions:

- `findMatchesForUser()` - Main entry point (line ~30)
- `checkMutualCompatibility()` - Verifies both users match preferences (line ~85)
- `checkCompatibility()` - Checks one user's preferences against a profile (line ~106)
- `calculateCompatibilityScore()` - Computes 0-100 score (line ~158)

---

## ❓ Questions?

### Getting Help

- **Firebase Functions Issues:** Check [Firebase Documentation](https://firebase.google.com/docs/functions)
- **TypeScript Errors:** See [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- **Algorithm Logic:** Review `/backend/src/services/matchingAlgorithm.ts` with inline comments
- **Build System:** Reference this guide's [How the Build System Works](#️-how-the-build-system-works) section

---

**Last Updated:** 2025-10-14
**Version:** 1.0.0
**Maintained By:** Juju
