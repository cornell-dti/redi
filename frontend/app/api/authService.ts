import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { FirebaseError } from 'firebase/app';
import { createUserInBackend, loginUserInBackend } from './userApi';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '272234540869-847nqbb7foi8557s1msn3aegck6vs27e.apps.googleusercontent.com',
  iosClientId: '272234540869-6okghrkn79ub3kf6urj9h2jed3nmopel.apps.googleusercontent.com',
});

export const validateCornellEmail = (email: string): boolean => {
  const cornellEmailRegex = /^[a-zA-Z0-9]+@cornell\.edu$/;
  return cornellEmailRegex.test(email);
};

export const extractNetidFromEmail = (email: string): string | null => {
  const match = email.match(/^([a-zA-Z0-9]+)@cornell\.edu$/);
  return match ? match[1] : null;
};

/**
 * Creates a new user account with Firebase Auth and backend integration
 * @param email - Cornell email address
 * @param password - User password
 * @throws Error if registration fails
 */
export const signUpUser = async (
  email: string,
  password: string
): Promise<void> => {
  // Validate Cornell email before proceeding
  if (!validateCornellEmail(email)) {
    throw new Error('Please use your Cornell email address (@cornell.edu)');
  }

  try {
    // Create user in Firebase Auth
    const userCredential = await auth().createUserWithEmailAndPassword(
      email,
      password
    );
    const firebaseUser = userCredential.user;

    if (firebaseUser) {
      // Create user in backend
      await createUserInBackend(email);
    }
  } catch (error) {
    const err = error as FirebaseError;

    // Handle specific Firebase errors with messages
    if (err.code === 'auth/email-already-in-use') {
      throw new Error(
        'An account with this email already exists. Please try logging in instead.'
      );
    } else if (err.code === 'auth/weak-password') {
      throw new Error(
        'Password is too weak. Please choose a stronger password.'
      );
    } else if (err.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    } else {
      throw new Error(err.message || 'Registration failed. Please try again.');
    }
  }
};

/**
 * Signs in a user with email and password
 * @param email - Cornell email address
 * @param password - User password
 * @throws Error with user-friendly message if sign in fails
 */
export const signInUser = async (
  email: string,
  password: string
): Promise<void> => {
  // Validate Cornell email before proceeding
  if (!validateCornellEmail(email)) {
    throw new Error('Please use your Cornell email address (@cornell.edu)');
  }

  try {
    // Sign in with Firebase Auth
    const userCredential = await auth().signInWithEmailAndPassword(
      email,
      password
    );
    const firebaseUser = userCredential.user;

    if (firebaseUser) {
      // Verify user exists in backend and login
      await loginUserInBackend(email);
    }
  } catch (error) {
    const err = error as FirebaseError;

    // Handle specific Firebase errors with messages
    if (
      err.code === 'auth/user-not-found' ||
      err.code === 'auth/wrong-password'
    ) {
      throw new Error(
        'Invalid email or password. Please check your credentials and try again.'
      );
    } else if (err.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    } else if (err.code === 'auth/user-disabled') {
      throw new Error(
        'This account has been disabled. Please contact support.'
      );
    } else {
      throw new Error(err.message || 'Sign in failed. Please try again.');
    }
  }
};

/**
 * Signs in a user with Google OAuth using native Google Sign-In
 * @throws Error with user-friendly message if Google sign in fails
 */
export const signInWithGoogle = async (): Promise<void> => {
  try {
    // Check if device supports Google Play services (Android)
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Sign in with Google
    const userInfo = await GoogleSignin.signIn();

    // Get the ID token
    const idToken = userInfo.data?.idToken;

    if (!idToken) {
      throw new Error('Failed to get Google ID token');
    }

    // Create a Google credential with the token
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    // Sign-in the user with the credential
    const userCredential = await auth().signInWithCredential(googleCredential);
    const firebaseUser = userCredential.user;

    if (firebaseUser && firebaseUser.email) {
      // Validate Cornell email
      if (!validateCornellEmail(firebaseUser.email)) {
        // Sign out the user if they don't have a Cornell email
        await auth().signOut();
        await GoogleSignin.signOut();
        throw new Error(
          'Please use your Cornell email address (@cornell.edu)'
        );
      }

      // Try to login first, if user doesn't exist, create them
      try {
        await loginUserInBackend(firebaseUser.email);
      } catch (loginError) {
        // If login fails, try to create the user
        try {
          await createUserInBackend(firebaseUser.email);
        } catch (createError) {
          console.error('Failed to create user:', createError);
          await auth().signOut();
          await GoogleSignin.signOut();
          throw new Error('Failed to create user account. Please try again.');
        }
      }
    }
  } catch (error: any) {
    // Handle specific Google Sign-In errors
    if (error.code === 'SIGN_IN_CANCELLED') {
      throw new Error('Sign in was cancelled');
    } else if (error.code === 'IN_PROGRESS') {
      throw new Error('Sign in already in progress');
    } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      throw new Error('Google Play Services not available');
    }

    // If it's already our custom error, don't wrap it
    if (error instanceof Error) {
      throw error;
    }

    console.log('Google Sign-In Error:', error);
    throw new Error('Google Sign-In failed. Please try again.');
  }
};

/**
 * Signs out the current user
 * @throws Error if sign out fails
 */
export const signOutUser = async (): Promise<void> => {
  try {
    // Sign out from Firebase first
    await auth().signOut();
    console.log('Firebase sign-out successful');
  } catch (error) {
    console.error('Firebase sign out error:', error);
    throw new Error('Failed to sign out from Firebase. Please try again.');
  }

  // Attempt to sign out from Google (don't fail if this errors)
  try {
    const isSignedIn = await GoogleSignin.isSignedIn();
    if (isSignedIn) {
      await GoogleSignin.signOut();
      console.log('Google sign-out successful');
    }
  } catch (error) {
    // Log the error but don't throw - Firebase sign-out already succeeded
    console.warn('Google sign-out error (non-critical):', error);
  }
};

/**
 * Gets the current authenticated user
 * @returns Current Firebase user or null if not authenticated
 */
export const getCurrentUser = () => {
  return auth().currentUser;
};

/**
 * Sets up an authentication state listener
 * @param callback - Function to call when auth state changes
 * @returns Unsubscribe function
 */
export const onAuthStateChanged = (
  callback: (user: FirebaseAuthTypes.User | null) => void
) => {
  return auth().onAuthStateChanged(callback);
};
