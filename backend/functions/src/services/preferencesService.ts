import { db } from '../firebaseAdmin';
import {
  PreferencesDoc,
  PreferencesDocWrite,
  UpdatePreferencesInput,
  PreferencesResponse,
} from '../types';
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
  const preferencesData: PreferencesDocWrite = {
    netid,
    ageRange: { min: 18, max: 25 },
    years: ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'],
    schools: [], // Empty = all schools
    majors: [], // Empty = all majors
    genders: [], // Will be set by user during onboarding or later in preferences
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

  return doc.data() as PreferencesDoc;
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
