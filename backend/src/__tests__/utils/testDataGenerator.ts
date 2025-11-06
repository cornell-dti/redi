/**
 * Test Data Generator Utilities
 *
 * Helper functions for creating and managing test data for integration tests.
 * All test data uses special prefixes (TEST-) to be easily identifiable and cleanable.
 */

import { db } from '../../../firebaseAdmin';
import {
  ProfileDoc,
  PreferencesDoc,
  WeeklyPromptDoc,
  Gender,
  School,
  Year,
} from '../../../types';
import { FieldValue } from 'firebase-admin/firestore';

// Test data prefixes for easy identification and cleanup
export const TEST_PREFIX = 'TEST-';
export const TEST_USER_PREFIX = 'testuser-';
export const TEST_PROMPT_PREFIX = 'TEST-2025-W';

/**
 * Interface for test user data
 */
export interface TestUser {
  netid: string;
  firebaseUid: string;
  email: string;
  profile: ProfileDoc;
  preferences: PreferencesDoc;
}

/**
 * Generate a random test netid
 */
export function generateTestNetid(): string {
  return `${TEST_USER_PREFIX}${Math.random().toString(36).substring(7)}`;
}

/**
 * Generate a random test promptId
 */
export function generateTestPromptId(): string {
  const weekNum = Math.floor(Math.random() * 52) + 1;
  return `${TEST_PROMPT_PREFIX}${weekNum.toString().padStart(2, '0')}`;
}

/**
 * Create a test user with profile and preferences
 */
