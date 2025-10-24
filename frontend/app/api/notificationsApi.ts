/**
 * Notifications API Service
 * All endpoints use Bearer token authentication
 */

import type { NotificationResponse } from '@/types';
import { apiClient } from './apiClient';

// =============================================================================
// NOTIFICATIONS API
// =============================================================================

/**
 * Get all notifications for the current user (last 30 days only)
 *
 * @param limit - Maximum number of notifications to return (default: 50)
 * @returns Promise resolving to array of notifications
 * @throws APIError if fetch fails
 */
export async function getNotifications(
  limit: number = 50
): Promise<NotificationResponse[]> {
  return apiClient.get<NotificationResponse[]>(
    `/api/notifications?limit=${limit}`
  );
}

/**
 * Get the count of unread notifications (last 30 days only)
 *
 * @returns Promise resolving to unread count
 * @throws APIError if fetch fails
 */
export async function getUnreadCount(): Promise<number> {
  const response = await apiClient.get<{ count: number }>(
    '/api/notifications/unread-count'
  );
  return response.count;
}

/**
 * Mark a specific notification as read
 *
 * @param notificationId - The notification ID to mark as read
 * @returns Promise resolving to success status
 * @throws APIError if update fails
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<boolean> {
  const response = await apiClient.put<{ success: boolean }>(
    `/api/notifications/${notificationId}/read`,
    {}
  );
  return response.success;
}

/**
 * Mark all notifications as read for the current user
 *
 * @returns Promise resolving to number of notifications marked as read
 * @throws APIError if update fails
 */
export async function markAllNotificationsAsRead(): Promise<number> {
  const response = await apiClient.put<{ success: boolean; count: number }>(
    '/api/notifications/read-all',
    {}
  );
  return response.count;
}
