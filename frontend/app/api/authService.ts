import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { createUserInBackend, loginUserInBackend } from './userApi';
import { WEB_APP_URL } from '../config';

// Type for Firebase errors (compatible with both Web and RN Firebase)
interface FirebaseError extends Error {
  code: string;
}

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
 * Signs in a user with Google OAuth
 * @param clientId - Google OAuth client ID
 * @param redirectScheme - App redirect scheme for OAuth
 * @throws Error with user-friendly message if Google sign in fails
 */
export const signInWithGoogle = async (
  clientId: string,
  redirectScheme: string
): Promise<void> => {
  try {
    const request = new AuthSession.AuthRequest({
      clientId,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: AuthSession.makeRedirectUri({
        scheme: redirectScheme,
      }),
      responseType: AuthSession.ResponseType.IdToken,
    });

    const result = await request.promptAsync({
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    });

    if (result.type === 'success') {
      const { id_token } = result.params;

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(id_token);

      // Sign-in the user with the credential
      const userCredential =
        await auth().signInWithCredential(googleCredential);
      const firebaseUser = userCredential.user;

      if (firebaseUser && firebaseUser.email) {
        // Validate Cornell email
        if (!validateCornellEmail(firebaseUser.email)) {
          // Sign out the user if they don't have a Cornell email
          await auth().signOut();
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
            throw new Error('Failed to create user account. Please try again.');
          }
        }
      }
    } else if (result.type === 'cancel') {
      throw new Error('Sign in was cancelled');
    }
  } catch (error) {
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
    await auth().signOut();
  } catch (error) {
    console.error('Sign out error:', error);
    throw new Error('Failed to sign out. Please try again.');
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

const EMAIL_FOR_SIGN_IN_KEY = '@emailForSignIn';

/**
 * Sends a passwordless sign-in link to the user's email
 * @param email - Cornell email address
 * @throws Error if sending the link fails
 */
export const sendPasswordlessSignInLink = async (
  email: string
): Promise<void> => {
  // Validate Cornell email before proceeding
  if (!validateCornellEmail(email)) {
    throw new Error('Please use your Cornell email address (@cornell.edu)');
  }

  try {
    // Configure the email link action settings
    const actionCodeSettings = {
      // URL must be a valid HTTPS URL (or localhost for dev)
      url: `${WEB_APP_URL}/auth-redirect?email=${encodeURIComponent(email)}`,
      handleCodeInApp: true,
      iOS: {
        bundleId: 'com.incubator.redi',
      },
      android: {
        packageName: 'com.incubator.redi',
        installApp: false,
      },
    };

    // Send the sign-in link using React Native Firebase
    await auth().sendSignInLinkToEmail(email, actionCodeSettings);

    // Save the email locally to complete sign-in later
    await AsyncStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, email);
  } catch (error) {
    const err = error as FirebaseError;

    // Handle specific Firebase errors
    if (err.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    } else if (err.code === 'auth/missing-android-pkg-name') {
      throw new Error('Configuration error. Please contact support.');
    } else if (err.code === 'auth/missing-continue-uri') {
      throw new Error('Configuration error. Please contact support.');
    } else {
      throw new Error(err.message || 'Failed to send sign-in link. Please try again.');
    }
  }
};

/**
 * Completes the passwordless sign-in flow using the email link
 * @param emailLink - The email link received by the user
 * @param email - Optional email (if not provided, retrieves from storage)
 * @throws Error if sign-in fails
 */
export const signInWithEmailLink = async (
  emailLink: string,
  email?: string
): Promise<void> => {
  try {
    // Check if the link is a valid sign-in link using React Native Firebase
    const isEmailLink = await auth().isSignInWithEmailLink(emailLink);
    if (!isEmailLink) {
      throw new Error('Invalid sign-in link.');
    }

    // Get email from parameter or storage
    let emailForSignIn = email;
    if (!emailForSignIn) {
      const storedEmail = await AsyncStorage.getItem(EMAIL_FOR_SIGN_IN_KEY);
      emailForSignIn = storedEmail || undefined;
    }

    if (!emailForSignIn) {
      throw new Error(
        'Please provide your email to complete sign-in.'
      );
    }

    // Validate Cornell email
    if (!validateCornellEmail(emailForSignIn)) {
      throw new Error('Please use your Cornell email address (@cornell.edu)');
    }

    // Sign in with the email link using React Native Firebase
    const userCredential = await auth().signInWithEmailLink(
      emailForSignIn,
      emailLink
    );
    const firebaseUser = userCredential.user;

    if (firebaseUser && firebaseUser.email) {
      // Clear the stored email
      await AsyncStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);

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
          throw new Error('Failed to create user account. Please try again.');
        }
      }
    }
  } catch (error) {
    // If it's already our custom error, don't wrap it
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

