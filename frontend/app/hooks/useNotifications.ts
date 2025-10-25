import { useEffect, useState } from 'react';
import type { NotificationResponse } from '@/types';
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../api/notificationsApi';

/**
 * Hook for managing notifications using the API (not direct Firestore)
 * Polls for updates every 30 seconds to keep notifications fresh
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationResponse[]>(
    []
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch notifications from the API
   */
  const fetchNotifications = async () => {
    try {
      const [notifs, count] = await Promise.all([
        getNotifications(50),
        getUnreadCount(),
      ]);

      setNotifications(notifs);
      setUnreadCount(count);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and optionally poll
  useEffect(() => {
    fetchNotifications(); // Initial fetch

    // Don't set up polling interval here - will be handled by focus-aware logic
  }, []);

  /**
   * Mark a specific notification as read
   * Updates the API and refreshes local state
   */
  const markAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);

      // Optimistically update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // No need to refresh - optimistic update is sufficient
    } catch (err) {
      console.error('Error marking notification as read:', err);
      // Revert on error by refreshing
      await fetchNotifications();
      throw err;
    }
  };

  /**
   * Mark all notifications as read
   * Updates the API and refreshes local state
   */
  const markAllAsRead = async () => {
    try {
      const count = await markAllNotificationsAsRead();

      // Optimistically update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);

      // No need to refresh - optimistic update is sufficient
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      // Revert on error by refreshing
      await fetchNotifications();
      throw err;
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
};
