import { CreateProfilePayload } from '../utils/onboardingTransform';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export interface ProfileCreationResponse {
  id: string;
  netid: string;
  message: string;
}

export interface ApiError {
  error: string;
}

/**
 * Creates a new profile via POST /api/profiles
 */
export async function createProfile(
  payload: CreateProfilePayload
): Promise<ProfileCreationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 409) {
        throw new Error('Profile already exists for this user');
      } else if (response.status === 400) {
        throw new Error(data.error || 'Invalid profile data');
      } else if (response.status === 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(data.error || 'Failed to create profile');
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
}

/**
 * Gets the current user's profile via GET /api/profiles/me
 */
export async function getCurrentUserProfile(firebaseUid: string) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/profiles/me?firebaseUid=${firebaseUid}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Profile doesn't exist yet
      }
      throw new Error(data.error || 'Failed to fetch profile');
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
}
