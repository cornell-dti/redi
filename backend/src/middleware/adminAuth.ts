import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { db } from '../../firebaseAdmin';

/**
 * Extended Request interface that includes the authenticated admin user
 * Extends the base Request to include admin-specific user information
 */
export interface AdminRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    admin?: boolean;
  };
}

/**
 * Middleware to verify admin access via Firebase custom claims AND admins collection
 *
 * This middleware provides secure admin authentication by:
 * 1. Verifying the Firebase ID token from Authorization header
 * 2. Checking if user has admin custom claim (admin: true)
 * 3. Verifying user exists in the 'admins' Firestore collection
 *
 * Security Features:
 * - Bearer token verification prevents unauthorized access
 * - Custom claims provide fast, cached admin verification
 * - Admins collection provides persistent admin list management
 * - Dual-check (claims + collection) ensures maximum security
 *
 * @requires Authorization header with Bearer token
 * @throws 401 - If no authentication token provided
 * @throws 403 - If token is invalid, expired, or user is not an admin
 *
 * Usage:
 *   router.use(requireAdmin); // Apply to all routes in router
 *   router.get('/endpoint', requireAdmin, handler); // Apply to single route
 */
export const requireAdmin = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('🔐 [Admin Auth] Checking admin access...');

    const authHeader = req.headers.authorization;

    // Check for Authorization header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('⚠️ [Admin Auth] No Bearer token provided');
      return res.status(401).json({
        error: 'No authentication token provided. Please sign in.',
      });
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      console.warn('⚠️ [Admin Auth] Invalid token format');
      return res.status(401).json({
        error: 'Invalid token format',
      });
    }

    // Verify the Firebase ID token
    console.log('🔍 [Admin Auth] Verifying Firebase token...');
    const decodedToken = await admin.auth().verifyIdToken(token);

    console.log(`👤 [Admin Auth] Token verified for user: ${decodedToken.uid}`);

    // Check 1: Verify user has admin custom claim
    if (decodedToken.admin !== true) {
      console.warn(
        `⛔ [Admin Auth] User ${decodedToken.uid} does not have admin custom claim`
      );
      return res.status(403).json({
        error:
          'Unauthorized: Admin access required. Your account does not have admin privileges.',
      });
    }

    console.log('✅ [Admin Auth] Admin custom claim verified');

    // Check 2: Verify user exists in admins collection
    console.log('🔍 [Admin Auth] Checking admins collection...');
    const adminDoc = await db.collection('admins').doc(decodedToken.uid).get();

    if (!adminDoc.exists) {
      console.warn(
        `⛔ [Admin Auth] User ${decodedToken.uid} not found in admins collection`
      );
      return res.status(403).json({
        error:
          'Unauthorized: Admin access required. User not found in admins list.',
      });
    }

    const adminData = adminDoc.data();

    // Check if admin is active (not disabled)
    if (adminData?.disabled === true) {
      console.warn(`⛔ [Admin Auth] Admin ${decodedToken.uid} is disabled`);
      return res.status(403).json({
        error:
          'Unauthorized: Admin account is disabled. Please contact system administrator.',
      });
    }

    console.log(
      `✅ [Admin Auth] Admin verified in collection: ${adminData?.email || decodedToken.email}`
    );

    // Attach admin user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || adminData?.email,
      admin: true,
    };

    console.log('✅ [Admin Auth] Access granted');
    next();
  } catch (error) {
    console.error('❌ [Admin Auth] Authentication error:', error);

    // Provide specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return res.status(403).json({
          error: 'Authentication token has expired. Please sign in again.',
        });
      }
      if (error.message.includes('invalid')) {
        return res.status(403).json({
          error: 'Invalid authentication token. Please sign in again.',
        });
      }
    }

    return res.status(403).json({
      error: 'Authentication failed. Please sign in again.',
    });
  }
};

/**
 * Helper function to check if a user is an admin
 * Can be used outside of middleware context for programmatic checks
 *
 * @param uid - Firebase user UID to check
 * @returns Promise<boolean> - True if user is an admin, false otherwise
 */
export const isUserAdmin = async (uid: string): Promise<boolean> => {
  try {
    // Check custom claims
    const user = await admin.auth().getUser(uid);
    if (user.customClaims?.admin !== true) {
      return false;
    }

    // Check admins collection
    const adminDoc = await db.collection('admins').doc(uid).get();
    if (!adminDoc.exists) {
      return false;
    }

    const adminData = adminDoc.data();
    if (adminData?.disabled === true) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};
