/**
 * Script to delete all Firebase Authentication users except the admin account
 *
 * This script:
 * 1. Lists all users from Firebase Authentication (with pagination)
 * 2. Identifies the admin user (admin@cornell.edu)
 * 3. Deletes all users except the admin
 * 4. Provides detailed logging of the deletion process
 *
 * Usage:
 *   cd backend
 *   npx ts-node scripts/delete-test-auth-users.ts
 *
 * Environment Variables Required:
 *   FIREBASE_PROJECT_ID - Firebase project ID
 *   FIREBASE_CLIENT_EMAIL - Firebase service account email
 *   FIREBASE_PRIVATE_KEY - Firebase service account private key
 *
 * SAFETY: This script will preserve the admin@cornell.edu account
 */

import admin from 'firebase-admin';
import dotenv from 'dotenv';
import * as readline from 'readline';

// Load environment variables
dotenv.config();

// Admin email to preserve
const ADMIN_EMAIL = 'admin@cornell.edu';

// Validate required environment variables
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Error: Missing required environment variable: ${envVar}`);
    console.error('\nMake sure your .env file contains:');
    console.error('  FIREBASE_PROJECT_ID=your-project-id');
    console.error('  FIREBASE_CLIENT_EMAIL=your-service-account-email');
    console.error('  FIREBASE_PRIVATE_KEY="your-private-key"');
    process.exit(1);
  }
}

console.log('🚀 Starting Firebase Auth user cleanup script...\n');

// Initialize Firebase Admin SDK
console.log('🔧 Initializing Firebase Admin SDK...');
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  }),
});
console.log('✅ Firebase Admin SDK initialized\n');

/**
 * Prompt user for confirmation before deletion
 */
async function confirmDeletion(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      '⚠️  WARNING: This will delete ALL users except admin@cornell.edu.\n' +
        'Are you sure you want to continue? (yes/no): ',
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes');
      }
    );
  });
}

/**
 * List all users with pagination and delete all except admin
 */
async function deleteTestUsers() {
  try {
    let adminUser: admin.auth.UserRecord | null = null;
    let usersToDelete: admin.auth.UserRecord[] = [];
    let totalUsers = 0;
    let pageToken: string | undefined;

    console.log('🔍 Step 1: Listing all users from Firebase Authentication...\n');

    // List all users with pagination
    do {
      const listUsersResult = await admin.auth().listUsers(1000, pageToken);
      totalUsers += listUsersResult.users.length;

      for (const user of listUsersResult.users) {
        if (user.email === ADMIN_EMAIL) {
          adminUser = user;
          console.log(`✅ Found admin user: ${user.email} (uid: ${user.uid})`);
        } else {
          usersToDelete.push(user);
        }
      }

      pageToken = listUsersResult.pageToken;
    } while (pageToken);

    console.log(`\n📊 Summary:`);
    console.log(`   Total users found: ${totalUsers}`);
    console.log(`   Admin user: ${adminUser ? '✅ Found' : '❌ Not found'}`);
    console.log(`   Users to delete: ${usersToDelete.length}\n`);

    // Safety check: Verify admin exists
    if (!adminUser) {
      console.error('❌ ERROR: Admin user (admin@cornell.edu) not found!');
      console.error('   Cannot proceed with deletion for safety reasons.');
      console.error('   Please verify the admin account exists in Firebase Auth.');
      process.exit(1);
    }

    // If no users to delete, exit
    if (usersToDelete.length === 0) {
      console.log('✅ No test users to delete. Only admin account exists.');
      process.exit(0);
    }

    // Confirm deletion
    console.log('📋 Users that will be deleted:');
    for (const user of usersToDelete.slice(0, 10)) {
      console.log(`   - ${user.email || 'No email'} (uid: ${user.uid})`);
    }
    if (usersToDelete.length > 10) {
      console.log(`   ... and ${usersToDelete.length - 10} more users\n`);
    } else {
      console.log('');
    }

    const confirmed = await confirmDeletion();

    if (!confirmed) {
      console.log('\n❌ Deletion cancelled by user.');
      process.exit(0);
    }

    console.log('\n🗑️  Step 2: Deleting test users...\n');

    let deletedCount = 0;
    let errorCount = 0;

    // Delete users one by one
    for (const user of usersToDelete) {
      try {
        await admin.auth().deleteUser(user.uid);
        deletedCount++;
        console.log(
          `🗑️  Deleted: ${user.email || 'No email'} (uid: ${user.uid})`
        );
      } catch (error) {
        errorCount++;
        console.error(
          `❌ Error deleting ${user.email || 'No email'} (uid: ${user.uid}):`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    // Final verification
    console.log('\n🔍 Step 3: Verifying deletion...\n');
    const verifyResult = await admin.auth().listUsers(1000);
    const remainingUsers = verifyResult.users;

    console.log('\n' + '='.repeat(60));
    console.log('✅ CLEANUP COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📊 Final Summary:');
    console.log(`   ✅ Users deleted: ${deletedCount}`);
    console.log(`   ❌ Deletion errors: ${errorCount}`);
    console.log(`   👤 Remaining users: ${remainingUsers.length}`);
    console.log(
      `   🔐 Admin preserved: ${adminUser.email} (uid: ${adminUser.uid})\n`
    );

    if (remainingUsers.length > 1) {
      console.log('⚠️  Warning: More than 1 user remains:');
      for (const user of remainingUsers) {
        console.log(`   - ${user.email || 'No email'} (uid: ${user.uid})`);
      }
      console.log('');
    }

    if (errorCount > 0) {
      console.log('⚠️  Some users could not be deleted. Check errors above.\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR during user deletion:');
    console.error(error);
    console.error('\nCommon issues:');
    console.error('  - Invalid Firebase credentials in .env file');
    console.error('  - Network connectivity issues');
    console.error('  - Insufficient permissions on service account');
    console.error(
      '  - Service account needs "Firebase Authentication Admin" role'
    );
    process.exit(1);
  }
}

// Run the cleanup
deleteTestUsers();
