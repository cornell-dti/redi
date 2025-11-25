// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

export type NotificationType =
  | 'mutual_nudge'
  | 'new_message'
  | 'match_drop'
  | 'admin_broadcast';

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
    senderId?: string; // For new_message (sender's Firebase UID)
    senderName?: string; // For new_message (sender's name)
    senderNetid?: string; // For new_message (sender's netid)
    matchCount?: number; // For match_drop (number of new matches)
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
    senderId?: string;
    senderName?: string;
    senderNetid?: string;
    matchCount?: number;
  };
}
