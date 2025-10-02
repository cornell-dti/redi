import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

interface EmailDoc {
  id: string;
  email: string;
  [key: string]: any;
}

async function listEmails(): Promise<void> {
  const apiBaseUrl = process.env.REACT_APP_API_URL;
  if (!apiBaseUrl) {
    throw new Error('REACT_APP_API_URL environment variable is required');
  }

  try {
    const response = await fetch(`${apiBaseUrl}/api/landing-emails`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as EmailDoc[];
    const emails = data.map((doc) => doc.email).join(' ');

    console.log(emails);
  } catch (error) {
    console.error('Error fetching emails:', (error as Error).message);
    process.exit(1);
  }
}

listEmails();
