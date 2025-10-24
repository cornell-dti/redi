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

  // Initial fetch on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Poll for updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
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

      // Refresh from server to ensure consistency
      await fetchNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
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

      // Refresh from server to ensure consistency
      await fetchNotifications();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
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
