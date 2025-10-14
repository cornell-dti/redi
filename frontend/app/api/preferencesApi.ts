import {
  PreferencesResponse,
  UpdatePreferencesInput,
  CreatePreferencesResponse,
} from '@/types';
import { API_BASE_URL } from '../../constants/constants';

/**
 * Gets the current user's dating preferences using their Firebase UID
 * @param firebaseUid - Firebase Authentication UID
 * @returns Promise resolving to user's preferences, or null if not found
 * @throws Error if fetch fails
 */
export const getCurrentUserPreferences = async (
  firebaseUid: string
): Promise<PreferencesResponse | null> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/preferences?firebaseUid=${firebaseUid}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Preferences don't exist yet
      }
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch preferences');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      'Network error. Please check your connection and try again.'
    );
  }
};

/**
 * Updates the current user's dating preferences
 * @param firebaseUid - Firebase Authentication UID
 * @param updateData - Preferences update data
 * @returns Promise resolving to updated preferences
 * @throws Error if update fails or validation errors occur
 */
export const updatePreferences = async (
  firebaseUid: string,
  updateData: UpdatePreferencesInput
): Promise<PreferencesResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firebaseUid,
        ...updateData,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Preferences not found');
      } else if (response.status === 400) {
        // Handle validation errors
        const errors = data.errors || [data.error];
        throw new Error(errors.join(', '));
      } else {
        throw new Error(data.error || 'Failed to update preferences');
      }
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      'Network error. Please check your connection and try again.'
    );
  }
};

/**
 * Creates default preferences for a new user
 * @param firebaseUid - Firebase Authentication UID
 * @returns Promise resolving to created preferences
 * @throws Error if creation fails
 */
export const initializePreferences = async (
  firebaseUid: string
): Promise<PreferencesResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/preferences/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ firebaseUid }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 409) {
        throw new Error('Preferences already exist for this user');
      } else if (response.status === 400) {
        throw new Error(data.error || 'Invalid data');
      } else {
        throw new Error(data.error || 'Failed to create preferences');
      }
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      'Network error. Please check your connection and try again.'
    );
  }
};