export async function createTestUser(
  overrides?: Partial<TestUser>
): Promise<TestUser> {
  const netid = overrides?.netid || generateTestNetid();
  const firebaseUid = overrides?.firebaseUid || `firebase-${netid}`;
  const email = overrides?.email || `${netid}@cornell.edu`;

  // Create user document
  await db.collection('users').doc(netid).set({
    netid,
    email,
    firebaseUid,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Create profile
  const profile: ProfileDoc = {
    netid,
    firstName: overrides?.profile?.firstName || `User${netid.substring(9)}`,
    bio: overrides?.profile?.bio || `Test user bio for ${netid}`,
    gender: overrides?.profile?.gender || ('female' as Gender),
    birthdate: overrides?.profile?.birthdate || new Date('2002-01-01'),
    year: overrides?.profile?.year || ('Junior' as Year),
    school: overrides?.profile?.school || ('College of Engineering' as School),
    major: overrides?.profile?.major || ['Computer Science'],
    interests: overrides?.profile?.interests || ['coding', 'music', 'hiking'],
    clubs: overrides?.profile?.clubs || ['CUAppDev'],
    pictures: overrides?.profile?.pictures || [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...(overrides?.profile || {}),
  };

  await db.collection('profiles').doc(netid).set(profile);

  // Create preferences
  const preferences: PreferencesDoc = {
    netid,
    ageRange: overrides?.preferences?.ageRange || { min: 18, max: 25 },
    years: overrides?.preferences?.years || ['Freshman', 'Sophomore', 'Junior', 'Senior'],
    schools: overrides?.preferences?.schools || [],
    majors: overrides?.preferences?.majors || [],
    genders: overrides?.preferences?.genders || ['male', 'female', 'non-binary'],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...(overrides?.preferences || {}),
  };

  await db.collection('preferences').doc(netid).set(preferences);

  return {
    netid,
    firebaseUid,
    email,
    profile,
    preferences,
  };
}

/**
 * Create multiple test users
 */
export async function createTestUsers(count: number): Promise<TestUser[]> {
  const users: TestUser[] = [];

  // Create diverse set of users for realistic matching
  for (let i = 0; i < count; i++) {
    const netid = generateTestNetid();
    const user = await createTestUser({
      netid,
      profile: {
        netid,
        gender: (i % 3 === 0 ? 'male' : i % 3 === 1 ? 'female' : 'non-binary') as Gender,
        year: (['Freshman', 'Sophomore', 'Junior', 'Senior'][i % 4]) as Year,
        school: (i % 2 === 0 ? 'College of Engineering' : 'College of Arts and Sciences') as School,
        major: i % 2 === 0 ? ['Computer Science'] : ['Biology', 'Psychology'],
        interests:
          i % 3 === 0
            ? ['coding', 'gaming', 'music']
            : i % 3 === 1
            ? ['reading', 'hiking', 'photography']
            : ['music', 'sports', 'cooking'],
        clubs: i % 2 === 0 ? ['CUAppDev'] : ['Hiking Club'],
        bio: `Test user ${i}`,
        firstName: `User${i}`,
        birthdate: new Date('2002-01-01'),
        pictures: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ProfileDoc,
      preferences: {
        netid,
        genders: i % 2 === 0 ? ['female', 'non-binary'] : ['male', 'non-binary'],
        ageRange: { min: 18, max: 25 },
        years: ['Freshman', 'Sophomore', 'Junior', 'Senior'],
        schools: [],
        majors: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as PreferencesDoc,
    });
    users.push(user);
  }

  return users;
}

/**
 * Create a test prompt
 */
export async function createTestPrompt(
  promptId?: string,
  question?: string
): Promise<WeeklyPromptDoc> {
  const id = promptId || generateTestPromptId();
  const now = new Date();
  const nextFriday = new Date();
  nextFriday.setDate(nextFriday.getDate() + ((5 + 7 - nextFriday.getDay()) % 7 || 7));
  nextFriday.setHours(0, 0, 0, 0);

  const prompt: WeeklyPromptDoc = {
    promptId: id,
    question: question || `Test question for ${id}: What's your ideal weekend?`,
    releaseDate: now,
    matchDate: nextFriday,
    active: true,
    status: 'active',
    createdAt: now,
  };

  await db.collection('weeklyPrompts').doc(id).set(prompt);

  return prompt;
}

/**
 * Create prompt answers for test users
 */
export async function createTestPromptAnswers(
  users: TestUser[],
  promptId: string
): Promise<void> {
  const answers = [
    'I love hiking in the gorges and exploring nature!',
    'Reading books at a cozy cafe is my perfect weekend.',
    'Playing basketball and working on side projects.',
    'Cooking new recipes and hosting dinner parties.',
    'Going to concerts and discovering new music.',
    'Volunteering and spending time outdoors.',
    'Gaming with friends and watching movies.',
    'Practicing photography and editing photos.',
  ];

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const docId = `${user.netid}_${promptId}`;
    await db.collection('weeklyPromptAnswers').doc(docId).set({
      netid: user.netid,
      promptId,
      answer: answers[i % answers.length],
      createdAt: FieldValue.serverTimestamp(),
    });
  }
}

/**
 * Clean up all test data
 */
export async function cleanupTestData(): Promise<void> {
  console.log('Starting test data cleanup...');

  // Clean up users
  const usersSnapshot = await db
    .collection('users')
    .where('netid', '>=', TEST_USER_PREFIX)
    .where('netid', '<', TEST_USER_PREFIX + '\uf8ff')
    .get();

  for (const doc of usersSnapshot.docs) {
    await doc.ref.delete();
  }
  console.log(`Deleted ${usersSnapshot.size} test users`);

  // Clean up profiles
  const profilesSnapshot = await db
    .collection('profiles')
    .where('netid', '>=', TEST_USER_PREFIX)
    .where('netid', '<', TEST_USER_PREFIX + '\uf8ff')
    .get();

  for (const doc of profilesSnapshot.docs) {
    await doc.ref.delete();
  }
  console.log(`Deleted ${profilesSnapshot.size} test profiles`);

  // Clean up preferences
  const preferencesSnapshot = await db
    .collection('preferences')
    .where('netid', '>=', TEST_USER_PREFIX)
    .where('netid', '<', TEST_USER_PREFIX + '\uf8ff')
    .get();

  for (const doc of preferencesSnapshot.docs) {
    await doc.ref.delete();
  }
  console.log(`Deleted ${preferencesSnapshot.size} test preferences`);

  // Clean up test prompts
  const promptsSnapshot = await db
    .collection('weeklyPrompts')
    .where('promptId', '>=', TEST_PROMPT_PREFIX)
    .where('promptId', '<', TEST_PROMPT_PREFIX + '\uf8ff')
    .get();

  for (const doc of promptsSnapshot.docs) {
    await doc.ref.delete();
  }
  console.log(`Deleted ${promptsSnapshot.size} test prompts`);

  // Clean up prompt answers - query by netid field instead of fetching all
  const answersByNetidSnapshot = await db
    .collection('weeklyPromptAnswers')
    .where('netid', '>=', TEST_USER_PREFIX)
    .where('netid', '<', TEST_USER_PREFIX + '\uf8ff')
    .get();

  let answersDeleted = 0;
  let answersBatch = db.batch();
  for (const doc of answersByNetidSnapshot.docs) {
    answersBatch.delete(doc.ref);
    answersDeleted++;

    if (answersDeleted % 500 === 0) {
      await answersBatch.commit();
      answersBatch = db.batch(); // Create new batch after commit
    }
  }
  if (answersDeleted % 500 !== 0) {
    await answersBatch.commit();
  }
  console.log(`Deleted ${answersDeleted} test prompt answers`);

  // Clean up weekly matches (use batched deletes for efficiency)
  // Query by netid to avoid fetching all documents
  const matchesByNetidSnapshot = await db
    .collection('weeklyMatches')
    .where('netid', '>=', TEST_USER_PREFIX)
    .where('netid', '<', TEST_USER_PREFIX + '\uf8ff')
    .get();

  let matchesDeleted = 0;
  let matchesBatch = db.batch();
  for (const doc of matchesByNetidSnapshot.docs) {
    matchesBatch.delete(doc.ref);
    matchesDeleted++;

    // Commit batch every 500 docs to avoid hitting limits
    if (matchesDeleted % 500 === 0) {
      await matchesBatch.commit();
      matchesBatch = db.batch(); // Create new batch after commit
    }
  }
  if (matchesDeleted % 500 !== 0) {
    await matchesBatch.commit();
  }
  console.log(`Deleted ${matchesDeleted} test matches`);

  // Clean up nudges - query by fromNetid field
  const nudgesByFromSnapshot = await db
    .collection('nudges')
    .where('fromNetid', '>=', TEST_USER_PREFIX)
    .where('fromNetid', '<', TEST_USER_PREFIX + '\uf8ff')
    .get();

  let nudgesDeleted = 0;
  let nudgesBatch = db.batch();
  for (const doc of nudgesByFromSnapshot.docs) {
    nudgesBatch.delete(doc.ref);
    nudgesDeleted++;

    if (nudgesDeleted % 500 === 0) {
      await nudgesBatch.commit();
      nudgesBatch = db.batch(); // Create new batch after commit
    }
  }
  if (nudgesDeleted % 500 !== 0) {
    await nudgesBatch.commit();
  }
  console.log(`Deleted ${nudgesDeleted} test nudges`);

  // Clean up notifications - query by netid field
  const notificationsByNetidSnapshot = await db
    .collection('notifications')
    .where('netid', '>=', TEST_USER_PREFIX)
    .where('netid', '<', TEST_USER_PREFIX + '\uf8ff')
    .get();

  let notificationsDeleted = 0;
  let notificationsBatch = db.batch();
  for (const doc of notificationsByNetidSnapshot.docs) {
    notificationsBatch.delete(doc.ref);
    notificationsDeleted++;

    if (notificationsDeleted % 500 === 0) {
      await notificationsBatch.commit();
      notificationsBatch = db.batch(); // Create new batch after commit
    }
  }
  if (notificationsDeleted % 500 !== 0) {
    await notificationsBatch.commit();
  }
  console.log(`Deleted ${notificationsDeleted} test notifications`);

  console.log('Test data cleanup complete!');
}

/**
 * Get all test users (for verification)
 */
export async function getAllTestUsers(): Promise<TestUser[]> {
  const usersSnapshot = await db
    .collection('users')
    .where('netid', '>=', TEST_USER_PREFIX)
    .where('netid', '<', TEST_USER_PREFIX + '\uf8ff')
    .get();

  const users: TestUser[] = [];

  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    const profileDoc = await db.collection('profiles').doc(userData.netid).get();
    const preferencesDoc = await db.collection('preferences').doc(userData.netid).get();

    users.push({
      netid: userData.netid,
      firebaseUid: userData.firebaseUid,
      email: userData.email,
      profile: profileDoc.data() as ProfileDoc,
      preferences: preferencesDoc.data() as PreferencesDoc,
    });
  }

  return users;
}

/**
 * Get matches for a user
 */
export async function getUserMatches(netid: string, promptId: string) {
  const snapshot = await db
    .collection('weeklyMatches')
    .where('netid', '==', netid)
    .where('promptId', '==', promptId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data();
}

/**
 * Get nudge status between two users
 */
export async function getNudge(fromNetid: string, toNetid: string, promptId: string) {
  const nudgeId = `${fromNetid}_${promptId}_${toNetid}`;
  const doc = await db.collection('nudges').doc(nudgeId).get();
  return doc.exists ? doc.data() : null;
}
