/**
 * Blocking API Service
 * All endpoints use Bearer token authentication
 */

import { apiClient } from './apiClient';

// =============================================================================
// BLOCKING API
// =============================================================================

export interface BlockUserResponse {
  message: string;
  blockerNetid: string;
  blockedNetid: string;
}

export interface UnblockUserResponse {
  message: string;
  blockerNetid: string;
  blockedNetid: string;
}

export interface BlockedUsersResponse {
  blockerNetid: string;
  blockedUsers: string[];
  count: number;
}

/**
 * Block a user by their netid
 *
 * @param netid - The netid of the user to block
 * @returns Promise resolving to block confirmation
 * @throws APIError if block fails (self-blocking, already blocked, user not found, etc.)
 */
export async function blockUser(netid: string): Promise<BlockUserResponse> {
  return apiClient.post<BlockUserResponse>(`/api/profiles/${netid}/block`, {});
}

/**
 * Unblock a user by their netid
 *
 * @param netid - The netid of the user to unblock
 * @returns Promise resolving to unblock confirmation
 * @throws APIError if unblock fails (not blocked, user not found, etc.)
 */
export async function unblockUser(netid: string): Promise<UnblockUserResponse> {
  return apiClient.delete<UnblockUserResponse>(
    `/api/profiles/${netid}/block`
  );
}

/**
 * Get list of users blocked by the current user
 *
 * @param netid - The netid of the user (typically current user's netid)
 * @returns Promise resolving to list of blocked user netids
 * @throws APIError if fetch fails
 */
export async function getBlockedUsers(
  netid: string
): Promise<BlockedUsersResponse> {
  return apiClient.get<BlockedUsersResponse>(
    `/api/profiles/${netid}/blocked`
  );
}
