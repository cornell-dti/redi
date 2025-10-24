import auth from '@react-native-firebase/auth';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FIREBASE_DB } from '../../firebase';
import type { NotificationResponse } from '@/types';

const NOTIFICATIONS_COLLECTION = 'notifications';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Hook for managing notifications with real-time updates
 * Automatically subscribes to notifications for the current user
 * Only fetches notifications from the last 30 days
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user = auth().currentUser;
  const userNetid = user?.email?.split('@')[0]; // Extract netid from email

  useEffect(() => {
    if (!userNetid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Calculate timestamp for 30 days ago
    const thirtyDaysAgo = Timestamp.fromDate(
      new Date(Date.now() - THIRTY_DAYS_MS)
    );

    // Create query for user's notifications (last 30 days only)
    const notificationsQuery = query(
      collection(FIREBASE_DB, NOTIFICATIONS_COLLECTION),
      where('netid', '==', userNetid),
      where('createdAt', '>=', thirtyDaysAgo),
      orderBy('createdAt', 'desc')
    );

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notifs: NotificationResponse[] = [];
        let unreadTotal = 0;

        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();

          // Convert Firestore timestamp to ISO string
          const createdAt = data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : new Date(data.createdAt).toISOString();

          const notification: NotificationResponse = {
            id: docSnapshot.id,
            netid: data.netid,
            type: data.type,
            title: data.title,
            message: data.message,
            read: data.read,
            metadata: data.metadata || {},
            createdAt,
          };

          notifs.push(notification);

          if (!data.read) {
            unreadTotal += 1;
          }
        });

        setNotifications(notifs);
        setUnreadCount(unreadTotal);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications');
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [userNetid]);

  /**
   * Mark a specific notification as read
   * Updates Firestore and the UI optimistically updates via listener
   */
  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(
        FIREBASE_DB,
        NOTIFICATIONS_COLLECTION,
        notificationId
      );
      await updateDoc(notificationRef, { read: true });
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  };

  /**
   * Mark all notifications as read
   * Updates Firestore and the UI optimistically updates via listener
   */
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.read);

      // Update all unread notifications in parallel
      await Promise.all(
        unreadNotifications.map((notification) =>
          updateDoc(doc(FIREBASE_DB, NOTIFICATIONS_COLLECTION, notification.id), {
            read: true,
          })
        )
      );
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
  };
};
