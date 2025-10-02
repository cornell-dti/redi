import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

if (!process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error('Missing FIREBASE_PRIVATE_KEY environment variable');
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
  }),
  storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
});

export const db = admin.firestore();
export const bucket = admin.storage().bucket();
