import { FieldValue } from 'firebase-admin/firestore';
import { Timestamp as FirestoreTimestamp } from 'firebase/firestore';

// =============================================================================
// DATABASE MODELS (Firestore)
// =============================================================================

// Firestore timestamp type - can be Firestore Timestamp or Date
type FirestoreTimestampType = FirestoreTimestamp | Date;

// User document in Firestore (users collection)
export interface UserDoc {
  netid: string;
  email: string;
  firebaseUid: string;
  createdAt: FirestoreTimestampType;
}
// User document when writing to Firestore (includes FieldValue for serverTimestamp)
export interface UserDocWrite {
  netid: string;
  email: string;
  firebaseUid: string;
  createdAt: FirestoreTimestampType | FieldValue;
}

// Profile document when writing to Firestore (includes FieldValue for timestamps)
export interface ProfileDocWrite {
  netid: string;
  firstName: string;
  bio: string;
  gender: Gender;
  birthdate: FirestoreTimestampType | Date;
  hometown?: string;
  pronouns?: string[];
  ethnicity?: string[];
  sexualOrientation?: string[];
  showGenderOnProfile?: boolean;
  showPronounsOnProfile?: boolean;
  showHometownOnProfile?: boolean;
  showCollegeOnProfile?: boolean;
  showEthnicityOnProfile?: boolean;
  showSexualOrientationOnProfile?: boolean;
  prompts?: { question: string; answer: string }[];
  instagram?: string;
  snapchat?: string;
  phoneNumber?: string;
  linkedIn?: string;
  github?: string;
  website?: string;
  clubs?: string[];
  interests?: string[];
  year: number;
  school: School;
  major: string[];
  pictures: string[];
  createdAt: FirestoreTimestampType | FieldValue;
  updatedAt: FirestoreTimestampType | FieldValue;
}

export type Gender = 'female' | 'male' | 'non-binary';

export type School =
  | 'College of Agriculture and Life Sciences'
  | 'College of Architecture, Art, and Planning'
  | 'College of Arts and Sciences'
  | 'Cornell SC Johnson College of Business'
  | 'College of Engineering'
  | 'College of Human Ecology'
  | 'School of Industrial and Labor Relations'
  | 'Graduate School'
  | 'Law School'
  | 'Brooks School of Public Policy'
  | 'Weill Cornell Medical'
  | 'College of Veterinary Medicine'
  | 'Nolan School of Hotel Administration';

export type Year =
  | 'Freshman'
  | 'Sophomore'
  | 'Junior'
  | 'Senior'
  | 'Graduate'
  | 'PhD'
  | 'Post-Doc';

// Profile document in Firestore (profiles collection)
export interface ProfileDoc {
  netid: string;
  firstName: string;
  bio: string;
  gender: Gender;
  birthdate: FirestoreTimestampType;
  hometown?: string;
  pronouns?: string[];
  ethnicity?: string[];
  sexualOrientation?: string[];
  showGenderOnProfile?: boolean;
  showPronounsOnProfile?: boolean;
  showHometownOnProfile?: boolean;
  showCollegeOnProfile?: boolean;
  showEthnicityOnProfile?: boolean;
  showSexualOrientationOnProfile?: boolean;
  prompts?: { question: string; answer: string }[];
  instagram?: string;
  snapchat?: string;
  phoneNumber?: string;
  linkedIn?: string;
  github?: string;
  website?: string;
  clubs?: string[];
  interests?: string[];
  year: number;
  school: School;
  major: string[];
  pictures: string[]; // URLs to images in Firebase Storage
  createdAt: FirestoreTimestampType;
  updatedAt: FirestoreTimestampType;
}

// =============================================================================
// API RESPONSE TYPES (Client-facing)
// =============================================================================

// User data for API responses (excluding sensitive data like password)
export interface UserResponse {
  netid: string;
  createdAt: string; // ISO string format for JSON
}

// Profile data for API responses
export interface ProfileResponse {
  netid: string;
  firstName: string;
  bio: string;
  gender: Gender;
  birthdate: string; // ISO string format for JSON
  hometown?: string;
  pronouns?: string[];
  ethnicity?: string[];
  sexualOrientation?: string[];
  showGenderOnProfile?: boolean;
  showPronounsOnProfile?: boolean;
  showHometownOnProfile?: boolean;
  showCollegeOnProfile?: boolean;
  showEthnicityOnProfile?: boolean;
  showSexualOrientationOnProfile?: boolean;
  prompts?: { question: string; answer: string }[];
  instagram?: string;
  snapchat?: string;
  phoneNumber?: string;
  linkedIn?: string;
  github?: string;
  website?: string;
  clubs?: string[];
  interests?: string[];
  year: number;
  school: School;
  major: string[];
  pictures: string[];
  createdAt: string; // ISO string format for JSON
  updatedAt: string; // ISO string format for JSON
}

// =============================================================================
// INPUT TYPES (for creating/updating documents)
// =============================================================================

// For creating a new user
export type CreateUserInput = Omit<UserDoc, 'createdAt'>;

// For creating a new profile
export type CreateProfileInput = Omit<ProfileDoc, 'createdAt' | 'updatedAt'>;

// For updating a profile (all fields optional except netid)
export type UpdateProfileInput = Partial<
  Omit<ProfileDoc, 'netid' | 'createdAt' | 'updatedAt'>
>;

// =============================================================================
// UTILITY TYPES
// =============================================================================

// Convert Firestore document to API response
export type DocToResponse<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends FirestoreTimestampType
    ? string
    : T[K] extends FirestoreTimestampType | undefined
      ? string | undefined
      : T[K];
};

