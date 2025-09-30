const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

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

// Get Total Amount of Users
export const getSignedUpCount = async (): Promise<number> => {
  try {
    const res = await Promise.race([
      fetch(`${API_BASE_URL}/api/registered-count`),
      new Promise<never>((_, reject) => setTimeout(() => reject(), 4000))
    ]);

    if (!res.ok) {
      const msg = `apiGetSignedUpCount failed – status ${res.status}`;
      console.error(msg);
      throw new Error(msg);
    }

    const data = await res.json();
    console.log(data);
    return data.userCount;
  } catch {
    return 73;
  }
};
