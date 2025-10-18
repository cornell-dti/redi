import {
  ActivatePromptResponse,
  ApiResponse,
  CreatePromptRequest,
  GenerateMatchesResponse,
  WeeklyPrompt,
} from '@/types/admin';
import { getAuth } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { FIREBASE_APP, FIREBASE_DB } from '../../firebase';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

/**
 * Get Firebase ID token for authenticated user
 * Forces token refresh to ensure latest custom claims
 */
const getAuthToken = async (): Promise<string> => {
  const auth = getAuth(FIREBASE_APP);
  const user = auth.currentUser;

  if (!user) {
    console.error('❌ No authenticated user found');
    throw new Error('User not authenticated. Please sign in again.');
  }

  console.log('🔐 Getting Firebase ID token for user:', user.uid);

  // Force refresh to get latest custom claims (important for admin verification)
  const token = await user.getIdToken(true);

  console.log('✅ Firebase ID token retrieved');
  return token;
};

/**
 * Create a new weekly prompt
 */
export const createPrompt = async (
  data: CreatePromptRequest
): Promise<ApiResponse<WeeklyPrompt>> => {
  console.log('📤 Creating prompt with data:', data);

  const token = await getAuthToken();

  const res = await fetch(`${API_BASE_URL}/api/admin/prompts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data), // No firebaseUid needed
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create prompt');
  }

  return res.json();
};

/**
 * Activate a prompt immediately
 */
export const activatePrompt = async (
  promptId: string
): Promise<ApiResponse<ActivatePromptResponse>> => {
  console.log('📤 Activating prompt:', promptId);

  const token = await getAuthToken();

  const res = await fetch(
    `${API_BASE_URL}/api/admin/prompts/${promptId}/activate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}), // Empty body, no firebaseUid
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to activate prompt');
  }

  return res.json();
};

/**
 * Generate matches for a prompt immediately
 */
export const generateMatches = async (
  promptId: string
): Promise<ApiResponse<GenerateMatchesResponse>> => {
  console.log('📤 Generating matches for prompt:', promptId);

  const token = await getAuthToken();

  const res = await fetch(
    `${API_BASE_URL}/api/admin/prompts/${promptId}/generate-matches`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}), // Empty body, no firebaseUid
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to generate matches');
  }

  return res.json();
};

/**
 * Fetch all prompts from Firestore (direct read, no backend call)
 */
export const fetchAllPrompts = async (): Promise<WeeklyPrompt[]> => {
  console.log('📥 Fetching all prompts from Firestore');

  const promptsRef = collection(FIREBASE_DB, 'weeklyPrompts');
  const q = query(promptsRef, orderBy('releaseDate', 'desc'));
  const snapshot = await getDocs(q);

  const prompts: WeeklyPrompt[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const answerCount = await fetchAnswerCount(doc.id);

    prompts.push({
      id: doc.id,
      promptId: doc.id,
      question: data.question,
      releaseDate: data.releaseDate?.toDate ? data.releaseDate.toDate().toISOString() : data.releaseDate || null,
      matchDate: data.matchDate?.toDate ? data.matchDate.toDate().toISOString() : data.matchDate || null,
      active: data.active || false,
      status: data.status || 'scheduled',
      activatedAt: data.activatedAt?.toDate ? data.activatedAt.toDate().toISOString() : data.activatedAt || null,
      matchesGeneratedAt: data.matchesGeneratedAt?.toDate ? data.matchesGeneratedAt.toDate().toISOString() : data.matchesGeneratedAt || null,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || null,
      answerCount,
    });
  }

  console.log(`✅ Fetched ${prompts.length} prompts`);
  return prompts;
};

/**
 * Fetch answer count for a specific prompt
 */
export const fetchAnswerCount = async (promptId: string): Promise<number> => {
  try {
    const answersRef = collection(FIREBASE_DB, 'weeklyPromptAnswers');
    const q = query(answersRef, where('promptId', '==', promptId));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error fetching answer count:', error);
    return 0;
  }
};

/**
 * Fetch a single prompt by ID
 */
