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
import { createDefaultPreferences } from '../services/preferencesService';

const router = express.Router();

/**
 * Verifies that a user exists in the database and retrieves their Cornell NetID
 * @param firebaseUid - The Firebase authentication UID for the user
 * @returns Promise resolving to the user's NetID if found, null otherwise
 * @throws Logs error to console if database query fails
 */
const verifyUserExists = async (
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
    console.error('Error verifying user:', error);
    return null;
  }
};

/**
 * Converts various date formats to a JavaScript Date object for Firestore storage
 * @param value - Date value in various formats (Date, string, Firestore Timestamp)
 * @returns JavaScript Date object
 * @description Handles Date objects, ISO strings, and Firestore Timestamps
 */
const convertToDate = (value: any): Date => {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string') {
    return new Date(value);
  }
  // Handle Firestore Timestamp
  if (value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  return new Date(value);
};

/**
 * Converts a Firestore profile document to a client-safe API response format
 * @param doc - Firestore document containing profile data with document ID
 * @returns ProfileResponse object with ISO string dates for JSON serialization
 * @description Transforms Firestore timestamps to ISO strings for API consumption
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
  interestedIn: doc.interestedIn,
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
 * GET /api/profiles
 * Retrieves a filtered list of user profiles for admin or matching purposes
 * @route GET /api/profiles
 * @group Profiles - Profile management operations
 * @param {string} [limit=50] - Maximum number of profiles to return
 * @param {Gender} [gender] - Filter by gender (female, male, non-binary)
 * @param {School} [school] - Filter by Cornell school
 * @param {string} [minYear] - Filter by minimum graduation year
 * @param {string} [maxYear] - Filter by maximum graduation year
 * @param {string} [excludeNetid] - Exclude specific user by NetID
 * @returns {ProfileResponse[]} Array of profile objects
 * @returns {Error} 500 - Internal server error
 */
