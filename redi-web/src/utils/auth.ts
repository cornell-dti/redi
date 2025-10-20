// @/lib/auth.ts (or wherever your auth file is)
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { FIREBASE_APP } from '../../firebase';

// Admin UUID from environment variable (not hardcoded)
export const ADMIN_UUID = process.env.NEXT_PUBLIC_ADMIN_UID;

// Check if a user ID is the admin
export const isAdmin = (userId: string | undefined | null): boolean => {
  if (!ADMIN_UUID) {
    console.error('❌ ADMIN_UUID not configured in environment');
    return false;
  }

  console.log('🔍 isAdmin called with userId:', userId);
  console.log('🔍 Comparing with ADMIN_UUID:', ADMIN_UUID);
  const result = userId === ADMIN_UUID;
  console.log('🔍 isAdmin result:', result);
  return result;
};

// Get the current Firebase auth user
export const getCurrentUser = (): Promise<User | null> => {
  console.log('🔍 getCurrentUser called');
  const auth = getAuth(FIREBASE_APP);
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        console.log('✅ getCurrentUser resolved with user:', user?.uid);
        resolve(user);
      },
      reject
    );
  });
};

// Check if current user is admin
export const checkIsCurrentUserAdmin = async (): Promise<boolean> => {
  console.log('🔍 checkIsCurrentUserAdmin called');
  try {
    const user = await getCurrentUser();
    const result = isAdmin(user?.uid);
    console.log('✅ checkIsCurrentUserAdmin result:', result);
    return result;
  } catch (error) {
    console.error('❌ Error checking admin status:', error);
    return false;
  }
};
