import auth from '@react-native-firebase/auth';
import { API_BASE_URL } from '../../constants/constants';
import type {
  WeeklyPromptResponse,
  WeeklyPromptAnswerResponse,
  WeeklyMatchResponse,
} from '@/types';

// =============================================================================
// PROMPTS API
// =============================================================================

/**
 * Get the currently active prompt
 */
export async function getActivePrompt(): Promise<WeeklyPromptResponse> {
  const user = auth().currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(
    `${API_BASE_URL}/api/prompts/active?firebaseUid=${user.uid}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch active prompt');
  }

  return response.json();
}

/**
 * Get a specific prompt by ID
 */
export async function getPromptById(
  promptId: string
): Promise<WeeklyPromptResponse> {
  const user = auth().currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(
    `${API_BASE_URL}/api/prompts/${promptId}?firebaseUid=${user.uid}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch prompt');
  }

  return response.json();
}

/**
 * Submit an answer to the active prompt
 */
export async function submitPromptAnswer(
  promptId: string,
  answer: string
): Promise<WeeklyPromptAnswerResponse> {
  const user = auth().currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/api/prompts/answers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      firebaseUid: user.uid,
      promptId,
      answer,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit answer');
  }

  return response.json();
}

/**
 * Get current user's answer to a specific prompt
 */
export async function getPromptAnswer(
  promptId: string
): Promise<WeeklyPromptAnswerResponse> {
  const user = auth().currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(
    `${API_BASE_URL}/api/prompts/${promptId}/answers/me?firebaseUid=${user.uid}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch answer');
  }

  return response.json();
}

// =============================================================================
// MATCHES API
// =============================================================================

/**
 * Get current user's matches for a specific prompt
 */
export async function getPromptMatches(
  promptId: string
): Promise<WeeklyMatchResponse> {
  const user = auth().currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(
    `${API_BASE_URL}/api/prompts/${promptId}/matches?firebaseUid=${user.uid}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch matches');
  }

  return response.json();
}

/**
 * Get current user's match history across all prompts
 */
export async function getMatchHistory(
  limit: number = 10
): Promise<WeeklyMatchResponse[]> {
  const user = auth().currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(
    `${API_BASE_URL}/api/prompts/matches/history?firebaseUid=${user.uid}&limit=${limit}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch match history');
  }

  return response.json();
}

/**
 * Reveal a specific match
 */
export async function revealMatch(
  promptId: string,
  matchIndex: number
): Promise<WeeklyMatchResponse> {
  const user = auth().currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(
    `${API_BASE_URL}/api/prompts/${promptId}/matches/reveal`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firebaseUid: user.uid,
        matchIndex,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to reveal match');
  }

  return response.json();
}
