## Your Workflow for Updating the Algorithm

### Development & Testing Locally

1. **Edit the source of truth:**
   - ✏️ Edit `/backend/src/services/matchingAlgorithm.ts` (ONLY THIS FILE)
2. **Test locally via admin endpoint:**

   ```bash
   # Start your local backend server
   cd backend
   npm run dev

   # Call the admin endpoint to test matching
   curl -X POST http://localhost:3000/api/admin/prompts/2025-W42/generate-matches \
     -H "Content-Type: application/json" \
     -d '{"firebaseUid": "your-test-uid"}'
   ```

3. **Iterate:**
   - Make changes to `/backend/src/services/matchingAlgorithm.ts`
   - Test again via the admin endpoint
   - Repeat until satisfied

### Deploying to Production

4. **Deploy the cloud function:**
   ```bash
   cd backend/functions
   npm run build  # This copies the algorithm file automatically
   firebase deploy --only functions
   ```

That's it! The build script copies your updated algorithm to the functions directory automatically.

---

## Files You'll Edit

### ✅ Always Edit (Source of Truth)

- `/backend/src/services/matchingAlgorithm.ts` - **All algorithm changes go here**

### ⚠️ Sometimes Edit (Infrastructure)

- `/backend/src/services/matchingService.ts` - Only if changing CRUD operations, data fetching, or adding new exported functions
- `/backend/functions/src/services/matchingService.ts` - Only if changing how the cloud function version works differently

### ❌ Never Edit

- `/backend/functions/src/services/matchingAlgorithm.ts` - This is auto-generated, it will be overwritten

---

## When You Need to Redeploy Cloud Functions

### ✅ Yes, redeploy if:

- You changed the matching algorithm (scoring, compatibility logic, etc.)
- You changed the scheduled function behavior
- You changed how matches are created/stored
- You want production to use your new algorithm

### ❌ No redeploy needed if:

- You only changed admin routes/endpoints
- You only changed local backend API behavior
- You're still testing locally

---

## Quick Reference Commands

```bash
# Local development - test algorithm changes
cd backend
npm run dev
# Test via admin endpoint (no deployment needed)

# Deploy to production - make algorithm live
cd backend/functions
npm run build      # Copies algorithm + compiles
firebase deploy --only functions

# Or if you have the script set up:
npm run deploy
```

---

## Pro Tip: Add a Helper Script

Add this to `/backend/package.json`:

```json
{
  "scripts": {
    "test-matching": "curl -X POST http://localhost:3000/api/admin/prompts/$(date +%Y-W%V)/generate-matches -H 'Content-Type: application/json' -d '{\"firebaseUid\":\"test-admin\"}'",
    "deploy-functions": "cd functions && npm run build && firebase deploy --only functions"
  }
}
```

Then your workflow becomes:

```bash
# 1. Edit algorithm
vim src/services/matchingAlgorithm.ts

# 2. Test locally
npm run test-matching

# 3. Deploy when ready
npm run deploy-functions
```
