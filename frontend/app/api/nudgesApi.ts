/**
 * Nudges API Service
 * All endpoints use Bearer token authentication
 */

import type { NudgeResponse, NudgeStatusResponse } from '@/types';
import { apiClient } from './apiClient';

// =============================================================================
// NUDGES API
// =============================================================================

/**
 * Send a nudge to a matched user
 *
 * @param toNetid - The netid of the user to nudge
 * @param promptId - The prompt ID for this week's match
 * @returns Promise resolving to created nudge
 * @throws APIError if nudge fails (already sent, not matched, etc.)
 */
export async function sendNudge(
  toNetid: string,
  promptId: string
): Promise<NudgeResponse> {
  return apiClient.post<NudgeResponse>('/api/nudges', {
    toNetid,
    promptId,
  });
}

/**
 * Get nudge status between current user and a matched user
 *
 * @param promptId - The prompt ID
 * @param matchNetid - The matched user's netid
 * @returns Promise resolving to nudge status
 * @throws APIError if fetch fails
 */
export async function getNudgeStatus(
  promptId: string,
  matchNetid: string
): Promise<NudgeStatusResponse> {
  return apiClient.get<NudgeStatusResponse>(
    `/api/nudges/${promptId}/${matchNetid}/status`
  );
}
