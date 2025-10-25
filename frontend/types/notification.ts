// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

export type NotificationType = 'mutual_nudge' | 'new_message';

export interface NotificationResponse {
  id: string; // Document ID
  netid: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  metadata: {
    promptId?: string;
    matchNetid?: string;
    conversationId?: string; // Auto-created conversation ID for mutual nudges
    matchName?: string; // Matched user's name
    matchFirebaseUid?: string; // Matched user's Firebase UID
    chatId?: string;
  };
  createdAt: string; // ISO string format
}

export interface CreateNotificationInput {
  netid: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: {
    promptId?: string;
    matchNetid?: string;
    conversationId?: string; // Auto-created conversation ID for mutual nudges
    matchName?: string; // Matched user's name
    matchFirebaseUid?: string; // Matched user's Firebase UID
    chatId?: string;
  };
}
