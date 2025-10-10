// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

export interface NotificationItem {
  id: string;
  type: 'match' | 'message' | 'like' | 'profile' | 'system';
  title: string;
  message?: string;
  timestamp: string;
  read: boolean;
}
