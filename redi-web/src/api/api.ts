import { API_BASE_URL } from "../../constants/constants";
// If the file does not exist, create '../constants/constants.ts' with:
// export const API_BASE_URL = 'https://your-api-base-url.com';

// Get all emails: return array of email strings
export const getEmails = async (): Promise<string[]> => {
  const res = await fetch(`${API_BASE_URL}/api/landing-emails`);

  if (!res.ok) {
    console.warn(`getEmails failed → ${res.status}`);
    return [];
  }
  // Assume API returns array of { id: string, email: string }
  const data = (await res.json()) as Array<{ id: string; email: string }>;
  return data.map((item) => item.email);
};

// Add a new email
export const apiAddEmail = async (email: string): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/api/landing-emails`, {
    method: "POST", // use POST to add
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const msg = `apiAddEmail failed – status ${res.status}`;
    console.error(msg);
    throw new Error(msg);
  }
};
