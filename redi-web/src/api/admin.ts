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
 * Get the current user's Firebase UID
 * @throws Error if no user is authenticated
 */
const getCurrentUserUid = (): string => {
  const auth = getAuth(FIREBASE_APP);
  const user = auth.currentUser;
  
  if (!user) {
    console.error('❌ No authenticated user found');
    throw new Error('User not authenticated. Please sign in again.');
  }
  
  console.log('👤 Using Firebase UID:', user.uid);
  return user.uid;
};

// Create a new weekly prompt
export const createPrompt = async (
  data: CreatePromptRequest
): Promise<ApiResponse<WeeklyPrompt>> => {
  console.log('📤 Creating prompt with data:', data);
  
  const firebaseUid = getCurrentUserUid();
  
  const requestBody = {
    ...data,
    firebaseUid,
  };
  
  console.log('📤 Request body:', requestBody);
  
  const res = await fetch(`${API_BASE_URL}/api/admin/prompts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('❌ Create prompt failed:', errorData);
    throw new Error(
      errorData.error || `Failed to create prompt - status ${res.status}`
    );
  }

  const result = await res.json();
  console.log('✅ Prompt created successfully:', result);
  return result;
};

// Activate a prompt immediately (for testing)
export const activatePrompt = async (
  promptId: string
): Promise<ApiResponse<ActivatePromptResponse>> => {
  console.log('📤 Activating prompt:', promptId);
  
  const firebaseUid = getCurrentUserUid();
  
  const res = await fetch(
    `${API_BASE_URL}/api/admin/prompts/${promptId}/activate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firebaseUid }),
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('❌ Activate prompt failed:', errorData);
    throw new Error(
      errorData.error || `Failed to activate prompt - status ${res.status}`
    );
  }

  const result = await res.json();
  console.log('✅ Prompt activated successfully:', result);
  return result;
};

// Generate matches for a prompt immediately (for testing)
export const generateMatches = async (
  promptId: string
): Promise<ApiResponse<GenerateMatchesResponse>> => {
  console.log('📤 Generating matches for prompt:', promptId);
  
  const firebaseUid = getCurrentUserUid();
  
  const res = await fetch(
    `${API_BASE_URL}/api/admin/prompts/${promptId}/generate-matches`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firebaseUid }),
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('❌ Generate matches failed:', errorData);
    throw new Error(
      errorData.error ||
        `Failed to generate matches - status ${res.status}`
    );
  }

  const result = await res.json();
  console.log('✅ Matches generated successfully:', result);
  return result;
};

// Fetch all prompts from Firestore
export const fetchAllPrompts = async (): Promise<WeeklyPrompt[]> => {
  try {
    console.log('📥 Fetching all prompts from Firestore');
    const promptsRef = collection(FIREBASE_DB, 'weeklyPrompts');
    const q = query(promptsRef, orderBy('releaseDate', 'desc'));
    const querySnapshot = await getDocs(q);

    const prompts: WeeklyPrompt[] = [];
    querySnapshot.forEach((doc) => {
      prompts.push({
        id: doc.id,
        ...doc.data(),
      } as WeeklyPrompt);
    });

    console.log('✅ Fetched', prompts.length, 'prompts');
    return prompts;
  } catch (error) {
    console.error('❌ Error fetching prompts from Firestore:', error);
    throw new Error('Failed to fetch prompts from database');
  }
};

// Fetch answer count for a specific prompt
export const fetchAnswerCount = async (promptId: string): Promise<number> => {
  try {
    const answersRef = collection(FIREBASE_DB, 'weeklyAnswers');
    const q = query(answersRef, where('promptId', '==', promptId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error fetching answer count:', error);
    return 0;
  }
};

// Fetch a single prompt by ID
export const fetchPromptById = async (
  promptId: string
): Promise<WeeklyPrompt | null> => {
  try {
    console.log('📥 Fetching prompt:', promptId);
    const promptRef = doc(FIREBASE_DB, 'weeklyPrompts', promptId);
    const promptDoc = await getDoc(promptRef);

    if (!promptDoc.exists()) {
      console.log('❌ Prompt not found:', promptId);
      return null;
    }

    const prompt = {
      id: promptDoc.id,
      ...promptDoc.data(),
    } as WeeklyPrompt;

    console.log('✅ Fetched prompt:', prompt);
    return prompt;
  } catch (error) {
    console.error('❌ Error fetching prompt:', error);
    throw new Error('Failed to fetch prompt from database');
  }
};

// Delete the active prompt
export const deleteActivePrompt = async (): Promise<ApiResponse<{ promptId: string }>> => {
  console.log('📤 Deleting active prompt');

  const firebaseUid = getCurrentUserUid();

  const res = await fetch(`${API_BASE_URL}/api/admin/prompts/active`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firebaseUid }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('❌ Delete active prompt failed:', errorData);
    throw new Error(
      errorData.error || `Failed to delete active prompt - status ${res.status}`
    );
  }

  const result = await res.json();
  console.log('✅ Active prompt deleted successfully:', result);
  return result;
};