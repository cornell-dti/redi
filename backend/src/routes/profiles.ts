import express from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../firebaseAdmin';
import {
  CreateProfileInput,
  FirestoreDoc,
  Gender,
  ProfileDoc,
  ProfileDocWrite,
  ProfileResponse,
  UpdateProfileInput,
} from '../../types';
import { AuthenticatedRequest, authenticateUser } from '../middleware/auth';
import { authenticatedRateLimit } from '../middleware/rateLimiting';
import { validate, validateProfileCreation } from '../middleware/validation';
import {
  blockUser,
  getBlockedUsers,
  unblockUser,
} from '../services/blockingService';
import { createDefaultPreferences } from '../services/preferencesService';
import {
  determineViewContext,
  getProfileWithAge,
  isUserBlocked,
  ProfileViewContext,
} from '../utils/profilePrivacy';

const router = express.Router();

/**
 * Converts various date formats to a JavaScript Date object for Firestore storage
 */
const convertToDate = (value: any): Date => {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string') {
    return new Date(value);
  }
  if (value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  return new Date(value);
};

/**
 * Converts a Firestore profile document to a client-safe API response format
 */
const profileDocToResponse = (
  doc: FirestoreDoc<ProfileDoc>
): ProfileResponse => ({
  netid: doc.netid,
  firstName: doc.firstName,
  bio: doc.bio,
  gender: doc.gender,
  birthdate:
    doc.birthdate instanceof Date
      ? doc.birthdate.toISOString()
      : doc.birthdate.toDate().toISOString(),
  hometown: doc.hometown,
  pronouns: doc.pronouns,
  ethnicity: doc.ethnicity,
  sexualOrientation: doc.sexualOrientation,
  showGenderOnProfile: doc.showGenderOnProfile,
  showPronounsOnProfile: doc.showPronounsOnProfile,
  showHometownOnProfile: doc.showHometownOnProfile,
  showCollegeOnProfile: doc.showCollegeOnProfile,
  showEthnicityOnProfile: doc.showEthnicityOnProfile,
  showSexualOrientationOnProfile: doc.showSexualOrientationOnProfile,
  prompts: doc.prompts,
  instagram: doc.instagram,
  snapchat: doc.snapchat,
  phoneNumber: doc.phoneNumber,
  linkedIn: doc.linkedIn,
  github: doc.github,
  website: doc.website,
  clubs: doc.clubs,
  interests: doc.interests,
  socialsOrder: doc.socialsOrder,
  year: doc.year,
  school: doc.school,
  major: doc.major,
  pictures: doc.pictures,
  createdAt:
    doc.createdAt instanceof Date
      ? doc.createdAt.toISOString()
      : doc.createdAt.toDate().toISOString(),
  updatedAt:
    doc.updatedAt instanceof Date
      ? doc.updatedAt.toISOString()
      : doc.updatedAt.toDate().toISOString(),
});

/**
 * Helper to get netid from authenticated user
 */
const getNetidFromAuth = async (
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
    console.error('Error getting netid:', error);
    return null;
  }
};

/**
 * Check if user is admin
 */
const isAdmin = async (firebaseUid: string): Promise<boolean> => {
  try {
    const adminDoc = await db.collection('admins').doc(firebaseUid).get();
    return adminDoc.exists && !adminDoc.data()?.disabled;
  } catch (error) {
    return false;
  }
};

/**
 * GET /api/profiles
 * Retrieves a filtered list of user profiles (requires authentication)
 * Returns profiles based on user's preferences and respects privacy settings
 */
