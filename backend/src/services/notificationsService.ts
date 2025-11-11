import { db } from '../../firebaseAdmin';
import {
  NotificationDoc,
  NotificationDocWrite,
  NotificationResponse,
  NotificationType,
} from '../../types';
import { FieldValue } from 'firebase-admin/firestore';

const NOTIFICATIONS_COLLECTION = 'notifications';

// 30 days in milliseconds
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// =============================================================================
// NOTIFICATION OPERATIONS
// =============================================================================

/**
 * Create a notification for a user
 * @param netid - User receiving the notification
 * @param type - Type of notification
 * @param title - Notification title
 * @param message - Notification message
 * @param metadata - Additional metadata (promptId, matchNetid, conversationId, matchName,
 *                   matchFirebaseUid, chatId, etc.)
 * @returns Promise resolving to the created notification ID
 */
export async function createNotification(
  netid: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata: {
    promptId?: string;
    matchNetid?: string;
    conversationId?: string;
    matchName?: string;
    matchFirebaseUid?: string;
    chatId?: string;
    senderId?: string;
    senderName?: string;
    senderNetid?: string;
    matchCount?: number;
  } = {}
): Promise<string> {
  const notificationDoc: NotificationDocWrite = {
    netid,
    type,
    title,
    message,
    read: false,
    metadata,
    createdAt: FieldValue.serverTimestamp(),
  };

  const docRef = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .add(notificationDoc);
  return docRef.id;
}

/**
 * Get all notifications for a user (only last 30 days)
 * @param netid - User's Cornell NetID
 * @param limit - Maximum number of notifications to return (default: 50)
 * @returns Promise resolving to array of NotificationResponse
 */
export async function getUserNotifications(
  netid: string,
  limit: number = 50
): Promise<NotificationResponse[]> {
  // Calculate timestamp for 30 days ago
  const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS);

  const snapshot = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .where('netid', '==', netid)
    .where('createdAt', '>=', thirtyDaysAgo)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data() as NotificationDoc;
    return notificationToResponse(doc.id, data);
  });
}

/**
 * Get unread notification count for a user (only last 30 days)
 * @param netid - User's Cornell NetID
 * @returns Promise resolving to number of unread notifications
 */
export async function getUnreadCount(netid: string): Promise<number> {
  // Calculate timestamp for 30 days ago
  const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS);

  const snapshot = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .where('netid', '==', netid)
    .where('read', '==', false)
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  return snapshot.size;
}

/**
 * Mark a notification as read
 * @param notificationId - The notification document ID
 * @param netid - User's netid (for verification)
 * @returns Promise resolving to boolean indicating success
 */
export async function markAsRead(
  notificationId: string,
  netid: string
): Promise<boolean> {
  const notificationRef = db
    .collection(NOTIFICATIONS_COLLECTION)
    .doc(notificationId);
  const notification = await notificationRef.get();

  if (!notification.exists) {
    throw new Error('Notification not found');
  }

  const data = notification.data() as NotificationDoc;

  // Verify the notification belongs to this user
  if (data.netid !== netid) {
    throw new Error('Unauthorized: Notification does not belong to this user');
  }

  await notificationRef.update({ read: true });
  return true;
}

/**
 * Mark all notifications as read for a user
 * @param netid - User's Cornell NetID
 * @returns Promise resolving to number of notifications marked as read
 */
export async function markAllAsRead(netid: string): Promise<number> {
  const snapshot = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .where('netid', '==', netid)
    .where('read', '==', false)
    .get();

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { read: true });
  });

  await batch.commit();
  return snapshot.size;
}

/**
 * Delete notifications older than 30 days
 * This can be called periodically or on-demand
 * @returns Promise resolving to number of notifications deleted
 */
export async function deleteOldNotifications(): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS);

  const snapshot = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .where('createdAt', '<', thirtyDaysAgo)
    .get();

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  return snapshot.size;
}

/**
 * Convert NotificationDoc to NotificationResponse (for API responses)
 * @param id - The notification document ID
 * @param notificationDoc - The notification document from Firestore
 * @returns NotificationResponse with ISO string timestamps
 */
export function notificationToResponse(
  id: string,
  notificationDoc: NotificationDoc
): NotificationResponse {
  return {
    id,
    netid: notificationDoc.netid,
    type: notificationDoc.type,
    title: notificationDoc.title,
    message: notificationDoc.message,
    read: notificationDoc.read,
    metadata: notificationDoc.metadata,
    createdAt:
      notificationDoc.createdAt instanceof Date
        ? notificationDoc.createdAt.toISOString()
        : notificationDoc.createdAt.toDate().toISOString(),
  };
}
