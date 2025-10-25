import express from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../firebaseAdmin';
import { FirestoreDoc, UserDoc, UserDocWrite, UserResponse } from '../../types';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';
import {
  authenticationRateLimit,
  publicRateLimit,
} from '../middleware/rateLimiting';
import { validateUserCreation, validate } from '../middleware/validation';

const router = express.Router();

const validateCornellEmailAndExtractNetid = (
  email: string
): { isValid: boolean; netid?: string } => {
  const emailRegex = /^([a-zA-Z0-9]+)@cornell\.edu$/;
  const match = email.match(emailRegex);

  if (match) {
    return { isValid: true, netid: match[1] };
  }

  return { isValid: false };
};

const userDocToResponse = (doc: FirestoreDoc<UserDoc>): UserResponse => ({
  netid: doc.netid,
  createdAt:
    doc.createdAt instanceof Date
      ? doc.createdAt.toISOString()
      : doc.createdAt.toDate().toISOString(),
});

// GET all users (admin-only endpoint)
router.get('/api/users', requireAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const users: UserResponse[] = snapshot.docs.map((doc) =>
      userDocToResponse({ id: doc.id, ...(doc.data() as UserDoc) })
    );
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET user by netid (admin-only or own user)
router.get(
  '/api/users/:netid',
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { netid } = req.params;

      // Get authenticated user's netid
      const userSnapshot = await db
        .collection('users')
        .where('firebaseUid', '==', req.user!.uid)
        .get();

      if (userSnapshot.empty) {
        return res.status(404).json({ error: 'Authenticated user not found' });
      }

      const authenticatedNetid = userSnapshot.docs[0].data().netid;

      // Only allow users to view their own data, unless they're admin
      if (netid !== authenticatedNetid) {
        // Check if user is admin
        const adminDoc = await db.collection('admins').doc(req.user!.uid).get();
        if (!adminDoc.exists) {
          return res
            .status(403)
            .json({ error: 'Unauthorized: Can only view own user data' });
        }
      }

      const snapshot = await db
        .collection('users')
        .where('netid', '==', netid)
        .get();

      if (snapshot.empty) {
        return res.status(404).json({ error: 'User not found' });
      }

      const doc = snapshot.docs[0];
      const user = userDocToResponse({
        id: doc.id,
        ...(doc.data() as UserDoc),
      });
      res.status(200).json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }
);

// POST create new user from Firebase Auth
router.post(
  '/api/users/firebase-create',
  authenticationRateLimit,
  authenticateUser,
  validateUserCreation,
  validate,
  async (req: AuthenticatedRequest, res) => {
    try {
      console.log('Creating user from auth:', req.body);

      // Use authenticated user's email and uid from token
      const email = req.user!.email;
      const firebaseUid = req.user!.uid;

      if (!email || !firebaseUid) {
        return res
          .status(400)
          .json({ error: 'Authentication token missing required fields' });
      }

      const { isValid, netid } = validateCornellEmailAndExtractNetid(email);
      if (!isValid) {
        return res
          .status(400)
          .json({ error: 'Only Cornell emails (@cornell.edu) are allowed' });
      }

      // If user exists, return their info
      const existingUser = await db
        .collection('users')
        .where('netid', '==', netid)
        .get();
      if (!existingUser.empty) {
        const doc = existingUser.docs[0];
        const user = userDocToResponse({
          id: doc.id,
          ...(doc.data() as UserDoc),
        });
        return res.status(200).json({
          message: 'User already exists',
          user,
        });
      }

      if (!netid) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Create user document
      const userDoc: UserDocWrite = {
        netid,
        email,
        firebaseUid,
        createdAt: FieldValue.serverTimestamp(),
      };

      const docRef = await db.collection('users').add(userDoc);
      res.status(201).json({
        id: docRef.id,
        netid,
        email,
        message: 'User created successfully',
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
) as any;

// POST login with Firebase verification
router.post(
  '/api/users/firebase-login',
  authenticationRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      // Use authenticated user's email and uid from verified token
      const email = req.user!.email;
      const firebaseUid = req.user!.uid;

      if (!email || !firebaseUid) {
        return res
          .status(400)
          .json({ error: 'Authentication token missing required fields' });
      }

      // Validate Cornell email
      const { isValid, netid } = validateCornellEmailAndExtractNetid(email);
      if (!isValid || !netid) {
        return res
          .status(400)
          .json({ error: 'Only Cornell emails (@cornell.edu) are allowed' });
      }

      const snapshot = await db
        .collection('users')
        .where('netid', '==', netid)
        .where('firebaseUid', '==', firebaseUid)
        .get();

      if (snapshot.empty) {
        return res
          .status(401)
          .json({ error: 'User not found or invalid credentials' });
      }

      const doc = snapshot.docs[0];
      const user = userDocToResponse({
        id: doc.id,
        ...(doc.data() as UserDoc),
      });

      res.status(200).json({
        message: 'Login successful',
        user,
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// DELETE user by netid (own account only, or admin override)
router.delete(
  '/api/users/:netid',
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { netid } = req.params;

      // Get authenticated user's netid
      const userSnapshot = await db
        .collection('users')
        .where('firebaseUid', '==', req.user!.uid)
        .get();

      if (userSnapshot.empty) {
        return res.status(404).json({ error: 'Authenticated user not found' });
      }

      const authenticatedNetid = userSnapshot.docs[0].data().netid;

      // Verify user is deleting their own account or is admin
      if (netid !== authenticatedNetid) {
        // Check if user is admin
        const adminDoc = await db.collection('admins').doc(req.user!.uid).get();
        if (!adminDoc.exists) {
          return res.status(403).json({
            error: 'Unauthorized: Can only delete own account',
          });
        }
      }

      const snapshot = await db
        .collection('users')
        .where('netid', '==', netid)
        .get();

      if (snapshot.empty) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Delete user document
      const doc = snapshot.docs[0];
      await doc.ref.delete();

      // Also delete associated profile if it exists
      const profileSnapshot = await db
        .collection('profiles')
        .where('netid', '==', netid)
        .get();
      if (!profileSnapshot.empty) {
        const profileDoc = profileSnapshot.docs[0];
        await profileDoc.ref.delete();
      }

      // TODO: Delete associated data (preferences, answers, matches, images)

      res
        .status(200)
        .json({ message: 'User and associated profile deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
);

export default router;
