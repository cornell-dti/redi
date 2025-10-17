import dotenv from 'dotenv';
import { db } from '../firebaseAdmin';

dotenv.config();

interface EmailDoc {
  id: string;
  email: string;
  [key: string]: any;
}

async function listEmails(): Promise<void> {
  try {
    const snapshot = await db.collection('landing-emails').get();
    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as EmailDoc[];
    const emails = docs.map((doc) => doc.email).join(' ');

    console.log(emails);
  } catch (error) {
    console.error('Error fetching emails:', (error as Error).message);
    process.exit(1);
  }
}

listEmails();
