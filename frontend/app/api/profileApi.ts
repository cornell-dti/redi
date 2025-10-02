import {
  CreateProfileInput,
  CreateProfileResponse,
  ProfileResponse,
  UpdateProfileInput,
} from '@/types';
import { API_BASE_URL } from '../../constants/constants';

/**
 * Gets the current user's profile using their Firebase UID
 * @param firebaseUid - Firebase Authentication UID
 * @returns Promise resolving to user's profile
 * @throws Error if profile not found or fetch fails
 */
export const getCurrentUserProfile = async (
  firebaseUid: string
): Promise<ProfileResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/profiles/me?firebaseUid=${firebaseUid}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    throw error;
  }
};

/**
 * Creates a new profile for the current user
 * @param firebaseUid - Firebase Authentication UID
 * @param profileData - Profile creation data
 * @returns Promise resolving to creation response
 * @throws Error if creation fails or validation errors occur
 */
export const createProfile = async (
  firebaseUid: string,
  profileData: CreateProfileInput
): Promise<CreateProfileResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firebaseUid,
        ...profileData,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create profile');
    }

    return data;
  } catch (error) {
    console.error('Profile creation error:', error);
    throw error;
  }
};

/**
 * Updates the current user's profile
 * @param firebaseUid - Firebase Authentication UID
 * @param updateData - Profile update data
 * @returns Promise resolving to update confirmation
 * @throws Error if update fails or validation errors occur
 */
export const updateProfile = async (
  firebaseUid: string,
  updateData: UpdateProfileInput
): Promise<{ message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/profiles/me`, {
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
      throw new Error(data.error || 'Failed to update profile');
    }

    return data;
  } catch (error) {
    console.error('Profile update error:', error);
    throw error;
  }
};

/**
 * Deletes the current user's profile
 * @param firebaseUid - Firebase Authentication UID
 * @returns Promise resolving to deletion confirmation
 * @throws Error if deletion fails
 */
export const deleteProfile = async (
  firebaseUid: string
): Promise<{ message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/profiles/me`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ firebaseUid }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting profile:', error);
    throw error;
  }
};

/**
 * Gets a specific profile by netid (for viewing other users)
 * @param netid - Cornell netid
 * @returns Promise resolving to profile data
 * @throws Error if profile not found or fetch fails
 */
export const getProfileByNetid = async (
  netid: string
): Promise<ProfileResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/profiles/${netid}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

/**
 * Gets potential matches for the current user
 * @param firebaseUid - Firebase Authentication UID
 * @param limit - Number of matches to return (default: 20)
 * @returns Promise resolving to array of potential matches
 * @throws Error if fetch fails
 */
export const getMatches = async (
  firebaseUid: string,
  limit: number = 20
): Promise<ProfileResponse[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/profiles/matches?firebaseUid=${firebaseUid}&limit=${limit}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch matches');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching matches:', error);
    throw error;
  }
};

/**
 * Gets all profiles with optional filters (admin function)
 * @param options - Filter options
 * @returns Promise resolving to array of profiles
 * @throws Error if fetch fails
 */
export const getAllProfiles = async (
  options: {
    limit?: number;
    gender?: 'female' | 'male' | 'non-binary';
    school?: string;
    minYear?: number;
    maxYear?: number;
    excludeNetid?: string;
  } = {}
): Promise<ProfileResponse[]> => {
  try {
    const params = new URLSearchParams();

    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(
      `${API_BASE_URL}/api/profiles?${params.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch profiles');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching profiles:', error);
    throw error;
  }
};
