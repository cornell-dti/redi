/**
 * Profile API Service
 * SECURITY UPDATE: All endpoints now use Bearer token authentication
 * firebaseUid is extracted from the authenticated token on the backend
 */

import {
  CreateProfileInput,
  CreateProfileResponse,
  ProfileResponse,
  OwnProfileResponse,
  UpdateProfileInput,
  Gender,
} from '@/types';
import { apiClient } from './apiClient';

/**
 * Gets the current user's profile using their authenticated token
 * SECURITY: firebaseUid is now extracted from Bearer token on backend
 *
 * Returns OwnProfileResponse which includes birthdate and full profile data
 *
 * @returns Promise resolving to user's own profile, or null if not found
 * @throws APIError if fetch fails
 */
export const getCurrentUserProfile = async (): Promise<OwnProfileResponse | null> => {
  try {
    return await apiClient.get<OwnProfileResponse>('/api/profiles/me');
  } catch (error: any) {
    // Profile doesn't exist yet - return null (not an error)
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
};

/**
 * Creates a new profile for the current user
 * SECURITY: firebaseUid is now extracted from Bearer token on backend
 *
 * @param profileData - Profile creation data
 * @returns Promise resolving to creation response
 * @throws APIError if creation fails or validation errors occur
 */
export const createProfile = async (
  profileData: CreateProfileInput
): Promise<CreateProfileResponse> => {
  return apiClient.post<CreateProfileResponse>('/api/profiles', profileData);
};

/**
 * Updates the current user's profile
 * SECURITY: firebaseUid is now extracted from Bearer token on backend
 *
 * @param updateData - Profile update data
 * @returns Promise resolving to update confirmation
 * @throws APIError if update fails or validation errors occur
 */
export const updateProfile = async (
  updateData: UpdateProfileInput
): Promise<{ message: string }> => {
  return apiClient.put<{ message: string }>('/api/profiles/me', updateData);
};

/**
 * Deletes the current user's profile
 * SECURITY: firebaseUid is now extracted from Bearer token on backend
 *
 * @returns Promise resolving to deletion confirmation
 * @throws APIError if deletion fails
 */
export const deleteProfile = async (): Promise<{ message: string }> => {
  return apiClient.delete<{ message: string }>('/api/profiles/me');
};

/**
 * Gets a specific profile by netid (for viewing other users)
 * SECURITY: Requires authentication, privacy filters applied on backend
 *
 * Returns different profile shapes based on relationship:
 * - PublicProfileResponse: For users you haven't matched with (includes age, not birthdate)
 * - MatchedProfileResponse: For users you've matched with (includes birthdate)
 *
 * @param netid - Cornell netid
 * @returns Promise resolving to profile data (filtered based on relationship)
 * @throws APIError if profile not found or fetch fails
 */
export const getProfileByNetid = async (
  netid: string
): Promise<ProfileResponse> => {
  return apiClient.get<ProfileResponse>(`/api/profiles/${netid}`);
};

/**
 * Gets potential matches for the current user
 * SECURITY: firebaseUid is now extracted from Bearer token on backend
 *
 * Returns PublicProfileResponse with age field (not birthdate) for privacy
 *
 * @param limit - Number of matches to return (default: 20)
 * @returns Promise resolving to array of potential matches (public profiles)
 * @throws APIError if fetch fails
 */
export const getMatches = async (
  limit: number = 20
): Promise<ProfileResponse[]> => {
  return apiClient.get<ProfileResponse[]>(
    `/api/profiles/matches?limit=${limit}`
  );
};

/**
 * Gets all profiles with optional filters
 * SECURITY: Requires authentication, privacy filters applied, blocked users filtered
 *
 * Returns ProfileResponse which may be:
 * - PublicProfileResponse: For users you haven't matched with (includes age, not birthdate)
 * - MatchedProfileResponse: For users you've matched with (includes birthdate)
 *
 * @param options - Filter options
 * @returns Promise resolving to array of profiles (privacy-filtered)
 * @throws APIError if fetch fails
 */
export const getAllProfiles = async (
  options: {
    limit?: number;
    gender?: Gender;
    school?: string;
    minYear?: number;
    maxYear?: number;
    excludeNetid?: string;
  } = {}
): Promise<ProfileResponse[]> => {
  const params = new URLSearchParams();

  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  });

  const queryString = params.toString();
  const endpoint = queryString ? `/api/profiles?${queryString}` : '/api/profiles';

  return apiClient.get<ProfileResponse[]>(endpoint);
};