router.get(
  '/api/profiles',
  authenticatedRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        limit = '50',
        gender,
        school,
        minYear,
        maxYear,
        excludeNetid,
      } = req.query;

      // Get authenticated user's netid
      const viewerNetid = await getNetidFromAuth(req.user!.uid);
      if (!viewerNetid) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if user is admin
      const userIsAdmin = await isAdmin(req.user!.uid);

      let query = db.collection('profiles').limit(parseInt(limit as string));

      // Apply filters if provided
      if (gender && typeof gender === 'string') {
        query = query.where('gender', '==', gender);
      }
      if (school && typeof school === 'string') {
        query = query.where('school', '==', school);
      }
      if (minYear && typeof minYear === 'string') {
        query = query.where('year', '>=', parseInt(minYear));
      }
      if (maxYear && typeof maxYear === 'string') {
        query = query.where('year', '<=', parseInt(maxYear));
      }

      const snapshot = await query.get();
      let profiles: ProfileResponse[] = snapshot.docs.map((doc) =>
        profileDocToResponse({ id: doc.id, ...(doc.data() as ProfileDoc) })
      );

      // Filter out excluded netid if provided
      if (excludeNetid && typeof excludeNetid === 'string') {
        profiles = profiles.filter((profile) => profile.netid !== excludeNetid);
      }

      // Filter out own profile
      profiles = profiles.filter((profile) => profile.netid !== viewerNetid);

      // Filter out blocked users
      const filteredProfiles = [];
      for (const profile of profiles) {
        // Check if viewer blocked this user or vice versa
        const viewerBlockedUser = await isUserBlocked(
          viewerNetid,
          profile.netid,
          db
        );
        const userBlockedViewer = await isUserBlocked(
          profile.netid,
          viewerNetid,
          db
        );

        if (!viewerBlockedUser && !userBlockedViewer) {
          // Determine view context and apply privacy filtering
          const context = await determineViewContext(
            viewerNetid,
            profile.netid,
            userIsAdmin,
            db
          );

          const filteredProfile = getProfileWithAge(profile, context);
          filteredProfiles.push(filteredProfile);
        }
      }

      res.status(200).json(filteredProfiles);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      res.status(500).json({ error: 'Failed to fetch profiles' });
    }
  }
);

/**
 * GET /api/profiles/me
 * Retrieves the authenticated user's own profile
 */
router.get(
  '/api/profiles/me',
  authenticatedRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      // Get netid from authenticated user
      const netid = await getNetidFromAuth(req.user!.uid);
      if (!netid) {
        return res.status(404).json({ error: 'User not found' });
      }

      const snapshot = await db
        .collection('profiles')
        .where('netid', '==', netid)
        .get();

      if (snapshot.empty) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const doc = snapshot.docs[0];
      const profile = profileDocToResponse({
        id: doc.id,
        ...(doc.data() as ProfileDoc),
      });

      // Return full profile (own profile, no filtering)
      res.status(200).json(profile);
    } catch (error) {
      console.error("Error fetching current user's profile:", error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }
);

/**
 * GET /api/profiles/batch
 * Batch fetch profiles by Firebase UIDs for chat participant display
 * Returns fresh profile data including current pictures[0]
 *
 * @authenticated
 * @query uids - Comma-separated list of Firebase UIDs
 * @returns Object mapping Firebase UID to profile data { firstName, pictures, netid }
 */
router.get(
  '/api/profiles/batch',
  authenticatedRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { uids } = req.query;

      if (!uids || typeof uids !== 'string') {
        return res.status(400).json({
          error: 'Missing or invalid uids query parameter',
        });
      }

      // Parse comma-separated UIDs
      const uidList = uids.split(',').map((uid) => uid.trim()).filter(Boolean);

      if (uidList.length === 0) {
        return res.status(400).json({
          error: 'No valid UIDs provided',
        });
      }

      if (uidList.length > 50) {
        return res.status(400).json({
          error: 'Maximum 50 UIDs allowed per request',
        });
      }

      // Create result map
      const profilesMap: Record<string, {
        firstName: string;
        pictures: string[];
        netid: string;
      }> = {};

      // Fetch user documents to get netids from Firebase UIDs
      const userPromises = uidList.map(async (firebaseUid) => {
        try {
          const userSnapshot = await db
            .collection('users')
            .where('firebaseUid', '==', firebaseUid)
            .limit(1)
            .get();

          if (userSnapshot.empty) {
            return null;
          }

          const userData = userSnapshot.docs[0].data();
          const netid = userData.netid;

          // Fetch profile for this netid
          const profileSnapshot = await db
            .collection('profiles')
            .where('netid', '==', netid)
            .limit(1)
            .get();

          if (profileSnapshot.empty) {
            return null;
          }

          const profileData = profileSnapshot.docs[0].data() as ProfileDoc;

          return {
            firebaseUid,
            netid,
            firstName: profileData.firstName || 'Unknown',
            pictures: profileData.pictures || [],
          };
        } catch (error) {
          console.error(`Error fetching profile for UID ${firebaseUid}:`, error);
          return null;
        }
      });

      const results = await Promise.all(userPromises);

      // Build response map
      results.forEach((result) => {
        if (result) {
          profilesMap[result.firebaseUid] = {
            firstName: result.firstName,
            pictures: result.pictures,
            netid: result.netid,
          };
        }
      });

      res.status(200).json(profilesMap);
    } catch (error) {
      console.error('Error in batch profile fetch:', error);
      res.status(500).json({
        error: 'Failed to fetch profiles',
      });
    }
  }
);

