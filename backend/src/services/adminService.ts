import admin from 'firebase-admin';
import { db } from '../../firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Admin document structure in Firestore
 */
export interface AdminDoc {
  uid: string;
  email: string;
  displayName?: string;
  role: 'super_admin' | 'admin'; // Future-proof for role hierarchy
  disabled: boolean;
  createdAt: Timestamp;
  createdBy: string; // UID of admin who created this admin
  lastLoginAt?: Timestamp;
  notes?: string; // Optional notes about this admin
}

/**
 * Response format for admin data
 */
export interface AdminResponse extends Omit<AdminDoc, 'createdAt' | 'lastLoginAt'> {
  createdAt: string;
  lastLoginAt?: string;
}

/**
 * Input for creating a new admin
 */
export interface CreateAdminInput {
  email: string;
  displayName?: string;
  role?: 'super_admin' | 'admin';
  notes?: string;
}

/**
 * Adds a new admin user
 *
 * This function:
 * 1. Looks up Firebase user by email
 * 2. Sets admin custom claim on the user
 * 3. Adds user to admins collection in Firestore
 *
 * @param input - Admin creation data
 * @param createdByUid - UID of the admin creating this admin
 * @returns Promise<AdminResponse> - The created admin document
 * @throws Error if user not found or already an admin
 */
