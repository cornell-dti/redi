/**
 * Prompts API Service
 * SECURITY UPDATE: All endpoints now use Bearer token authentication
 * firebaseUid is extracted from the authenticated token on the backend
 */

import type {
  WeeklyPromptResponse,
  WeeklyPromptAnswerResponse,
  WeeklyMatchResponse,
  ProfileResponse,
  NudgeStatusResponse,
} from '@/types';
import { apiClient } from './apiClient';

// =============================================================================
// PROMPTS API
// =============================================================================

/**
 * Get the currently active prompt
 * SECURITY: firebaseUid is now extracted from Bearer token on backend
 *
 * @returns Promise resolving to active prompt
 * @throws APIError if fetch fails
 */
export async function getActivePrompt(): Promise<WeeklyPromptResponse> {
  return apiClient.get<WeeklyPromptResponse>('/api/prompts/active');
}

/**
 * Get a specific prompt by ID
 * SECURITY: firebaseUid is now extracted from Bearer token on backend
 *
 * @param promptId - The prompt ID to fetch
 * @returns Promise resolving to prompt data
 * @throws APIError if fetch fails
 */
export async function getPromptById(
  promptId: string
): Promise<WeeklyPromptResponse> {
  return apiClient.get<WeeklyPromptResponse>(`/api/prompts/${promptId}`);
}

/**
 * Submit an answer to the active prompt
 * SECURITY: firebaseUid is now extracted from Bearer token on backend
 *
 * @param promptId - The prompt ID to answer
 * @param answer - The user's answer text
 * @returns Promise resolving to created answer
 * @throws APIError if submission fails or validation errors occur
 */
export async function submitPromptAnswer(
  promptId: string,
  answer: string
): Promise<WeeklyPromptAnswerResponse> {
  return apiClient.post<WeeklyPromptAnswerResponse>('/api/prompts/answers', {
    promptId,
    answer,
  });
}

/**
 * Get current user's answer to a specific prompt
 * SECURITY: firebaseUid is now extracted from Bearer token on backend
 *
 * @param promptId - The prompt ID to fetch answer for
 * @returns Promise resolving to user's answer
 * @throws APIError if fetch fails
 */
export async function getPromptAnswer(
  promptId: string
): Promise<WeeklyPromptAnswerResponse> {
  return apiClient.get<WeeklyPromptAnswerResponse>(
    `/api/prompts/${promptId}/answers/me`
  );
}

/**
 * Get a specific user's answer to a prompt
 * Only works if the user is in your matches for this prompt
 * SECURITY: firebaseUid is now extracted from Bearer token on backend
 *
 * @param promptId - The prompt ID to fetch answer for
 * @param netid - The netid of the user whose answer to fetch
 * @returns Promise resolving to user's answer or null if no answer
 * @throws APIError if fetch fails or user is not in matches
 */
export async function getPromptAnswerByNetid(
  promptId: string,
  netid: string
): Promise<WeeklyPromptAnswerResponse | null> {
  return apiClient.get<WeeklyPromptAnswerResponse | null>(
    `/api/prompts/${promptId}/answers/${netid}`
  );
}

// =============================================================================
// MATCHES API
// =============================================================================

/**
 * Get current user's matches for a specific prompt
 * SECURITY: firebaseUid is now extracted from Bearer token on backend
 *
 * @param promptId - The prompt ID to fetch matches for
 * @returns Promise resolving to match data
 * @throws APIError if fetch fails
 */
export async function getPromptMatches(
  promptId: string
): Promise<WeeklyMatchResponse> {
  return apiClient.get<WeeklyMatchResponse>(`/api/prompts/${promptId}/matches`);
}

/**
 * Get current user's match history across all prompts
 * SECURITY: firebaseUid is now extracted from Bearer token on backend
 *
 * @param limit - Number of matches to return (default: 10)
 * @returns Promise resolving to array of matches
 * @throws APIError if fetch fails
 */
export async function getMatchHistory(
  limit: number = 10
): Promise<WeeklyMatchResponse[]> {
  return apiClient.get<WeeklyMatchResponse[]>(
    `/api/prompts/matches/history?limit=${limit}`
  );
}

/**
 * Reveal a specific match
 * SECURITY: firebaseUid is now extracted from Bearer token on backend
 *
 * @param promptId - The prompt ID
 * @param matchIndex - The index of the match to reveal
 * @returns Promise resolving to revealed match data
 * @throws APIError if reveal fails
 */
export async function revealMatch(
  promptId: string,
  matchIndex: number
): Promise<WeeklyMatchResponse> {
  return apiClient.post<WeeklyMatchResponse>(
    `/api/prompts/${promptId}/matches/reveal`,
    { matchIndex }
  );
}

/**
 * Batch fetch match data (profiles + nudge statuses)
 * This endpoint dramatically reduces API calls by fetching all match data in one request
 * SECURITY: firebaseUid is now extracted from Bearer token on backend
 *
 * @param promptId - The prompt ID
 * @param netids - Array of netids to fetch data for
 * @returns Promise resolving to batch match data
 * @throws APIError if fetch fails
 */
export interface BatchMatchData {
  profiles: ProfileResponse[];
  nudgeStatuses: NudgeStatusResponse[];
}

export async function getBatchMatchData(
  promptId: string,
  netids: string[]
): Promise<BatchMatchData> {
  return apiClient.post<BatchMatchData>(
    `/api/prompts/${promptId}/matches/batch`,
    { netids }
  );
}
