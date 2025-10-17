const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// Add a new email
export const apiAddEmail = async (email: string): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/api/landing-emails`, {
    method: 'POST', // use POST to add
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const msg = `apiAddEmail failed – status ${res.status}`;
    throw new Error(msg);
  }
};

// Get Total Amount of Users
export const getSignedUpCount = async (): Promise<number> => {
  const res = await fetch(`${API_BASE_URL}/api/registered-count`);

  if (!res.ok) {
    const msg = `apiGetSignedUpCount failed – status ${res.status}`;
    console.error(msg);
    throw new Error(msg);
  }

  const data = await res.json();
  console.log(data);
  return data.userCount;
};
