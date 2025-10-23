/**
 * User API Service
 *
 * SECURITY UPDATE: All endpoints now use Bearer token authentication.
 * firebaseUid is extracted from the authenticated token on the backend.
 */

import { apiClient } from './apiClient';
import type { UserResponse, CreateUserResponse, LoginResponse } from '@/types';

export interface ApiError {
  error: string;
}

/**
 * Creates a new user in the backend from Firebase Auth data
 * SECURITY: firebaseUid is now extracted from Bearer token on backend
 *
 * @param email - Cornell email address
 * @returns Promise resolving to user creation response
 * @throws APIError if creation fails or email is invalid
 */
export const createUserInBackend = async (
  email: string
): Promise<CreateUserResponse> => {
  return apiClient.post<CreateUserResponse>('/api/users/firebase-create', {
    email,
  });
};

/**
 * Authenticates user login in the backend
 * SECURITY: firebaseUid is now extracted from Bearer token on backend
 *
 * @param email - Cornell email address
 * @returns Promise resolving to login response
 * @throws APIError if login fails or user not found
 */
export const loginUserInBackend = async (
  email: string
): Promise<LoginResponse> => {
  return apiClient.post<LoginResponse>('/api/users/firebase-login', {
    email,
  });
};

/**
 * Retrieves all users from the backend (admin function)
 * SECURITY: Requires admin authentication
 *
 * @returns Promise resolving to array of users
 * @throws APIError if fetch fails or user is not admin
 */
export const getAllUsers = async (): Promise<UserResponse[]> => {
  return apiClient.get<UserResponse[]>('/api/users');
};

/**
 * Retrieves a specific user by netid
 * SECURITY: Requires authentication, can only view own data (unless admin)
 *
 * @param netid - Cornell netid
 * @returns Promise resolving to user data
 * @throws APIError if user not found or unauthorized
 */
export const getUserByNetid = async (netid: string): Promise<UserResponse> => {
  return apiClient.get<UserResponse>(`/api/users/${netid}`);
};

/**
 * Deletes a user by netid
 * SECURITY: Requires authentication, can only delete own account (unless admin)
 *
 * @param netid - Cornell netid
 * @returns Promise resolving to deletion confirmation
 * @throws APIError if deletion fails, user not found, or unauthorized
 */
export const deleteUser = async (
  netid: string
): Promise<{ message: string }> => {
  return apiClient.delete<{ message: string }>(`/api/users/${netid}`);
};
