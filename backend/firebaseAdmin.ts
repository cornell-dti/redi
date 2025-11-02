import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

// Only initialize if not already initialized (Cloud Functions initializes in index.ts)
if (admin.apps.length === 0) {
  // Check if we have explicit credentials in env (backend server mode)
  // Otherwise use default credentials (Cloud Functions mode)
  if (process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL) {
    // In local/backend environment, use environment variables
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      storageBucket: `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`,
    });
  } else {
    // In Cloud Functions or without explicit credentials, use default
    admin.initializeApp();
  }
}

export const db = admin.firestore();
export const bucket = admin.storage().bucket();
