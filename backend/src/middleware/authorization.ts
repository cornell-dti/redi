import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { db } from '../../firebaseAdmin';

/**
 * Authorization middleware to verify resource ownership
 * Ensures authenticated user can only access/modify their own data
 */

/**
 * Helper function to get user's netid from their firebaseUid
 */
export const getNetidFromUid = async (
  firebaseUid: string
): Promise<string | null> => {
  try {
    const userSnapshot = await db
      .collection('users')
      .where('firebaseUid', '==', firebaseUid)
      .get();

    if (userSnapshot.empty) {
      return null;
    }

    return userSnapshot.docs[0].data().netid;
  } catch (error) {
    console.error('Error getting netid from uid:', error);
    return null;
  }
};

/**
 * Helper function to get user's firebaseUid from their netid
 */
export const getFirebaseUidFromNetid = async (
  netid: string
): Promise<string | null> => {
  try {
    const userSnapshot = await db
      .collection('users')
      .where('netid', '==', netid)
      .get();

    if (userSnapshot.empty) {
      return null;
    }

    return userSnapshot.docs[0].data().firebaseUid;
  } catch (error) {
    console.error('Error getting firebaseUid from netid:', error);
    return null;
  }
};

/**
 * Middleware to verify user owns the profile being accessed/modified
 * Attaches netid to req for use in route handlers
 */
export const requireOwnProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const netid = await getNetidFromUid(req.user.uid);
    if (!netid) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Attach netid to request for use in route handler
    req.netid = netid;

    next();
  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};

/**
 * Middleware to verify user can access a specific netid's data
 * Checks if req.params.netid or req.body.netid matches authenticated user
 */
export const requireOwnership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const authenticatedNetid = await getNetidFromUid(req.user.uid);
    if (!authenticatedNetid) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check params.netid
    const targetNetid = req.params.netid || req.body.netid;

    if (targetNetid && targetNetid !== authenticatedNetid) {
      return res.status(403).json({
        error: 'Unauthorized: You can only access your own data',
      });
    }

    // Attach netid to request
    req.netid = authenticatedNetid;

    next();
  } catch (error) {
    console.error('Ownership verification error:', error);
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Extend AuthenticatedRequest interface to include netid
declare module './auth' {
  interface AuthenticatedRequest {
    netid?: string;
  }
}
