import { API_BASE_URL } from '../../constants/constants';

export interface UserResponse {
  netid: string;
  email: string;
  createdAt: string;
}

export interface CreateUserResponse {
  id: string;
  netid: string;
  email: string;
  message: string;
}

export interface LoginResponse {
  message: string;
  user: UserResponse;
}

export interface ApiError {
  error: string;
}

/**
 * Creates a new user in the backend from Firebase Auth data
 * @param email - Cornell email address
 * @param firebaseUid - Firebase Authentication UID
 * @returns Promise resolving to user creation response
 * @throws Error if creation fails or email is invalid
 */
export const createUserInBackend = async (
  email: string, 
  firebaseUid: string
): Promise<CreateUserResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/firebase-create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        firebaseUid,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create user in backend');
    }

    return data;
  } catch (error) {
    console.error('Backend user creation error:', error);
    throw error;
  }
};

/**
 * Authenticates user login in the backend
 * @param email - Cornell email address
 * @param firebaseUid - Firebase Authentication UID
 * @returns Promise resolving to login response
 * @throws Error if login fails or user not found
 */
export const loginUserInBackend = async (
  email: string, 
  firebaseUid: string
): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/firebase-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        firebaseUid,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to login user in backend');
    }

    return data;
  } catch (error) {
    console.error('Backend login error:', error);
    throw error;
  }
};

/**
 * Retrieves all users from the backend (admin function)
 * @returns Promise resolving to array of users
 * @throws Error if fetch fails
 */
export const getAllUsers = async (): Promise<UserResponse[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch users');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Retrieves a specific user by netid
 * @param netid - Cornell netid
 * @returns Promise resolving to user data
 * @throws Error if user not found or fetch fails
 */
export const getUserByNetid = async (netid: string): Promise<UserResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${netid}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch user');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

/**
 * Deletes a user by netid
 * @param netid - Cornell netid
 * @returns Promise resolving to deletion confirmation
 * @throws Error if deletion fails or user not found
 */
export const deleteUser = async (netid: string): Promise<{ message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${netid}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete user');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};