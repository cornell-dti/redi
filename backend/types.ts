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
  bio: string;
  gender: Gender;
  birthdate: FirestoreTimestampType | Date;
  instagram?: string;
  snapchat?: string;
  phoneNumber?: string;
  year: number;
  school: School;
  major: string[];
  pictures: string[];
  createdAt: FirestoreTimestampType | FieldValue;
  updatedAt: FirestoreTimestampType | FieldValue;
}

export type Gender = 'female' | 'male' | 'non-binary';

export type School = 
  | 'College of Arts and Science'
  | 'Cals'
  | 'Hotel and Administration' 
  | 'AAP'
  | 'Dyson'
  | 'Engineering'
  | 'ILR'
  | 'Human Ecology'
  | 'Veterinary Medicine'
  | 'Graduate School'
  | 'Law School'
  | 'Business School'
  | 'Medical College';

// Profile document in Firestore (profiles collection)
export interface ProfileDoc {
  netid: string;
  bio: string;
  gender: Gender;
  birthdate: FirestoreTimestampType; 
  instagram?: string;
  snapchat?: string;
  phoneNumber?: string;
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
  bio: string;
  gender: Gender;
  birthdate: string; // ISO string format for JSON
  instagram?: string;
  snapchat?: string;
  phoneNumber?: string;
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
export type UpdateProfileInput = Partial<Omit<ProfileDoc, 'netid' | 'createdAt' | 'updatedAt'>>;

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