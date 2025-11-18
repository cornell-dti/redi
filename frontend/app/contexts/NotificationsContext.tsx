import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useRef,
} from 'react';
import { useNotificationsRealtime as useNotificationsHook } from '../hooks/useNotificationsRealtime';
import type { NotificationResponse } from '@/types';
import {
  registerForPushNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
} from '../services/notificationPermissions';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

/**
 * Context for managing notifications across the app
 * Uses Firestore real-time listeners instead of polling for better performance
 * and real-time updates
 */

interface NotificationsContextType {
  notifications: NotificationResponse[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
  setActive?: (active: boolean) => void;
}

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  // Single instance of the notifications hook
  const notificationsData = useNotificationsHook();
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Register for push notifications on mount
    registerForPushNotifications().catch((error) => {
      console.error('Failed to register for push notifications:', error);
    });

    // Set up notification received listener (when app is open)
    notificationListener.current = addNotificationReceivedListener(
      (notification) => {
        console.log('📩 Notification received:', notification);
        // Trigger refresh to show new notification
        notificationsData.refresh();
      }
    );

    // Set up notification response listener (when user taps notification)
    responseListener.current = addNotificationResponseListener((response) => {
      console.log('👆 Notification tapped:', response);
      const data = response.notification.request.content.data;

      // Navigate based on notification type
      if (data.type === 'new_message' && data.conversationId) {
        router.push(
          `/chat-detail?conversationId=${data.conversationId}${
            data.senderId ? `&userId=${data.senderId}` : ''
          }${
            data.senderName
              ? `&name=${encodeURIComponent(data.senderName as string)}`
              : ''
          }${data.senderNetid ? `&netid=${data.senderNetid}` : ''}` as any
        );
      } else if (data.type === 'match_drop') {
        router.push('/(auth)/(tabs)/' as any); // Navigate to matches tab
      } else if (data.type === 'mutual_nudge' && data.conversationId) {
        router.push(
          `/chat-detail?conversationId=${data.conversationId}${
            data.matchFirebaseUid ? `&userId=${data.matchFirebaseUid}` : ''
          }${
            data.matchName
              ? `&name=${encodeURIComponent(data.matchName as string)}`
              : ''
          }${data.matchNetid ? `&netid=${data.matchNetid}` : ''}` as any
        );
      }
    });

    // Clean up listeners on unmount
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <NotificationsContext.Provider value={notificationsData}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used within NotificationsProvider'
    );
  }
  return context;
}