/**
 * GET /api/profiles/:netid
 * Retrieves a specific user's profile (requires authentication)
 * Applies privacy filtering based on relationship between users
 */
router.get(
  '/api/profiles/:netid',
  authenticatedRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { netid } = req.params;

      // Get viewer's netid
      const viewerNetid = await getNetidFromAuth(req.user!.uid);
      if (!viewerNetid) {
        return res.status(404).json({ error: 'Authenticated user not found' });
      }

      // Check if user is admin
      const userIsAdmin = await isAdmin(req.user!.uid);

      // Check if users have blocked each other (unless admin)
      if (!userIsAdmin) {
        const viewerBlockedUser = await isUserBlocked(viewerNetid, netid, db);
        const userBlockedViewer = await isUserBlocked(netid, viewerNetid, db);

        if (viewerBlockedUser || userBlockedViewer) {
          return res.status(404).json({ error: 'Profile not found' });
        }
      }

      const snapshot = await db
        .collection('profiles')
        .where('netid', '==', netid)
        .get();

      if (snapshot.empty) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const doc = snapshot.docs[0];
      const profile = profileDocToResponse({
        id: doc.id,
        ...(doc.data() as ProfileDoc),
      });

      // Determine view context and apply privacy filtering
      const context = await determineViewContext(
        viewerNetid,
        netid,
        userIsAdmin,
        db
      );

      const filteredProfile = getProfileWithAge(profile, context);

      res.status(200).json(filteredProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }
);

/**
 * POST /api/profiles
 * Creates a new dating profile for the authenticated user
 */
router.post(
  '/api/profiles',
  authenticatedRateLimit,
  authenticateUser,
  validateProfileCreation,
  validate,
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      console.log('Creating profile for authenticated user');
      const profileData: CreateProfileInput = req.body;

      // Get netid from authenticated user's token
      const netid = await getNetidFromAuth(req.user!.uid);
      if (!netid) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Validate required fields
      if (
        !profileData.firstName ||
        !profileData.bio ||
        !profileData.gender ||
        !profileData.birthdate ||
        !profileData.year ||
        !profileData.school
      ) {
        return res.status(400).json({
          error:
            'firstName, bio, gender, birthdate, year, and school are required',
        });
      }

      // Check if profile already exists for this user
      const existingProfile = await db
        .collection('profiles')
        .where('netid', '==', netid)
        .get();

      if (!existingProfile.empty) {
        return res
          .status(409)
          .json({ error: 'Profile already exists for this user' });
      }

      // Validate enum values
      const validGenders: Gender[] = ['female', 'male', 'non-binary'];
      if (!validGenders.includes(profileData.gender)) {
        return res.status(400).json({ error: 'Invalid gender value' });
      }

      // Create profile document
      const profileDoc: ProfileDocWrite = {
        ...profileData,
        netid,
        birthdate: convertToDate(profileData.birthdate),
        major: profileData.major || [],
        pictures: profileData.pictures || [],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      const docRef = await db.collection('profiles').add(profileDoc);

      // Create default preferences for the new user
      try {
        await createDefaultPreferences(netid);
      } catch (error) {
        console.error('Error creating default preferences:', error);
        // Don't fail the profile creation if preferences fail
      }

      res.status(201).json({
        id: docRef.id,
        netid,
        message: 'Profile created successfully',
      });
    } catch (error) {
      console.error('Error creating profile:', error);
      res.status(500).json({ error: 'Failed to create profile' });
    }
  }
) as any;

