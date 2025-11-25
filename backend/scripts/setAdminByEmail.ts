/**
 * Script to set up an admin user by email address
 *
 * This script:
 * 1. Looks up the Firebase user by email
 * 2. Sets the admin custom claim for the user
 * 3. Creates an admin document in the 'admins' Firestore collection
 * 4. Verifies the setup was successful
 *
 * Usage:
 *   cd backend
 *   ADMIN_EMAIL=user@cornell.edu npx ts-node scripts/setAdminByEmail.ts
 *
 * Environment Variables Required:
 *   ADMIN_EMAIL - The email address of the user to make admin
 *   FIREBASE_PROJECT_ID - Firebase project ID
 *   FIREBASE_CLIENT_EMAIL - Firebase service account email
 *   FIREBASE_PRIVATE_KEY - Firebase service account private key
 */

import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { Timestamp } from 'firebase-admin/firestore';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'ADMIN_EMAIL',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Error: Missing required environment variable: ${envVar}`);
    console.error('\nUsage:');
    console.error('  ADMIN_EMAIL=user@cornell.edu npx ts-node scripts/setAdminByEmail.ts');
    console.error('\nOr add to your .env file:');
    console.error('  ADMIN_EMAIL=user@cornell.edu');
    console.error('  FIREBASE_PROJECT_ID=your-project-id');
    console.error('  FIREBASE_CLIENT_EMAIL=your-service-account-email');
    console.error('  FIREBASE_PRIVATE_KEY="your-private-key"');
    process.exit(1);
  }
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;

console.log('🚀 Starting admin setup script...\n');
console.log(`Target Admin Email: ${ADMIN_EMAIL}\n`);

// Initialize Firebase Admin SDK
console.log('🔧 Initializing Firebase Admin SDK...');
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();

async function setupAdmin() {
  try {
    // Step 1: Look up user by email
    console.log('🔍 Step 1: Looking up user by email...');
    let user;
    try {
      user = await admin.auth().getUserByEmail(ADMIN_EMAIL);
      console.log(`✅ User found!`);
      console.log(`   UID: ${user.uid}`);
      console.log(`   Email: ${user.email || 'No email'}`);
      console.log(`   Display Name: ${user.displayName || 'Not set'}`);
      console.log(`   Created: ${user.metadata.creationTime}\n`);
    } catch (error) {
      console.error(`❌ User not found with email: ${ADMIN_EMAIL}`);
      console.error('   Make sure the user has signed up for the app first.');
      process.exit(1);
    }

    const ADMIN_UID = user.uid;

    // Step 2: Check if already has admin claim
    console.log('🔍 Step 2: Checking existing custom claims...');
    const currentClaims = user.customClaims || {};
    if (currentClaims.admin === true) {
      console.log('⚠️  User already has admin custom claim');
    } else {
      console.log('➡️  User does not have admin claim yet');
    }
    console.log('');

    // Step 3: Set admin custom claim
    console.log('🔐 Step 3: Setting admin custom claim...');
    await admin.auth().setCustomUserClaims(ADMIN_UID, { admin: true });
    console.log('✅ Admin custom claim set successfully\n');

    // Step 4: Verify custom claim was set
    console.log('🔍 Step 4: Verifying custom claim...');
    const updatedUser = await admin.auth().getUser(ADMIN_UID);
    const updatedClaims = updatedUser.customClaims || {};

    if (updatedClaims.admin === true) {
      console.log('✅ Custom claim verified: admin = true\n');
    } else {
      console.error('❌ Failed to verify custom claim!');
      console.error('   Claims:', JSON.stringify(updatedClaims, null, 2));
      process.exit(1);
    }

    // Step 5: Check if admin document already exists
    console.log('🔍 Step 5: Checking admins collection...');
    const adminDoc = await db.collection('admins').doc(ADMIN_UID).get();

    if (adminDoc.exists) {
      console.log('⚠️  Admin document already exists in Firestore');
      const existingData = adminDoc.data();
      console.log('   Existing data:', JSON.stringify(existingData, null, 2));
      console.log(
        '\n❓ Keeping existing document (not updating)\n'
      );
    } else {
      // Step 6: Create admin document in Firestore
      console.log('📝 Step 6: Creating admin document in Firestore...');
      const adminData: any = {
        uid: ADMIN_UID,
        email: user.email || '',
        role: 'super_admin',
        disabled: false,
        createdAt: Timestamp.now(),
        createdBy: ADMIN_UID, // Self-created
        notes: `Admin user created by setAdminByEmail script for ${ADMIN_EMAIL}`,
      };

      // Only add displayName if it exists
      if (user.displayName) {
        adminData.displayName = user.displayName;
      }

      await db.collection('admins').doc(ADMIN_UID).set(adminData);
      console.log('✅ Admin document created in Firestore\n');
    }

    // Step 7: Verify admin document
    console.log('🔍 Step 7: Verifying admin document...');
    const finalAdminDoc = await db.collection('admins').doc(ADMIN_UID).get();

    if (finalAdminDoc.exists) {
      console.log('✅ Admin document exists in Firestore');
      const adminData = finalAdminDoc.data();
      console.log('\n📋 Admin Document:');
      console.log('   UID:', adminData?.uid);
      console.log('   Email:', adminData?.email);
      console.log('   Role:', adminData?.role);
      console.log('   Disabled:', adminData?.disabled);
      console.log(
        '   Created At:',
        adminData?.createdAt?.toDate().toISOString()
      );
    } else {
      console.error('❌ Failed to verify admin document!');
      process.exit(1);
    }

    // Success summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ ADMIN SETUP COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📝 Summary:');
    console.log('   ✅ Admin custom claim set');
    console.log('   ✅ Admin document created in Firestore');
    console.log('   ✅ User can now access admin endpoints\n');
    console.log('⚠️  IMPORTANT NEXT STEPS:');
    console.log(
      '   1. The user must sign out and sign back in to get new token with admin claim'
    );
    console.log(
      "   2. Firebase tokens are cached, so existing sessions won't have the claim"
    );
    console.log(
      '   3. New sign-ins will include the admin claim automatically\n'
    );
    console.log('🔐 Security Notes:');
    console.log('   - Admin custom claim is cached in Firebase tokens');
    console.log('   - Admins collection provides persistent admin management');
    console.log(
      '   - Both checks (claim + collection) are enforced by middleware\n'
    );

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR during admin setup:');
    console.error(error);
    console.error('\nCommon issues:');
    console.error(
      '  - Invalid ADMIN_EMAIL: User does not exist in Firebase Auth'
    );
    console.error('  - Invalid Firebase credentials in .env file');
    console.error('  - Network connectivity issues');
    console.error('  - Insufficient permissions on service account');
    process.exit(1);
  }
}

// Run the setup
setupAdmin();
