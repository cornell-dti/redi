import { NextFunction, Request, Response } from 'express';
import admin from 'firebase-admin';

/**
 * Extended Request interface that includes the authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    netid?: string;
  };
}

/**
 * Middleware to verify Firebase ID token from Authorization header
 * @description Extracts Bearer token, verifies with Firebase Admin SDK, and attaches user to request
 * @throws 401 - If no token provided or token is invalid
 * @throws 403 - If token verification fails
 */
export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  console.log('🔐 [Auth] authenticateUser middleware called for:', req.path);

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ error: 'No authentication token provided' });
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };

    next();
  } catch (error) {
    console.error('[Auth] Authentication error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