export async function addAdmin(
  input: CreateAdminInput,
  createdByUid: string
): Promise<AdminResponse> {
  console.log(`➕ [Admin Service] Adding new admin: ${input.email}`);

  try {
    // 1. Look up user by email
    const user = await admin.auth().getUserByEmail(input.email);
    console.log(`✅ [Admin Service] Found user: ${user.uid}`);

    // 2. Check if already an admin
    const existingAdmin = await db.collection('admins').doc(user.uid).get();
    if (existingAdmin.exists) {
      throw new Error('User is already an admin');
    }

    // 3. Set custom claim
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`✅ [Admin Service] Set admin custom claim for: ${user.uid}`);

    // 4. Create admin document
    const adminDoc: AdminDoc = {
      uid: user.uid,
      email: input.email,
      displayName: input.displayName || user.displayName || undefined,
      role: input.role || 'admin',
      disabled: false,
      createdAt: Timestamp.now(),
      createdBy: createdByUid,
      notes: input.notes,
    };

    await db.collection('admins').doc(user.uid).set(adminDoc);
    console.log(`✅ [Admin Service] Created admin document for: ${user.uid}`);

    return adminToResponse(adminDoc);
  } catch (error) {
    console.error('❌ [Admin Service] Error adding admin:', error);
    if (error instanceof Error && error.message === 'User is already an admin') {
      throw error;
    }
    throw new Error(`Failed to add admin: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Removes an admin user
 *
 * This function:
 * 1. Removes admin custom claim
 * 2. Marks admin as disabled in Firestore (soft delete)
 *
 * Note: We don't delete the document to maintain audit history
 *
 * @param uid - UID of the admin to remove
 * @returns Promise<void>
 * @throws Error if admin not found
 */
export async function removeAdmin(uid: string): Promise<void> {
  console.log(`➖ [Admin Service] Removing admin: ${uid}`);

  try {
    // 1. Check if admin exists
    const adminDoc = await db.collection('admins').doc(uid).get();
    if (!adminDoc.exists) {
      throw new Error('Admin not found');
    }

    // 2. Remove custom claim
    await admin.auth().setCustomUserClaims(uid, { admin: false });
    console.log(`✅ [Admin Service] Removed admin custom claim for: ${uid}`);

    // 3. Mark as disabled (soft delete for audit history)
    await db.collection('admins').doc(uid).update({
      disabled: true,
      disabledAt: Timestamp.now(),
    });
    console.log(`✅ [Admin Service] Marked admin as disabled: ${uid}`);
  } catch (error) {
    console.error('❌ [Admin Service] Error removing admin:', error);
    throw new Error(`Failed to remove admin: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets all admins from Firestore
 *
 * @param includeDisabled - Whether to include disabled admins (default: false)
 * @returns Promise<AdminResponse[]> - List of admin users
 */
export async function getAllAdmins(includeDisabled: boolean = false): Promise<AdminResponse[]> {
  console.log(`📋 [Admin Service] Getting all admins (includeDisabled: ${includeDisabled})`);

  try {
    let query = db.collection('admins').orderBy('createdAt', 'desc');

    if (!includeDisabled) {
      query = query.where('disabled', '==', false) as any;
    }

    const snapshot = await query.get();
    const admins = snapshot.docs.map(doc => adminToResponse(doc.data() as AdminDoc));

    console.log(`✅ [Admin Service] Found ${admins.length} admins`);
    return admins;
  } catch (error) {
    console.error('❌ [Admin Service] Error getting admins:', error);
    throw new Error('Failed to retrieve admins');
  }
}

/**
 * Gets a single admin by UID
 *
 * @param uid - UID of the admin to retrieve
 * @returns Promise<AdminResponse | null> - Admin document or null if not found
 */
export async function getAdminByUid(uid: string): Promise<AdminResponse | null> {
  console.log(`🔍 [Admin Service] Getting admin: ${uid}`);

  try {
    const adminDoc = await db.collection('admins').doc(uid).get();

    if (!adminDoc.exists) {
      console.log(`⚠️ [Admin Service] Admin not found: ${uid}`);
      return null;
    }

    return adminToResponse(adminDoc.data() as AdminDoc);
  } catch (error) {
    console.error('❌ [Admin Service] Error getting admin:', error);
    throw new Error('Failed to retrieve admin');
  }
}

/**
 * Updates admin's last login timestamp
 * Called automatically during authentication
 *
 * @param uid - UID of the admin who logged in
 * @returns Promise<void>
 */
export async function updateAdminLastLogin(uid: string): Promise<void> {
  try {
    await db.collection('admins').doc(uid).update({
      lastLoginAt: Timestamp.now(),
    });
    console.log(`✅ [Admin Service] Updated last login for: ${uid}`);
  } catch (error) {
    // Don't throw error - this is non-critical
    console.error('❌ [Admin Service] Error updating last login:', error);
  }
}

/**
 * Updates admin information
 *
 * @param uid - UID of the admin to update
 * @param updates - Partial admin data to update
 * @returns Promise<AdminResponse> - Updated admin document
 */
export async function updateAdmin(
  uid: string,
  updates: Partial<Pick<AdminDoc, 'displayName' | 'role' | 'notes' | 'disabled'>>
): Promise<AdminResponse> {
  console.log(`📝 [Admin Service] Updating admin: ${uid}`);

  try {
    const adminDoc = await db.collection('admins').doc(uid).get();

    if (!adminDoc.exists) {
      throw new Error('Admin not found');
    }

    await db.collection('admins').doc(uid).update(updates);
    console.log(`✅ [Admin Service] Updated admin: ${uid}`);

    const updatedDoc = await db.collection('admins').doc(uid).get();
    return adminToResponse(updatedDoc.data() as AdminDoc);
  } catch (error) {
    console.error('❌ [Admin Service] Error updating admin:', error);
    throw new Error('Failed to update admin');
  }
}

/**
 * Converts Firestore admin document to API response format
 * Converts Timestamps to ISO strings
 *
 * @param doc - Admin document from Firestore
 * @returns AdminResponse - API response format
 */
function adminToResponse(doc: AdminDoc): AdminResponse {
  return {
    uid: doc.uid,
    email: doc.email,
    displayName: doc.displayName,
    role: doc.role,
    disabled: doc.disabled,
    createdAt: doc.createdAt.toDate().toISOString(),
    createdBy: doc.createdBy,
    lastLoginAt: doc.lastLoginAt?.toDate().toISOString(),
    notes: doc.notes,
  };
}
