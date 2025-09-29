import fetch from 'node-fetch';
import { API_BASE_URL } from '../constants/constants';

interface EmailDoc {
  id: string;
  email: string;
  [key: string]: any;
}

async function listEmails(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/landing-emails`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json() as EmailDoc[];
    const emails = data.map(doc => doc.email).join(' ');
    
    console.log(emails);
  } catch (error) {
    console.error('Error fetching emails:', (error as Error).message);
    process.exit(1);
  }
}

listEmails();