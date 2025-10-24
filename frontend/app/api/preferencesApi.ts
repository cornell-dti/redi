/**
 * Preferences API Service
 * SECURITY UPDATE: All endpoints now use Bearer token authentication
 * firebaseUid is extracted from the authenticated token on the backend
 */

import {
  PreferencesResponse,
  UpdatePreferencesInput,
  CreatePreferencesResponse,
} from '@/types';
import { apiClient } from './apiClient';

/**
 * Gets the current user's dating preferences
 * SECURITY: firebaseUid is now extracted from Bearer token on backend
 *
 * @returns Promise resolving to user's preferences, or null if not found
 * @throws APIError if fetch fails
 */
export const getCurrentUserPreferences =
  async (): Promise<PreferencesResponse | null> => {
    try {
      return await apiClient.get<PreferencesResponse>('/api/preferences');
    } catch (error: any) {
      // Preferences don't exist yet - return null (not an error)
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  };

/**
 * Updates the current user's dating preferences
 * SECURITY: firebaseUid is now extracted from Bearer token on backend
 *
 * @param updateData - Preferences update data
 * @returns Promise resolving to updated preferences
 * @throws APIError if update fails or validation errors occur
 */
export const updatePreferences = async (
  updateData: UpdatePreferencesInput
): Promise<PreferencesResponse> => {
  return apiClient.put<PreferencesResponse>('/api/preferences', updateData);
};

/**
 * Creates default preferences for the current user (called during onboarding)
 * SECURITY: firebaseUid is now extracted from Bearer token on backend
 *
 * @returns Promise resolving to created preferences
 * @throws APIError if creation fails or preferences already exist
 */
export const initializePreferences = async (): Promise<PreferencesResponse> => {
  return apiClient.post<PreferencesResponse>('/api/preferences/initialize');
};