// Helper type for Firestore document with auto-generated ID
export type FirestoreDoc<T> = T & {
  id: string; // Firestore document ID
};

// =============================================================================
// PREFERENCES MODELS (Dating Preferences)
// =============================================================================

// Preferences document in Firestore (preferences collection)
export interface PreferencesDoc {
  netid: string; // Use netid as document ID for efficient lookups
  ageRange: {
    min: number; // Minimum age (e.g., 18)
    max: number; // Maximum age (e.g., 25)
  };
  years: Year[]; // Array of acceptable academic years
  schools: School[]; // Array of acceptable schools (empty = all schools)
  majors: string[]; // Array of acceptable majors (empty = all majors)
  genders: Gender[]; // Array of genders user is interested in dating
  createdAt: FirestoreTimestampType;
  updatedAt: FirestoreTimestampType;
}

// Preferences document when writing to Firestore
export interface PreferencesDocWrite {
  netid: string;
  ageRange: {
    min: number;
    max: number;
  };
  years: Year[];
  schools: School[];
  majors: string[];
  genders: Gender[];
  createdAt: FirestoreTimestampType | FieldValue;
  updatedAt: FirestoreTimestampType | FieldValue;
}

// Preferences data for API responses
export interface PreferencesResponse {
  netid: string;
  ageRange: {
    min: number;
    max: number;
  };
  years: Year[];
  schools: School[];
  majors: string[];
  genders: Gender[];
  createdAt: string; // ISO string format for JSON
  updatedAt: string; // ISO string format for JSON
}

// For creating new preferences
export type CreatePreferencesInput = Omit<
  PreferencesDoc,
  'createdAt' | 'updatedAt'
>;

// For updating preferences (all fields optional except netid)
export type UpdatePreferencesInput = Partial<
  Omit<PreferencesDoc, 'netid' | 'createdAt' | 'updatedAt'>
>;

// =============================================================================
// WEEKLY PROMPTS MODELS
// =============================================================================

// Weekly prompt document in Firestore (weeklyPrompts collection)
export interface WeeklyPromptDoc {
  promptId: string; // Year-week format (e.g., "2025-W42")
  question: string; // The prompt question text
  releaseDate: FirestoreTimestampType; // Monday at 12:01 AM ET
  matchDate: FirestoreTimestampType; // Friday at 12:01 AM ET
  active: boolean; // Only one prompt should be active at a time
  createdAt: FirestoreTimestampType;
}

// Weekly prompt document when writing to Firestore
export interface WeeklyPromptDocWrite {
  promptId: string;
  question: string;
  releaseDate: FirestoreTimestampType | Date;
  matchDate: FirestoreTimestampType | Date;
  active: boolean;
  createdAt: FirestoreTimestampType | FieldValue;
}

// Weekly prompt data for API responses
export interface WeeklyPromptResponse {
  promptId: string;
  question: string;
  releaseDate: string; // ISO string format for JSON
  matchDate: string; // ISO string format for JSON
  active: boolean;
  createdAt: string; // ISO string format for JSON
}

// For creating a new weekly prompt
export type CreateWeeklyPromptInput = Omit<
  WeeklyPromptDoc,
  'createdAt' | 'active'
>;

// For updating a weekly prompt (all fields optional except promptId)
export type UpdateWeeklyPromptInput = Partial<
  Omit<WeeklyPromptDoc, 'promptId' | 'createdAt'>
>;

// =============================================================================
// WEEKLY PROMPT ANSWERS MODELS
// =============================================================================

// Weekly prompt answer document in Firestore (weeklyPromptAnswers collection)
// Document ID format: ${netid}_${promptId}
export interface WeeklyPromptAnswerDoc {
  netid: string; // User's Cornell NetID
  promptId: string; // Reference to the prompt (e.g., "2025-W42")
  answer: string; // User's answer text (max 500 characters)
  createdAt: FirestoreTimestampType;
}

// Weekly prompt answer document when writing to Firestore
export interface WeeklyPromptAnswerDocWrite {
  netid: string;
  promptId: string;
  answer: string;
  createdAt: FirestoreTimestampType | FieldValue;
}

// Weekly prompt answer data for API responses
export interface WeeklyPromptAnswerResponse {
  netid: string;
  promptId: string;
  answer: string;
  createdAt: string; // ISO string format for JSON
}

// For creating a new prompt answer
export type CreateWeeklyPromptAnswerInput = Omit<
  WeeklyPromptAnswerDoc,
  'createdAt'
>;

// =============================================================================
// WEEKLY MATCHES MODELS
// =============================================================================

// Weekly match document in Firestore (weeklyMatches collection)
// Document ID format: ${netid}_${promptId}
export interface WeeklyMatchDoc {
  netid: string; // User receiving the matches
  promptId: string; // Reference to the prompt used for matching
  matches: string[]; // Array of 3 matched user netids
  revealed: boolean[]; // Array of 3 booleans indicating if match was viewed
  createdAt: FirestoreTimestampType; // When matches were generated (Friday)
}

// Weekly match document when writing to Firestore
export interface WeeklyMatchDocWrite {
  netid: string;
  promptId: string;
  matches: string[];
  revealed: boolean[];
  createdAt: FirestoreTimestampType | FieldValue;
}

// Weekly match data for API responses
export interface WeeklyMatchResponse {
  netid: string;
  promptId: string;
  matches: string[];
  revealed: boolean[];
  createdAt: string; // ISO string format for JSON
}

// For creating new weekly matches
export type CreateWeeklyMatchInput = Omit<WeeklyMatchDoc, 'createdAt'>;

// For updating match revealed status
export interface UpdateWeeklyMatchRevealedInput {
  matchIndex: number; // Index of the match to reveal (0-2)
}
