import React, { createContext, useContext, ReactNode } from 'react';
import { useNotifications as useNotificationsHook } from '../hooks/useNotifications';
import type { NotificationResponse } from '@/types';

/**
 * Context for managing notifications across the app
 * Provides a single instance of useNotifications to avoid duplicate polling
 */

interface NotificationsContextType {
  notifications: NotificationResponse[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
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
