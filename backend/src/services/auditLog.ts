/**
 * Audit Logging Service
 *
 * Provides comprehensive audit logging for admin actions.
 * All admin operations are logged to the 'adminAuditLogs' Firestore collection
 * for security, compliance, and debugging purposes.
 */

import { db } from '../../firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Types of resources that can be audited
 */
export type AuditResourceType =
  | 'prompt'
  | 'prompts'
  | 'match'
  | 'matches'
  | 'user'
  | 'users'
  | 'admin'
  | 'report'
  | 'analytics'
  | 'notifications'
  | 'system';

/**
 * Types of actions that can be logged
 */
export type AuditAction =
  // Prompt actions
  | 'CREATE_PROMPT'
  | 'UPDATE_PROMPT'
  | 'DELETE_PROMPT'
  | 'ACTIVATE_PROMPT'
  | 'GENERATE_MATCHES'
  | 'VIEW_PROMPT_ANSWERS'
  | 'FIX_MULTIPLE_ACTIVE' // Emergency cleanup for multiple active prompts
  // Admin actions
  | 'ADD_ADMIN'
  | 'REMOVE_ADMIN'
  | 'UPDATE_ADMIN'
  // User actions
  | 'VIEW_USER'
  | 'VIEW_USERS'
  | 'UPDATE_USER'
  | 'DELETE_USER'
  // Match actions
  | 'VIEW_MATCH_STATS'
  | 'VIEW_PROMPT_MATCHES'
  | 'CREATE_MANUAL_MATCH'
  // Report actions
  | 'UPDATE_REPORT_STATUS'
  | 'RESOLVE_REPORT'
  // Analytics actions
  | 'VIEW_DEMOGRAPHICS_ANALYTICS'
  | 'VIEW_COMPATIBILITY_ANALYTICS'
  | 'VIEW_ENGAGEMENT_ANALYTICS'
  | 'VIEW_NUDGE_ANALYTICS'
  // Notification actions
  | 'SEND_BROADCAST_NOTIFICATION'
  // System actions
  | 'ADMIN_LOGIN'
  | 'ADMIN_LOGOUT'
  | 'SYSTEM_ERROR';

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  action: AuditAction;
  adminUid: string;
  adminEmail?: string;
  resourceType: AuditResourceType;
  resourceId: string;
  details?: Record<string, any>;
  timestamp: Timestamp;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * Response format for audit log queries
 */
export interface AuditLogResponse extends Omit<AuditLogEntry, 'timestamp'> {
  id: string;
  timestamp: string;
}

/**
 * Logs an admin action to the audit log
 *
 * This function creates a permanent record of admin actions for:
 * - Security auditing
 * - Compliance requirements
 * - Debugging and troubleshooting
 * - Historical tracking
 *
 * @param action - Type of action performed (e.g., 'CREATE_PROMPT')
 * @param adminUid - Firebase UID of the admin performing the action
 * @param adminEmail - Email of the admin (optional but recommended)
 * @param resourceType - Type of resource affected (e.g., 'prompt')
 * @param resourceId - ID of the specific resource (e.g., prompt ID)
 * @param details - Additional details about the action (optional)
 * @param ipAddress - IP address of the admin (optional)
 * @param userAgent - User agent string (optional)
 * @param success - Whether the action succeeded (default: true)
 * @param errorMessage - Error message if action failed (optional)
 *
 * @returns Promise<string> - The ID of the created audit log document
 *
 * @example
 * await logAdminAction(
 *   'CREATE_PROMPT',
 *   'admin-uid-123',
 *   'admin@cornell.edu',
 *   'prompt',
 *   '2025-W42',
 *   { question: 'What is your favorite spot on campus?' },
 *   '192.168.1.1'
 * );
 */
export async function logAdminAction(
  action: AuditAction,
  adminUid: string,
  adminEmail: string | undefined,
  resourceType: AuditResourceType,
  resourceId: string,
  details?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string,
  success: boolean = true,
  errorMessage?: string
): Promise<string> {
  try {
    // Build log entry with only defined fields to avoid Firestore undefined errors
    const logEntry: Record<string, any> = {
      action,
      adminUid,
      resourceType,
      resourceId,
      timestamp: Timestamp.now(),
      success,
    };

    // Only add optional fields if they have defined values
    if (adminEmail !== undefined) logEntry.adminEmail = adminEmail;
    if (details !== undefined) logEntry.details = sanitizeDetails(details);
    if (ipAddress !== undefined) logEntry.ipAddress = ipAddress;
    if (userAgent !== undefined) logEntry.userAgent = userAgent;
    if (errorMessage !== undefined) logEntry.errorMessage = errorMessage;

    const docRef = await db
      .collection('adminAuditLogs')
      .add(logEntry as AuditLogEntry);

    console.log(
      `📝 [Audit Log] ${action} by ${adminEmail || adminUid} on ${resourceType}:${resourceId}`
    );

    return docRef.id;
  } catch (error) {
    // Audit logging should never break the main operation
    // Log to console but don't throw
    console.error('❌ [Audit Log] Failed to write audit log:', error);
    console.error('   Action:', action);
    console.error('   Admin:', adminUid);
    console.error('   Resource:', `${resourceType}:${resourceId}`);
    return '';
  }
}

