/**
 * Script to fetch all authenticated user emails for email campaigns
 * Usage: npx ts-node backend/scripts/get-user-emails.ts
 */

import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { UserDoc } from '../types';

dotenv.config({ path: 'backend/.env' });

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function getAllUserEmails() {
  try {
    console.log('Fetching all authenticated user emails...\n');

    const usersSnapshot = await db.collection('users').get();

    if (usersSnapshot.empty) {
      console.log('No users found in the database.');
      return;
    }

    // Filter to only include netids with numbers (excludes test accounts)
    const emails: string[] = [];
    const skippedEmails: string[] = [];

    usersSnapshot.docs.forEach((doc) => {
      const userData = doc.data() as UserDoc;
      if (userData.email) {
        const netid = userData.email.split('@')[0];
        // Check if netid contains at least one digit
        if (/\d/.test(netid)) {
          emails.push(userData.email);
        } else {
          skippedEmails.push(userData.email);
        }
      }
    });

    if (skippedEmails.length > 0) {
      console.log(`Skipped ${skippedEmails.length} test accounts (no numbers in netid):`);
      console.log(skippedEmails.join(', '));
      console.log();
    }

    console.log(`Found ${emails.length} authenticated users\n`);
    console.log('='.repeat(80));
    console.log('COPY THE EMAILS BELOW FOR BCC:');
    console.log('='.repeat(80));
    console.log(emails.join(', '));
    console.log('='.repeat(80));
    console.log(
      `\nTotal: ${emails.length} emails | Ready to paste into your email client's BCC field`
    );
  } catch (error) {
    console.error('Error fetching user emails:', error);
    process.exit(1);
  }
}

getAllUserEmails()
  .then(() => {
    console.log('\n✓ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
