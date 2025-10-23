import { ProfileResponse } from '../../types';

/**
 * Privacy filtering utilities for profile data
 * Ensures user privacy preferences are respected when displaying profiles
 */

/**
 * Context in which a profile is being viewed
 */
export enum ProfileViewContext {
  OWN_PROFILE = 'own', // User viewing their own profile
  MATCHED_USER = 'matched', // User viewing someone they've matched with
  PUBLIC_BROWSE = 'public', // User browsing potential matches
  ADMIN_VIEW = 'admin', // Admin viewing for moderation
}

/**
 * Filters profile data based on privacy settings and view context
 * @param profile - Full profile data from database
 * @param context - Context in which profile is being viewed
 * @returns Filtered profile respecting privacy settings
 */
export function filterProfileByPrivacy(
  profile: ProfileResponse,
  context: ProfileViewContext
): Partial<ProfileResponse> {
  // Always return full profile for own view or admin view
  if (context === ProfileViewContext.OWN_PROFILE || context === ProfileViewContext.ADMIN_VIEW) {
    return profile;
  }

  // For matched users, show more information but still respect some privacy settings
  if (context === ProfileViewContext.MATCHED_USER) {
    return {
      netid: profile.netid,
      firstName: profile.firstName,
      bio: profile.bio,
      birthdate: profile.birthdate,
      year: profile.year,
      school: profile.school,
      major: profile.major,
      pictures: profile.pictures,
      prompts: profile.prompts,
      interests: profile.interests,
      clubs: profile.clubs,
      // Conditionally include based on privacy settings
      gender: profile.showGenderOnProfile ? profile.gender : undefined,
      pronouns: profile.showPronounsOnProfile ? profile.pronouns : undefined,
      hometown: profile.showHometownOnProfile ? profile.hometown : undefined,
      ethnicity: profile.showEthnicityOnProfile ? profile.ethnicity : undefined,
      sexualOrientation: profile.showSexualOrientationOnProfile
        ? profile.sexualOrientation
        : undefined,
      // Contact info (shown after match)
      instagram: profile.instagram,
      snapchat: profile.snapchat,
      phoneNumber: profile.phoneNumber,
      linkedIn: profile.linkedIn,
      github: profile.github,
      website: profile.website,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  // For public browsing (before match), show limited information
  // Respect all privacy settings
  return {
    netid: profile.netid,
    firstName: profile.firstName,
    bio: profile.bio,
    year: profile.year,
    pictures: profile.pictures,
    prompts: profile.prompts,
    interests: profile.interests,
    clubs: profile.clubs,
    major: profile.major,
    // Only show if privacy setting allows
    gender: profile.showGenderOnProfile ? profile.gender : undefined,
    pronouns: profile.showPronounsOnProfile ? profile.pronouns : undefined,
    hometown: profile.showHometownOnProfile ? profile.hometown : undefined,
    school: profile.showCollegeOnProfile ? profile.school : undefined,
    ethnicity: profile.showEthnicityOnProfile ? profile.ethnicity : undefined,
    sexualOrientation: profile.showSexualOrientationOnProfile
      ? profile.sexualOrientation
      : undefined,
    // Never show contact info before matching
    instagram: undefined,
    snapchat: undefined,
    phoneNumber: undefined,
    linkedIn: undefined,
    github: undefined,
    website: undefined,
    // Never show exact birthdate before matching (show age instead)
    birthdate: undefined,
    createdAt: undefined,
    updatedAt: undefined,
  };
}

/**
 * Calculates age from birthdate string
 * @param birthdate - ISO date string
 * @returns Age in years
 */
export function calculateAge(birthdate: string): number {
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Returns a public-safe profile with age instead of birthdate
 * @param profile - Full profile data
 * @param context - View context
 * @returns Profile with age field instead of birthdate
 */
export function getProfileWithAge(
  profile: ProfileResponse,
  context: ProfileViewContext
): Partial<ProfileResponse> & { age?: number } {
  const filteredProfile = filterProfileByPrivacy(profile, context);

  // Add age for public browsing (instead of exact birthdate)
  if (context === ProfileViewContext.PUBLIC_BROWSE) {
    return {
      ...filteredProfile,
      age: calculateAge(profile.birthdate),
    };
  }

  return filteredProfile;
}

/**
 * Checks if user has been matched with another user
 * @param netid1 - First user's netid
 * @param netid2 - Second user's netid
 * @param db - Firestore database instance
 * @returns True if users have matched in any weekly prompt
 */
export async function areUsersMatched(
  netid1: string,
  netid2: string,
  db: FirebaseFirestore.Firestore
): Promise<boolean> {
  try {
    // Check if netid1 has any matches with netid2
    const matches1 = await db
      .collection('weeklyMatches')
      .where('netid', '==', netid1)
      .get();

    for (const doc of matches1.docs) {
      const data = doc.data();
      if (
        data.matches &&
        data.matches.some((match: any) => match.matchedNetid === netid2)
      ) {
        return true;
      }
    }

    // Check reverse (netid2 matched with netid1)
    const matches2 = await db
      .collection('weeklyMatches')
      .where('netid', '==', netid2)
      .get();

    for (const doc of matches2.docs) {
      const data = doc.data();
      if (
        data.matches &&
        data.matches.some((match: any) => match.matchedNetid === netid1)
      ) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking match status:', error);
    return false;
  }
}

/**
 * Checks if user has blocked another user
 * @param blocker - User who may have blocked
 * @param blocked - User who may be blocked
 * @param db - Firestore database instance
 * @returns True if blocked
 */
export async function isUserBlocked(
  blocker: string,
  blocked: string,
  db: FirebaseFirestore.Firestore
): Promise<boolean> {
  try {
    const blockDoc = await db
      .collection('blocks')
      .where('blocker', '==', blocker)
      .where('blocked', '==', blocked)
      .get();

    return !blockDoc.empty;
  } catch (error) {
    console.error('Error checking block status:', error);
    return false;
  }
}

/**
 * Determines appropriate view context for a profile
 * @param viewerNetid - Netid of user viewing the profile
 * @param profileNetid - Netid of profile being viewed
 * @param isAdmin - Whether viewer is an admin
 * @param db - Firestore database instance
 * @returns Appropriate view context
 */
export async function determineViewContext(
  viewerNetid: string,
  profileNetid: string,
  isAdmin: boolean,
  db: FirebaseFirestore.Firestore
): Promise<ProfileViewContext> {
  // Own profile
  if (viewerNetid === profileNetid) {
    return ProfileViewContext.OWN_PROFILE;
  }

  // Admin view
  if (isAdmin) {
    return ProfileViewContext.ADMIN_VIEW;
  }

  // Check if users have matched
  const matched = await areUsersMatched(viewerNetid, profileNetid, db);
  if (matched) {
    return ProfileViewContext.MATCHED_USER;
  }

  // Default to public browse
  return ProfileViewContext.PUBLIC_BROWSE;
}
