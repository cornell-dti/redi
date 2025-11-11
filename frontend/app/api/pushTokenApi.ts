/**
 * Push Token API Service
 * All endpoints use Bearer token authentication
 */

import { apiClient } from './apiClient';

// =============================================================================
// PUSH TOKEN API
// =============================================================================

/**
 * Register a push notification token for the current user
 *
 * @param pushToken - Expo push notification token
 * @returns Promise resolving to success status
 * @throws APIError if registration fails
 */
export async function registerPushToken(pushToken: string): Promise<boolean> {
  try {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
    }>('/api/users/push-token', { pushToken });
    return response.success;
  } catch (error) {
    console.error('Error registering push token:', error);
    throw error;
  }
}

/**
 * Remove the current user's push notification token
 *
 * @returns Promise resolving to success status
 * @throws APIError if removal fails
 */
export async function removePushToken(): Promise<boolean> {
  try {
    const response = await apiClient.delete<{
      success: boolean;
      message: string;
    }>('/api/users/push-token');
    return response.success;
  } catch (error) {
    console.error('Error removing push token:', error);
    throw error;
  }
}

// =============================================================================
// NOTIFICATION PREFERENCES API
// =============================================================================

export interface NotificationPreferences {
  newMessages: boolean;
  matchDrops: boolean;
  mutualNudges: boolean;
}

/**
 * Get the current user's notification preferences
 *
 * @returns Promise resolving to notification preferences
 * @throws APIError if fetch fails
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    return await apiClient.get<NotificationPreferences>(
      '/api/users/notification-preferences'
    );
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    throw error;
  }
}

/**
 * Update the current user's notification preferences
 *
 * @param preferences - Partial notification preferences to update
 * @returns Promise resolving to updated preferences
 * @throws APIError if update fails
 */
export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  try {
    const response = await apiClient.put<{
      success: boolean;
      message: string;
      preferences: NotificationPreferences;
    }>('/api/users/notification-preferences', preferences);
    return response.preferences;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
}
