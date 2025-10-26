import React, { createContext, useContext, ReactNode } from 'react';
import { useNotificationsRealtime as useNotificationsHook } from '../hooks/useNotificationsRealtime';
import type { NotificationResponse } from '@/types';

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
