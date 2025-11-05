/**
 * SHARED MATCHING ALGORITHM
 * This file is copied to the cloud functions directory during build.
 * Source of truth: /backend/src/services/matchingAlgorithm.ts
 * DO NOT EDIT the copy in /backend/functions/src/services/
 *
 * Note: This file imports from '../types' which resolves to:
 * - /backend/types.ts when in /backend/src/services/
 * - /backend/functions/src/types.ts when in /backend/functions/src/services/ (copied during build)
 */

import { PreferencesDoc, ProfileDoc, Year } from '../../types';

/**
 * UserData interface for matching algorithm
 */
export interface UserData {
  profile: ProfileDoc | null;
  preferences: PreferencesDoc | null;
}

/**
 * Find up to 3 compatible matches for a user
 * @param netid - User's Cornell NetID
 * @param userData - User's profile and preferences
 * @param allUsersMap - Map of all users' data
 * @param previousMatches - Set of netids the user has been matched with before
 * @param blockedUsers - Set of netids that user has blocked or been blocked by (bidirectional)
 * @returns Array of up to 3 matched netids
 */
export function findMatchesForUser(
  netid: string,
  userData: UserData,
  allUsersMap: Map<string, UserData>,
  previousMatches: Set<string>,
  blockedUsers: Set<string> = new Set()
): string[] {
  const { profile, preferences } = userData;

  // TypeScript type guard - this should never happen due to check in caller
  if (!profile || !preferences) {
    return [];
  }

  // Calculate compatibility scores for all potential matches
  const compatibilityScores: Array<{ netid: string; score: number }> = [];

  for (const [candidateNetid, candidateData] of allUsersMap.entries()) {
    // Skip self
    if (candidateNetid === netid) continue;

    // Skip blocked users (bidirectional blocking)
    if (blockedUsers.has(candidateNetid)) continue;

    // Skip if missing data
    if (!candidateData.profile || !candidateData.preferences) continue;

    // Check if mutually compatible
    const isCompatible = checkMutualCompatibility(
      profile,
      preferences,
      candidateData.profile,
      candidateData.preferences
    );

    if (!isCompatible) continue;

    // Check if already matched in previous weeks
    if (previousMatches.has(candidateNetid)) continue;

    // Calculate compatibility score
    const score = calculateCompatibilityScore(profile, candidateData.profile);

    compatibilityScores.push({ netid: candidateNetid, score });
  }

  // Sort by compatibility score (descending) and return top 3
  compatibilityScores.sort((a, b) => b.score - a.score);
  return compatibilityScores.slice(0, 3).map((match) => match.netid);
}

/**
 * Check if two users are mutually compatible based on preferences
 * @param profileA - First user's profile
 * @param preferencesA - First user's preferences
 * @param profileB - Second user's profile
 * @param preferencesB - Second user's preferences
 * @returns true if mutually compatible, false otherwise
 */
export function checkMutualCompatibility(
  profileA: ProfileDoc,
  preferencesA: PreferencesDoc,
  profileB: ProfileDoc,
  preferencesB: PreferencesDoc
): boolean {
  // Check A's preferences against B's profile
  const aLikesB = checkCompatibility(profileB, preferencesA);

  // Check B's preferences against A's profile
  const bLikesA = checkCompatibility(profileA, preferencesB);

  return aLikesB && bLikesA;
}

/**
 * Check if a profile matches user's preferences
 * @param profile - The profile to check
 * @param preferences - User's preferences
 * @returns true if compatible, false otherwise
 */
export function checkCompatibility(
  profile: ProfileDoc,
  preferences: PreferencesDoc
): boolean {
  // Check gender preference
  if (
    preferences.genders.length > 0 &&
    !preferences.genders.includes(profile.gender)
  ) {
    return false;
  }

  // Check age range
  const age = calculateAge(profile.birthdate);
  if (age < preferences.ageRange.min || age > preferences.ageRange.max) {
    return false;
  }

  // Check year preference
  if (
    preferences.years.length > 0 &&
    !preferences.years.includes(profile.year)
  ) {
    return false;
  }

  //TODO don't get rid of all schools, just add points
  // Check school preference (empty array means all schools accepted)
  if (
    preferences.schools.length > 0 &&
    !preferences.schools.includes(profile.school)
  ) {
    return false;
  }

  // Check major preference (empty array means all majors accepted)
  if (preferences.majors.length > 0) {
    const hasMatchingMajor = profile.major.some((userMajor: string) =>
      preferences.majors.includes(userMajor)
    );
    if (!hasMatchingMajor) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate compatibility score between two users (0-100)
 * Higher score means better match
 * @param profileA - First user's profile
 * @param profileB - Second user's profile
 * @returns Compatibility score (0-100)
 */
export function calculateCompatibilityScore(
  profileA: ProfileDoc,
  profileB: ProfileDoc
): number {
  let score = 0;

  // School match (20 points)
  if (profileA.school === profileB.school) {
    score += 20;
  }

  // Major overlap (15 points)
  const majorOverlap = profileA.major.filter((major: string) =>
    profileB.major.includes(major)
  ).length;
  if (majorOverlap > 0) {
    score += Math.min(15, majorOverlap * 5);
  }

  // Year proximity (15 points)
  const yearDiff = Math.abs(
    getYearNumericValue(profileA.year) - getYearNumericValue(profileB.year)
  );
  score += Math.max(0, 15 - yearDiff * 3);

  // Age proximity within preferences (15 points)
  const ageA = calculateAge(profileA.birthdate);
  const ageB = calculateAge(profileB.birthdate);
  const ageDiff = Math.abs(ageA - ageB);
  score += Math.max(0, 15 - ageDiff * 2);

  // Interest overlap (20 points)
  if (profileA.interests && profileB.interests) {
    const interestOverlap = profileA.interests.filter((interest: string) =>
      profileB.interests?.includes(interest)
    ).length;
    score += Math.min(20, interestOverlap * 4);
  }

  // Club overlap (15 points)
  if (profileA.clubs && profileB.clubs) {
    const clubOverlap = profileA.clubs.filter((club: string) =>
      profileB.clubs?.includes(club)
    ).length;
    score += Math.min(15, clubOverlap * 5);
  }

  return score;
}

/**
 * Calculate age from birthdate
 * @param birthdate - Firestore timestamp or Date
 * @returns Age in years
 */
export function calculateAge(birthdate: Date | any): number {
  const birth = birthdate instanceof Date ? birthdate : birthdate.toDate();
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Convert numeric year to Year string
 * @param year - Numeric year (e.g., 2025)
 * @returns Year string (e.g., "Senior")
 */
export function getYearString(year: number): Year {
  const currentYear = new Date().getFullYear();
  const yearsUntilGrad = year - currentYear;

  if (yearsUntilGrad >= 4) return 'Freshman';
  if (yearsUntilGrad === 3) return 'Sophomore';
  if (yearsUntilGrad === 2) return 'Junior';
  if (yearsUntilGrad === 1) return 'Senior';
  if (yearsUntilGrad === 0) return 'Senior';
  if (yearsUntilGrad < 0) return 'Graduate';

  return 'Graduate';
}

/**
 * Convert Year string to numeric value for comparison
 */
function getYearNumericValue(year: Year): number {
  const yearMap: Record<Year, number> = {
    Freshman: 1,
    Sophomore: 2,
    Junior: 3,
    Senior: 4,
    Graduate: 5,
    PhD: 6,
    'Post-Doc': 7,
  };
  return yearMap[year] || 0;
}
