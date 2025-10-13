import { db } from '../../firebaseAdmin';
import {
  PreferencesDoc,
  PreferencesDocWrite,
  CreatePreferencesInput,
  UpdatePreferencesInput,
  PreferencesResponse,
} from '../../types';
import { FieldValue } from 'firebase-admin/firestore';

const PREFERENCES_COLLECTION = 'preferences';

/**
 * Create default preferences for a new user
 * @param netid - The user's Cornell NetID
 * @returns Promise resolving to the created PreferencesDoc
 */
export async function createDefaultPreferences(
  netid: string
): Promise<PreferencesDoc> {
  // Try to get interestedIn from the user's profile
  let genders: string[] = [];
  try {
    const profileSnapshot = await db
      .collection('profiles')
      .where('netid', '==', netid)
      .get();

    if (!profileSnapshot.empty) {
      const profileData = profileSnapshot.docs[0].data();
      if (profileData.interestedIn && Array.isArray(profileData.interestedIn)) {
        genders = profileData.interestedIn;
      }
    }
  } catch (error) {
    console.error(
      'Error fetching profile for preferences initialization:',
      error
    );
    // Continue with empty genders array if profile fetch fails
  }

  const preferencesData: PreferencesDocWrite = {
    netid,
    ageRange: { min: 18, max: 25 },
    years: ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'],
    schools: [], // Empty = all schools
    majors: [], // Empty = all majors
    genders, // Use interestedIn from profile, or empty array
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await db.collection(PREFERENCES_COLLECTION).doc(netid).set(preferencesData);

  // Fetch and return the created document
  return getPreferences(netid) as Promise<PreferencesDoc>;
}

/**
 * Get preferences for a user
 * @param netid - The user's Cornell NetID
 * @returns Promise resolving to PreferencesDoc or null if not found
 */
export async function getPreferences(
  netid: string
): Promise<PreferencesDoc | null> {
  const doc = await db.collection(PREFERENCES_COLLECTION).doc(netid).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data() as any;

  // Migration: if genders is empty but interestedIn exists, use interestedIn
  if (
    (!data.genders || data.genders.length === 0) &&
    data.interestedIn &&
    Array.isArray(data.interestedIn)
  ) {
    data.genders = data.interestedIn;
    // Update the document to migrate the data
    try {
      await db.collection(PREFERENCES_COLLECTION).doc(netid).update({
        genders: data.interestedIn,
      });
    } catch (error) {
      console.error('Error migrating interestedIn to genders:', error);
    }
  }

  return data as PreferencesDoc;
}

/**
 * Update preferences for a user
 * @param netid - The user's Cornell NetID
 * @param updates - Partial preferences data to update
 * @returns Promise resolving to the updated PreferencesDoc
 */
export async function updatePreferences(
  netid: string,
  updates: UpdatePreferencesInput
): Promise<PreferencesDoc> {
  const updateData = {
    ...updates,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await db.collection(PREFERENCES_COLLECTION).doc(netid).update(updateData);

  return getPreferences(netid) as Promise<PreferencesDoc>;
}

/**
 * Convert Firestore doc to API response format
 * @param doc - PreferencesDoc from Firestore
 * @returns PreferencesResponse with ISO string timestamps
 */
export function preferencesToResponse(
  doc: PreferencesDoc
): PreferencesResponse {
  return {
    ...doc,
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : doc.createdAt.toDate().toISOString(),
    updatedAt:
      doc.updatedAt instanceof Date
        ? doc.updatedAt.toISOString()
        : doc.updatedAt.toDate().toISOString(),
  };
}
