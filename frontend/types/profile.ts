// =============================================================================
// PROFILE TYPES
// =============================================================================

import type { Year } from '../constants/cornell';

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

// =============================================================================
// PROFILE RESPONSE TYPES (Context-based Privacy Filtering)
// =============================================================================

/**
 * Base profile fields that are always present
 */
interface BaseProfileResponse {
  netid: string;
  firstName: string;
  bio: string;
  year: Year;
  pictures: string[];
  prompts?: { question: string; answer: string }[];
  interests?: string[];
  clubs?: string[];
  major: string[];
  // Privacy-controlled fields (may be undefined based on user preferences)
  gender?: Gender;
  pronouns?: string[];
  hometown?: string;
  school?: School;
  ethnicity?: string[];
  sexualOrientation?: string[];
  // Privacy setting flags
  showGenderOnProfile?: boolean;
  showPronounsOnProfile?: boolean;
  showHometownOnProfile?: boolean;
  showCollegeOnProfile?: boolean;
  showEthnicityOnProfile?: boolean;
  showSexualOrientationOnProfile?: boolean;
}

/**
 * Own profile response - includes full data including birthdate
 * Used when viewing your own profile (OWN_PROFILE context)
 */
export interface OwnProfileResponse extends BaseProfileResponse {
  birthdate: string; // ISO string format - only available for own profile
  gender: Gender; // Always present for own profile
  school: School; // Always present for own profile
  instagram?: string;
  snapchat?: string;
  phoneNumber?: string;
  linkedIn?: string;
  github?: string;
  website?: string;
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
}

/**
 * Matched user profile response - includes birthdate and contact info after matching
 * Used when viewing profiles of users you've matched with (MATCHED_USER context)
 */
export interface MatchedProfileResponse extends BaseProfileResponse {
  birthdate: string; // ISO string format - available for matched users
  // Contact info (shown after match)
  instagram?: string;
  snapchat?: string;
  phoneNumber?: string;
  linkedIn?: string;
  github?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Public profile response - includes age instead of birthdate for privacy
 * Used when browsing potential matches (PUBLIC_BROWSE context)
 * Does NOT include birthdate, contact info, or timestamps for privacy
 */
export interface PublicProfileResponse extends BaseProfileResponse {
  age: number; // Calculated age instead of exact birthdate for privacy
  // Contact info and timestamps are not included for public browsing
}

/**
 * Union type for all possible profile response shapes
 * Use this when the context is not known at compile time
 */
export type ProfileResponse =
  | OwnProfileResponse
  | MatchedProfileResponse
  | PublicProfileResponse;

/**
 * Type guard to check if a profile has birthdate (own or matched profile)
 */
export function hasBirthdate(
  profile: ProfileResponse
): profile is OwnProfileResponse | MatchedProfileResponse {
  return 'birthdate' in profile && profile.birthdate !== undefined;
}

/**
 * Type guard to check if a profile has age (public profile)
 */
export function hasAge(
  profile: ProfileResponse
): profile is PublicProfileResponse {
  return 'age' in profile && profile.age !== undefined;
}

/**
 * Get age from any profile type
 * For public profiles, returns the age field directly
 * For own/matched profiles, calculates age from birthdate
 */
export function getProfileAge(profile: ProfileResponse): number {
  if (hasAge(profile)) {
    return profile.age;
  }
  if (hasBirthdate(profile)) {
    // Calculate age from birthdate
    const birth = new Date(profile.birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  }
  return 0; // Fallback
}

// Input for creating a new profile (matches backend CreateProfileInput)
export interface CreateProfileInput {
  netid: string;
  firstName: string;
  bio: string;
  gender: Gender;
  birthdate: string | Date; // ISO string or Date
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
  year: Year;
  school: School;
  major: string[];
  pictures: string[];
}

// Input for updating a profile (all fields optional except those omitted)
export type UpdateProfileInput = Partial<Omit<CreateProfileInput, 'netid'>>;

// Response when creating a profile
export interface CreateProfileResponse {
  id: string;
  netid: string;
  message: string;
}