export const fetchPromptById = async (
  promptId: string
): Promise<WeeklyPrompt | null> => {
  console.log('📥 Fetching prompt:', promptId);

  const promptRef = doc(FIREBASE_DB, 'weeklyPrompts', promptId);
  const promptDoc = await getDoc(promptRef);

  if (!promptDoc.exists()) {
    return null;
  }

  const data = promptDoc.data();
  const answerCount = await fetchAnswerCount(promptId);
  return {
    id: promptId,
    promptId,
    question: data.question,
    releaseDate: data.releaseDate?.toDate ? data.releaseDate.toDate().toISOString() : data.releaseDate || null,
    matchDate: data.matchDate?.toDate ? data.matchDate.toDate().toISOString() : data.matchDate || null,
    active: data.active || false,
    status: data.status || 'scheduled',
    activatedAt: data.activatedAt?.toDate ? data.activatedAt.toDate().toISOString() : data.activatedAt || null,
    matchesGeneratedAt: data.matchesGeneratedAt?.toDate ? data.matchesGeneratedAt.toDate().toISOString() : data.matchesGeneratedAt || null,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || null,
    answerCount,
  };
};

/**
 * Delete the currently active prompt
 */
export const deleteActivePrompt = async (): Promise<ApiResponse<{ message: string; promptId: string }>> => {
  console.log('📤 Deleting active prompt');

  const token = await getAuthToken();

  const res = await fetch(`${API_BASE_URL}/api/admin/prompts/active`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({}), // Empty body, no firebaseUid
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete active prompt');
  }

  return res.json();
};

/**
 * Generate prompt ID from a date
 */
export const generatePromptId = async (date: Date): Promise<string> => {
  console.log('📤 Generating prompt ID for date:', date.toISOString());

  const token = await getAuthToken();

  const res = await fetch(
    `${API_BASE_URL}/api/admin/prompts/generate-id/${date.toISOString()}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to generate prompt ID');
  }

  const data = await res.json();
  return data.promptId;
};

/**
 * Get prompts from backend API (with filters)
 */
export const getPrompts = async (filters?: {
  active?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<ApiResponse<WeeklyPrompt[]>> => {
  console.log('📤 Getting prompts with filters:', filters);

  const token = await getAuthToken();

  const queryParams = new URLSearchParams();
  if (filters?.active !== undefined) {
    queryParams.append('active', filters.active.toString());
  }
  if (filters?.startDate) {
    queryParams.append('startDate', filters.startDate);
  }
  if (filters?.endDate) {
    queryParams.append('endDate', filters.endDate);
  }
  if (filters?.limit) {
    queryParams.append('limit', filters.limit.toString());
  }

  const url = `${API_BASE_URL}/api/admin/prompts${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch prompts');
  }

  return res.json();
};

/**
 * Get a single prompt from backend API
 */
export const getPrompt = async (promptId: string): Promise<ApiResponse<WeeklyPrompt>> => {
  console.log('📤 Getting prompt:', promptId);

  const token = await getAuthToken();

  const res = await fetch(`${API_BASE_URL}/api/admin/prompts/${promptId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch prompt');
  }

  return res.json();
};

/**
 * Update a prompt
 */
export const updatePrompt = async (
  promptId: string,
  updates: Partial<CreatePromptRequest>
): Promise<ApiResponse<WeeklyPrompt>> => {
  console.log('📤 Updating prompt:', promptId, updates);

  const token = await getAuthToken();

  const res = await fetch(`${API_BASE_URL}/api/admin/prompts/${promptId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updates), // No firebaseUid needed
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update prompt');
  }

  return res.json();
};

/**
 * Delete a prompt
 */
export const deletePrompt = async (promptId: string): Promise<ApiResponse<{ message: string }>> => {
  console.log('📤 Deleting prompt:', promptId);

  const token = await getAuthToken();

  const res = await fetch(`${API_BASE_URL}/api/admin/prompts/${promptId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({}), // Empty body, no firebaseUid
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete prompt');
  }

  return res.json();
};