router.get('/api/profiles', async (req, res) => {
  try {
    const {
      limit = '50',
      gender,
      school,
      minYear,
      maxYear,
      excludeNetid,
    } = req.query;

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

    res.status(200).json(profiles);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * GET /api/profiles/me
 * Retrieves the authenticated user's own profile
 * @route GET /api/profiles/me
 * @group Profiles - Profile management operations
 * @param {string} firebaseUid.query.required - Firebase authentication UID
 * @returns {ProfileResponse} User's profile data
 * @returns {Error} 400 - Missing or invalid firebaseUid
 * @returns {Error} 404 - User or profile not found
 * @returns {Error} 500 - Internal server error
 */
router.get('/api/profiles/me', async (req, res) => {
  try {
    const { firebaseUid } = req.query;

    if (!firebaseUid || typeof firebaseUid !== 'string') {
      return res.status(400).json({ error: 'firebaseUid is required' });
    }

    // Get netid from firebaseUid
    const netid = await verifyUserExists(firebaseUid);
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
    res.status(200).json(profile);
  } catch (error) {
    console.error("Error fetching current user's profile:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * GET /api/profiles/:netid
 * Retrieves a specific user's profile by their Cornell NetID (public endpoint)
 * @route GET /api/profiles/:netid
 * @group Profiles - Profile management operations
 * @param {string} netid.path.required - Cornell NetID of the user
 * @returns {ProfileResponse} User's profile data
 * @returns {Error} 404 - Profile not found
 * @returns {Error} 500 - Internal server error
 */
router.get('/api/profiles/:netid', async (req, res) => {
  try {
    const { netid } = req.params;
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
    res.status(200).json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * POST /api/profiles
 * Creates a new dating profile for the authenticated user
 * @route POST /api/profiles
 * @group Profiles - Profile management operations
 * @param {string} firebaseUid.body.required - Firebase authentication UID
 * @param {CreateProfileInput} profileData.body.required - Profile data (bio, gender, birthdate, year, school)
 * @returns {object} Success response with profile ID and NetID
 * @returns {Error} 400 - Missing required fields or invalid data
 * @returns {Error} 409 - Profile already exists for this user
 * @returns {Error} 500 - Internal server error
 * @description Validates required fields, checks for existing profiles, and creates new profile with server timestamps
 */
router.post('/api/profiles', async (req, res) => {
  try {
    console.log('Creating profile:', req.body);
    const {
      firebaseUid,
      ...profileData
    }: { firebaseUid: string } & CreateProfileInput = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ error: 'firebaseUid is required' });
    }

    // Verify user exists and get their netid
    const netid = await verifyUserExists(firebaseUid);
    if (!netid) {
      return res
        .status(400)
        .json({ error: 'User not found or invalid firebaseUid' });
    }

    // Validate required fields (netid is now derived from firebaseUid)
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

    // Create profile document with derived netid
    const profileDoc: ProfileDocWrite = {
      ...profileData,
      netid, // Use the netid derived from firebaseUid
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * PUT /api/profiles/me
 * Updates the authenticated user's existing profile
 * @route PUT /api/profiles/me
 * @group Profiles - Profile management operations
 * @param {string} firebaseUid.body.required - Firebase authentication UID
 * @param {UpdateProfileInput} updateData.body - Partial profile data to update
 * @returns {object} Success message
 * @returns {Error} 400 - Missing firebaseUid or invalid data
 * @returns {Error} 404 - User or profile not found
 * @returns {Error} 500 - Internal server error
 * @description Updates only provided fields, validates gender enum, converts dates, updates timestamp
 */
router.put('/api/profiles/me', async (req, res) => {
  try {
    const {
      firebaseUid,
      ...updateData
    }: { firebaseUid: string } & UpdateProfileInput = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ error: 'firebaseUid is required' });
    }

    // Verify user exists and get their netid
    const netid = await verifyUserExists(firebaseUid);
    if (!netid) {
      return res
        .status(400)
        .json({ error: 'User not found or invalid firebaseUid' });
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * DELETE /api/profiles/me
 * Permanently deletes the authenticated user's profile
 * @route DELETE /api/profiles/me
 * @group Profiles - Profile management operations
 * @param {string} firebaseUid.body.required - Firebase authentication UID
 * @returns {object} Success message
 * @returns {Error} 400 - Missing firebaseUid or user not found
 * @returns {Error} 404 - Profile not found
 * @returns {Error} 500 - Internal server error
 * @warning This operation is irreversible - all profile data will be permanently deleted
 */
router.delete('/api/profiles/me', async (req, res) => {
  try {
    const { firebaseUid } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ error: 'firebaseUid is required' });
    }

    // Verify user exists and get their netid
    const netid = await verifyUserExists(firebaseUid);
    if (!netid) {
      return res
        .status(400)
        .json({ error: 'User not found or invalid firebaseUid' });
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

    res.status(200).json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting profile:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * GET /api/profiles/matches
 * Retrieves potential dating matches for the authenticated user
 * @route GET /api/profiles/matches
 * @group Profiles - Profile management operations
 * @param {string} firebaseUid.query.required - Firebase authentication UID
 * @param {string} [limit=20] - Maximum number of matches to return
 * @returns {ProfileResponse[]} Array of potential match profiles
 * @returns {Error} 400 - Missing or invalid firebaseUid
 * @returns {Error} 404 - Current user profile not found
 * @returns {Error} 500 - Internal server error
 * @todo Implement sophisticated matching algorithm based on compatibility factors
 * @description Currently returns all profiles except the current user's - matching logic to be implemented
 */
router.get('/api/profiles/matches', async (req, res) => {
  try {
    const { firebaseUid, limit = '20' } = req.query;

    if (!firebaseUid || typeof firebaseUid !== 'string') {
      return res.status(400).json({ error: 'firebaseUid is required' });
    }

    // Verify user exists and get their netid
    const currentUserNetid = await verifyUserExists(firebaseUid);
    if (!currentUserNetid) {
      return res
        .status(400)
        .json({ error: 'User not found or invalid firebaseUid' });
    }

    // Get current user's profile to use for matching logic
    const currentUserSnapshot = await db
      .collection('profiles')
      .where('netid', '==', currentUserNetid)
      .get();

    if (currentUserSnapshot.empty) {
      return res.status(404).json({ error: 'Current user profile not found' });
    }

    // Get potential matches (exclude current user)
    const snapshot = await db
      .collection('profiles')
      .where('netid', '!=', currentUserNetid)
      .limit(parseInt(limit as string))
      .get();

    const matches: ProfileResponse[] = snapshot.docs.map((doc) =>
      profileDocToResponse({ id: doc.id, ...(doc.data() as ProfileDoc) })
    );

    // TODO: Add matching algorithm logic here
    // For now, just return all profiles except current user

    res.status(200).json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