/**
 * Retrieves audit logs with optional filtering
 *
 * @param options - Query options for filtering logs
 * @returns Promise<AuditLogResponse[]> - Array of audit log entries
 */
export async function getAuditLogs(options?: {
  adminUid?: string;
  resourceType?: AuditResourceType;
  resourceId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<AuditLogResponse[]> {
  try {
    let query: any = db.collection('adminAuditLogs');

    // Apply filters
    if (options?.adminUid) {
      query = query.where('adminUid', '==', options.adminUid);
    }
    if (options?.resourceType) {
      query = query.where('resourceType', '==', options.resourceType);
    }
    if (options?.resourceId) {
      query = query.where('resourceId', '==', options.resourceId);
    }
    if (options?.action) {
      query = query.where('action', '==', options.action);
    }
    if (options?.startDate) {
      query = query.where(
        'timestamp',
        '>=',
        Timestamp.fromDate(options.startDate)
      );
    }
    if (options?.endDate) {
      query = query.where(
        'timestamp',
        '<=',
        Timestamp.fromDate(options.endDate)
      );
    }

    // Order by timestamp descending (most recent first)
    query = query.orderBy('timestamp', 'desc');

    // Apply limit
    const limit = options?.limit || 100;
    query = query.limit(limit);

    const snapshot = await query.get();

    return snapshot.docs.map(
      (doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: (doc.data().timestamp as Timestamp).toDate().toISOString(),
      })
    ) as AuditLogResponse[];
  } catch (error) {
    console.error('❌ [Audit Log] Error retrieving audit logs:', error);
    throw new Error('Failed to retrieve audit logs');
  }
}

/**
 * Gets recent audit logs for a specific admin
 *
 * @param adminUid - UID of the admin
 * @param limit - Maximum number of logs to return (default: 50)
 * @returns Promise<AuditLogResponse[]> - Recent audit logs
 */
export async function getAdminRecentActions(
  adminUid: string,
  limit: number = 50
): Promise<AuditLogResponse[]> {
  return getAuditLogs({ adminUid, limit });
}

/**
 * Gets audit logs for a specific resource
 *
 * @param resourceType - Type of resource
 * @param resourceId - ID of the resource
 * @param limit - Maximum number of logs to return (default: 50)
 * @returns Promise<AuditLogResponse[]> - Audit logs for the resource
 */
export async function getResourceAuditHistory(
  resourceType: AuditResourceType,
  resourceId: string,
  limit: number = 50
): Promise<AuditLogResponse[]> {
  return getAuditLogs({ resourceType, resourceId, limit });
}

/**
 * Sanitizes details object to remove sensitive information
 * and ensure it can be stored in Firestore
 *
 * @param details - Raw details object
 * @returns Sanitized details object
 */
function sanitizeDetails(
  details?: Record<string, any>
): Record<string, any> | undefined {
  if (!details) {
    return undefined;
  }

  const sanitized: Record<string, any> = {};

  // List of sensitive keys to remove
  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'apiKey',
    'privateKey',
    'accessToken',
    'refreshToken',
  ];

  for (const [key, value] of Object.entries(details)) {
    // Skip sensitive keys
    if (
      sensitiveKeys.some((sensitive) =>
        key.toLowerCase().includes(sensitive.toLowerCase())
      )
    ) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Handle different value types
    if (value === undefined) {
      // Skip undefined values - Firestore doesn't allow them
      continue;
    } else if (value === null) {
      // null is allowed in Firestore
      sanitized[key] = null;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Recursively sanitize nested objects
      const nestedSanitized = sanitizeDetails(value);
      if (nestedSanitized !== undefined) {
        sanitized[key] = nestedSanitized;
      }
    } else if (Array.isArray(value)) {
      // Sanitize arrays, filtering out undefined values
      sanitized[key] = value
        .map((item) =>
          typeof item === 'object' && item !== null
            ? sanitizeDetails(item)
            : item
        )
        .filter((item) => item !== undefined);
    } else {
      // Primitive values
      sanitized[key] = value;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

/**
 * Helper function to get IP address from Express request
 *
 * @param req - Express request object
 * @returns IP address string
 */
export function getIpAddress(req: any): string | undefined {
  return (
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    undefined
  );
}

/**
 * Helper function to get user agent from Express request
 *
 * @param req - Express request object
 * @returns User agent string
 */
export function getUserAgent(req: any): string | undefined {
  return req.headers['user-agent'];
}