/**
 * PUT /api/profiles/me
 * Updates the authenticated user's existing profile
 */
router.put(
  '/api/profiles/me',
  authenticatedRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      const updateData: UpdateProfileInput = req.body;

      // Get netid from authenticated user
      const netid = await getNetidFromAuth(req.user!.uid);
      if (!netid) {
        return res.status(404).json({ error: 'User not found' });
      }

      const snapshot = await db
        .collection('profiles')
        .where('netid', '==', netid)
        .get();

      if (snapshot.empty) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Validate gender if provided
      if (updateData.gender) {
        const validGenders: Gender[] = ['female', 'male', 'non-binary'];
        if (!validGenders.includes(updateData.gender)) {
          return res.status(400).json({ error: 'Invalid gender value' });
        }
      }

      // Convert birthdate to Date if provided
      const updateDoc: Partial<ProfileDocWrite> = {
        ...updateData,
        ...(updateData.birthdate && {
          birthdate: convertToDate(updateData.birthdate),
        }),
        updatedAt: FieldValue.serverTimestamp(),
      };

      const doc = snapshot.docs[0];
      await doc.ref.update(updateDoc);

      res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

/**
 * DELETE /api/profiles/me
 * Permanently deletes the authenticated user's profile
 */
router.delete(
  '/api/profiles/me',
  authenticatedRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      // Get netid from authenticated user
      const netid = await getNetidFromAuth(req.user!.uid);
      if (!netid) {
        return res.status(404).json({ error: 'User not found' });
      }

      const snapshot = await db
        .collection('profiles')
        .where('netid', '==', netid)
        .get();

      if (snapshot.empty) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const doc = snapshot.docs[0];
      await doc.ref.delete();

      // TODO: Also delete associated images from storage

      res.status(200).json({ message: 'Profile deleted successfully' });
    } catch (error) {
      console.error('Error deleting profile:', error);
      res.status(500).json({ error: 'Failed to delete profile' });
    }
  }
);

/**
 * GET /api/profiles/matches
 * Retrieves potential dating matches for the authenticated user
 * Implements matching algorithm based on preferences
 */
router.get(
  '/api/profiles/matches',
  authenticatedRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { limit = '20' } = req.query;

      // Get authenticated user's netid
      const currentUserNetid = await getNetidFromAuth(req.user!.uid);
      if (!currentUserNetid) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get current user's profile to use for matching logic
      const currentUserSnapshot = await db
        .collection('profiles')
        .where('netid', '==', currentUserNetid)
        .get();

      if (currentUserSnapshot.empty) {
        return res
          .status(404)
          .json({ error: 'Current user profile not found' });
      }

      // Get current user's preferences
      const preferencesSnapshot = await db
        .collection('preferences')
        .where('netid', '==', currentUserNetid)
        .get();

      let query = db
        .collection('profiles')
        .where('netid', '!=', currentUserNetid)
        .limit(parseInt(limit as string));

      // TODO: Apply preference-based filtering here
      // - Filter by preferred genders
      // - Filter by preferred age range
      // - Filter by preferred years
      // - Filter out previously rejected users
      // - Filter out blocked users

      const snapshot = await query.get();
      let matches: ProfileResponse[] = snapshot.docs.map((doc) =>
        profileDocToResponse({ id: doc.id, ...(doc.data() as ProfileDoc) })
      );

      // Filter out blocked users
      const filteredMatches = [];
      for (const match of matches) {
        const viewerBlockedUser = await isUserBlocked(
          currentUserNetid,
          match.netid,
          db
        );
        const userBlockedViewer = await isUserBlocked(
          match.netid,
          currentUserNetid,
          db
        );

        if (!viewerBlockedUser && !userBlockedViewer) {
          // Apply public browse privacy filtering
          const filteredMatch = getProfileWithAge(
            match,
            ProfileViewContext.PUBLIC_BROWSE
          );
          filteredMatches.push(filteredMatch);
        }
      }

      res.status(200).json(filteredMatches);
    } catch (error) {
      console.error('Error fetching matches:', error);
      res.status(500).json({ error: 'Failed to fetch matches' });
    }
  }
);

