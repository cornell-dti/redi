/**
 * Real-time Notifications Hook using Firestore Listeners
 * Replaces REST API polling with WebSocket-based real-time updates
 */

import { useEffect, useState, useRef } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import type { NotificationResponse } from '@/types';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../api/notificationsApi';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const POLLING_INTERVAL = 30000; // 30 seconds fallback polling

/**
 * Hook for managing notifications using Firestore real-time listeners
 * Much more efficient than polling - uses WebSocket connections
 */
export const useNotificationsRealtime = () => {
  const [notifications, setNotifications] = useState<NotificationResponse[]>(
    []
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Get user's netid from Firebase auth
   */
  const getNetid = async (): Promise<string | null> => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return null;

      // Get netid from user's email
      const email = currentUser.email;
      if (!email) return null;

      return email.split('@')[0]; // Extract netid from email
    } catch (error) {
      console.error('Error getting netid:', error);
      return null;
    }
  };

  /**
   * Convert Firestore document to NotificationResponse
   */
  const docToNotification = (doc: any): NotificationResponse => {
    const data = doc.data();
    return {
      id: doc.id,
      netid: data.netid,
      type: data.type,
      title: data.title,
      message: data.message,
      read: data.read || false,
      metadata: data.metadata || {},
      createdAt:
        data.createdAt instanceof Date
          ? data.createdAt.toISOString()
          : data.createdAt?.toDate
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString(),
    };
  };

  /**
   * Fallback polling mechanism using REST API
   * Used when Firestore real-time listener fails (e.g., permission errors)
   */
  const setupPolling = async () => {
    console.log('🔄 Setting up fallback polling (30s interval)');
    setUsingFallback(true);

    const pollNotifications = async () => {
      try {
        const notifs = await getNotifications(50);
        const unread = notifs.filter((n) => !n.read).length;

        setNotifications(notifs);
        setUnreadCount(unread);
        setError(null);
        setLoading(false);

        console.log(
          `✅ Notifications polled: ${notifs.length} total, ${unread} unread`
        );
      } catch (err: any) {
        console.error('❌ Polling error:', err);
        setError(err.message || 'Failed to load notifications');
        setLoading(false);
      }
    };

    // Initial fetch
    await pollNotifications();

    // Set up polling interval
    pollingIntervalRef.current = setInterval(
      pollNotifications,
      POLLING_INTERVAL
    );
  };

  /**
   * Set up real-time listener for notifications
   * Falls back to polling if permissions fail
   */
  useEffect(() => {
    if (!isActive) {
      console.log('📭 Notifications listener paused (screen not active)');
      // Clear polling if inactive
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const setupListener = async () => {
      try {
        const netid = await getNetid();
        if (!netid) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }

        const currentUser = auth().currentUser;
        const userEmail = currentUser?.email;

        const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS);

        console.log(
          `🔔 Setting up real-time notifications listener for netid: ${netid}`
        );

        // Set up real-time listener
        unsubscribe = firestore()
          .collection('notifications')
          .where('netid', '==', netid)
          .where('createdAt', '>=', thirtyDaysAgo)
          .orderBy('createdAt', 'desc')
          .limit(50)
          .onSnapshot(
            (snapshot) => {
              const notifs = snapshot.docs.map(docToNotification);
              const unread = notifs.filter((n) => !n.read).length;

              setNotifications(notifs);
              setUnreadCount(unread);
              setError(null);
              setLoading(false);
              setUsingFallback(false);

              console.log(
                `✅ Notifications updated: ${notifs.length} total, ${unread} unread`
              );
            },
            (err) => {
              console.error('❌ Notifications listener error:', err);
              console.error(`❌ User: ${userEmail}, NetID: ${netid}`);

              // Check if it's a permission error
              if (err.code === 'firestore/permission-denied') {
                console.warn(
                  '⚠️ Permission denied - falling back to REST API polling'
                );
                setupPolling();
              } else {
                setError(err.message || 'Failed to load notifications');
                setLoading(false);
              }
            }
          );
      } catch (err: any) {
        console.error('Error setting up notifications listener:', err);

        // Fall back to polling on any setup error
        console.warn(
          '⚠️ Listener setup failed - falling back to REST API polling'
        );
        setupPolling();
      }
    };

    setupListener();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        console.log('🔇 Unsubscribing from notifications listener');
        unsubscribe();
      }
      if (pollingIntervalRef.current) {
        console.log('🔇 Clearing polling interval');
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isActive]);

  /**
   * Mark a specific notification as read
   * Updates via API (which updates Firestore), listener will pick up the change
   */
  const markAsRead = async (notificationId: string) => {
    try {
      // Optimistically update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Update via API
      await markNotificationAsRead(notificationId);

      // Real-time listener will pick up the change and update state
    } catch (err) {
      console.error('Error marking notification as read:', err);
      // Listener will revert optimistic update automatically
      throw err;
    }
  };

  /**
   * Mark all notifications as read
   * Updates via API (which updates Firestore), listener will pick up the change
   */
  const markAllAsRead = async () => {
    try {
      // Optimistically update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);

      // Update via API
      await markAllNotificationsAsRead();

      // Real-time listener will pick up the change and update state
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      // Listener will revert optimistic update automatically
      throw err;
    }
  };

  /**
   * Pause/resume listener
   * Useful for when screen is not focused
   */
  const setActive = (active: boolean) => {
    setIsActive(active);
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    setActive,
    usingFallback, // Expose whether we're using polling fallback
    refresh: async () => {
      /* No need to manually refresh with real-time listeners */
    },
  };
};
