import AsyncStorage from '@react-native-async-storage/async-storage';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { FirebaseError } from 'firebase/app';
import { API_BASE_URL } from '../../constants/constants';
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
  try {
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
  try {
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

    // Get the ID token and email
    const idToken = userInfo.data?.idToken;
    const email = userInfo.data?.user?.email;

    if (!idToken) {
      throw new Error('Failed to get Google ID token');
    }

    if (!email) {
      await GoogleSignin.signOut();
      throw new Error('Failed to get email from Google account');
    }

    // Validate Cornell email BEFORE signing in to Firebase
    // This prevents the auth state listener from being triggered with an invalid user
    if (!validateCornellEmail(email)) {
      await GoogleSignin.signOut();
      throw new Error(
        'Please use your Cornell email address (@cornell.edu)'
      );
    }

    // Create a Google credential with the token
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    // Sign-in the user with the credential
    const userCredential = await auth().signInWithCredential(googleCredential);
    const firebaseUser = userCredential.user;

    if (firebaseUser && firebaseUser.email) {
      // Ensure user exists in backend (create is idempotent — returns existing user if already created)
      try {
        await createUserInBackend(firebaseUser.email);
      } catch (createError) {
        console.error('Failed to ensure user in backend:', createError);
        await auth().signOut();
        await GoogleSignin.signOut();
        throw new Error('Failed to create user account. Please try again.');
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
    // Some versions of the GoogleSignin typings don't expose isSignedIn(),
    // so attempt to sign out directly and ignore failures.
    await GoogleSignin.signOut();
    console.log('Google sign-out successful');
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

// ============================================
// PASSWORDLESS EMAIL LINK AUTHENTICATION
// ============================================

// Web app URL for email link redirects
// Production URL - matches the backend configuration
const WEB_APP_URL = 'https://redi.love';

// AsyncStorage key for storing email during sign-in flow
const EMAIL_FOR_SIGN_IN_KEY = '@emailForSignIn';

/**
 * Sends a passwordless sign-in link to the user's email via backend
 * Uses the backend endpoint to generate and send the email
 * @param email - Cornell email address
 * @throws Error if sending the link fails
 */
export const sendPasswordlessSignInLink = async (
  email: string
): Promise<void> => {
  try {
    // Call backend endpoint to send the sign-in link
    // The backend will generate the Firebase link and send it via email
    const response = await fetch(
      `${API_BASE_URL}/api/auth/send-signin-link`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send sign-in link');
    }

    // Save the email locally to complete sign-in later
    await AsyncStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, email);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to send sign-in link. Please try again.');
  }
};

/**
 * Completes the passwordless sign-in flow using the email link
 * @param emailLink - The email link received by the user
 * @param email - Optional email (if not provided, retrieves from storage)
 * @returns The signed-in Firebase user
 * @throws Error if sign-in fails
 */
export const signInWithEmailLink = async (
  emailLink: string,
  email?: string
): Promise<FirebaseAuthTypes.User> => {
  try {
    const isEmailLink = await auth().isSignInWithEmailLink(emailLink);
    if (!isEmailLink) {
      throw new Error('Invalid sign-in link.');
    }

    let emailForSignIn = email;
    if (!emailForSignIn) {
      const storedEmail = await AsyncStorage.getItem(EMAIL_FOR_SIGN_IN_KEY);
      emailForSignIn = storedEmail || undefined;
    }

    if (!emailForSignIn) {
      throw new Error('Please provide your email to complete sign-in.');
    }

    // Validate Cornell email
    if (!validateCornellEmail(emailForSignIn)) {
      throw new Error('Please use your Cornell email address (@cornell.edu)');
    }

    const userCredential = await auth().signInWithEmailLink(
      emailForSignIn,
      emailLink
    );
    const firebaseUser = userCredential.user;

    if (firebaseUser && firebaseUser.email) {
      await AsyncStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);

      // Ensure user exists in backend (create is idempotent — returns existing user if already created)
      try {
        await createUserInBackend(firebaseUser.email);
      } catch (createError) {
        console.error('[Auth] Failed to ensure user in backend:', createError);
        await auth().signOut();
        throw new Error('Failed to create user account. Please try again.');
      }

      return firebaseUser;
    }

    throw new Error('Sign-in failed: No user returned from Firebase');
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    const err = error as FirebaseError;

    // Handle specific Firebase errors
    if (err.code === 'auth/invalid-action-code') {
      throw new Error('This sign-in link has expired or already been used.');
    } else if (err.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    } else {
      throw new Error(err.message || 'Sign-in failed. Please try again.');
    }
  }
};