// =============================================================================
// BLOCKING ENDPOINTS
// =============================================================================

/**
 * POST /api/profiles/:netid/block
 * Block a user by their netid
 * Requires authentication - user can only manage their own blocks
 */
router.post(
  '/api/profiles/:netid/block',
  authenticatedRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      // Get authenticated user's netid
      const blockerNetid = await getNetidFromAuth(req.user!.uid);
      if (!blockerNetid) {
        return res.status(404).json({ error: 'User not found' });
      }

      const blockedNetid = req.params.netid;

      // Validate that the blocked user exists
      const blockedUserSnapshot = await db
        .collection('profiles')
        .where('netid', '==', blockedNetid)
        .get();

      if (blockedUserSnapshot.empty) {
        return res.status(404).json({ error: 'User to block not found' });
      }

      // Block the user (service will handle validation like self-blocking)
      await blockUser(blockerNetid, blockedNetid);

      res.status(201).json({
        message: 'User blocked successfully',
        blockerNetid,
        blockedNetid,
      });
    } catch (error: any) {
      console.error('Error blocking user:', error);

      // Handle specific error messages from service
      if (error.message === 'You cannot block yourself') {
        return res.status(400).json({ error: error.message });
      }
      if (error.message === 'You have already blocked this user') {
        return res.status(409).json({ error: error.message });
      }

      res.status(500).json({ error: 'Failed to block user' });
    }
  }
);

/**
 * DELETE /api/profiles/:netid/block
 * Unblock a user by their netid
 * Requires authentication - user can only manage their own blocks
 */
router.delete(
  '/api/profiles/:netid/block',
  authenticatedRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      // Get authenticated user's netid
      const blockerNetid = await getNetidFromAuth(req.user!.uid);
      if (!blockerNetid) {
        return res.status(404).json({ error: 'User not found' });
      }

      const blockedNetid = req.params.netid;

      // Unblock the user (service will handle validation)
      await unblockUser(blockerNetid, blockedNetid);

      res.status(200).json({
        message: 'User unblocked successfully',
        blockerNetid,
        blockedNetid,
      });
    } catch (error: any) {
      console.error('Error unblocking user:', error);

      // Handle specific error messages from service
      if (error.message === 'Block relationship does not exist') {
        return res.status(404).json({ error: error.message });
      }

      res.status(500).json({ error: 'Failed to unblock user' });
    }
  }
);

/**
 * GET /api/profiles/:netid/blocked
 * Get list of users blocked by a specific user
 * Requires authentication - user can only view their own blocked list
 */
router.get(
  '/api/profiles/:netid/blocked',
  authenticatedRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      // Get authenticated user's netid
      const authenticatedNetid = await getNetidFromAuth(req.user!.uid);
      if (!authenticatedNetid) {
        return res.status(404).json({ error: 'User not found' });
      }

      const requestedNetid = req.params.netid;

      // Check if user is admin
      const userIsAdmin = await isAdmin(req.user!.uid);

      // Only allow users to view their own blocked list (unless admin)
      if (requestedNetid !== authenticatedNetid && !userIsAdmin) {
        return res.status(403).json({
          error: 'You can only view your own blocked users list',
        });
      }

      // Get blocked users list
      const blockedNetids = await getBlockedUsers(requestedNetid);

      res.status(200).json({
        blockerNetid: requestedNetid,
        blockedUsers: blockedNetids,
        count: blockedNetids.length,
      });
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      res.status(500).json({ error: 'Failed to fetch blocked users' });
    }
  }
);

export default router;
