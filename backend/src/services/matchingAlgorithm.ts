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
import { ALL_MAJORS, CORNELL_SCHOOLS } from '../../constants/cornell';

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
 * @param relaxed - If true, use relaxed criteria (wider age range, ignore year/school/major)
 * @returns Array of up to 3 matched netids
 */
export function findMatchesForUser(
  netid: string,
  userData: UserData,
  allUsersMap: Map<string, UserData>,
  previousMatches: Set<string>,
  blockedUsers: Set<string> = new Set(),
  relaxed: boolean = false
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
      candidateData.preferences,
      relaxed
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
 * Calculate mutual compatibility score between two users (0-100)
 * Instead of requiring perfect mutual match, we use weighted scoring
 * @param profileA - First user's profile
 * @param preferencesA - First user's preferences
 * @param profileB - Second user's profile
 * @param preferencesB - Second user's preferences
 * @param relaxed - If true, use relaxed compatibility criteria
 * @returns Compatibility score (0-100), 0 means incompatible
 */
export function calculateMutualCompatibilityScore(
  profileA: ProfileDoc,
  preferencesA: PreferencesDoc,
  profileB: ProfileDoc,
  preferencesB: PreferencesDoc,
  relaxed: boolean = false
): number {
  // Calculate individual compatibility scores (0-100 each)
  const aLikesBScore = calculatePreferenceMatchScore(profileB, preferencesA, relaxed);
  const bLikesAScore = calculatePreferenceMatchScore(profileA, preferencesB, relaxed);

  // If either user has 0 score (fails hard requirements like gender), return 0
  if (aLikesBScore === 0 || bLikesAScore === 0) {
    return 0;
  }

  // Calculate weighted average
  // If both like each other equally (100, 100), score is 100
  // If one likes more than other (100, 50), score is 75
  // This encourages mutual interest but allows asymmetric matches
  const mutualScore = (aLikesBScore + bLikesAScore) / 2;

  // Apply bonus for strong mutual interest (both > 70)
  if (aLikesBScore > 70 && bLikesAScore > 70) {
    return Math.min(100, mutualScore * 1.1); // 10% bonus for mutual strong interest
  }

  return mutualScore;
}

/**
 * Check if two users are mutually compatible based on preferences
 * @param profileA - First user's profile
 * @param preferencesA - First user's preferences
 * @param profileB - Second user's profile
 * @param preferencesB - Second user's preferences
 * @param relaxed - If true, use relaxed compatibility criteria
 * @returns true if mutually compatible, false otherwise
 */
export function checkMutualCompatibility(
  profileA: ProfileDoc,
  preferencesA: PreferencesDoc,
  profileB: ProfileDoc,
  preferencesB: PreferencesDoc,
  relaxed: boolean = false
): boolean {
  // Use soft compatibility: allow match if score > 40 (at least moderate compatibility)
  const score = calculateMutualCompatibilityScore(
    profileA,
    preferencesA,
    profileB,
    preferencesB,
    relaxed
  );

  return score > 40; // Allow match if combined compatibility > 40%
}

/**
 * Calculate how well a profile matches user's preferences (0-100)
 * 0 means fails hard requirements, 100 means perfect match
 * @param profile - The profile to check
 * @param preferences - User's preferences
 * @param relaxed - If true, use relaxed criteria
 * @returns Score from 0-100
 */
export function calculatePreferenceMatchScore(
  profile: ProfileDoc,
  preferences: PreferencesDoc,
  relaxed: boolean = false
): number {
  let score = 100;

  // Gender preference (HARD REQUIREMENT - return 0 if fails)
  if (
    preferences.genders.length > 0 &&
    !preferences.genders.includes(profile.gender)
  ) {
    return 0; // Hard fail
  }

  // Age range
  const age = calculateAge(profile.birthdate);
  if (relaxed) {
    const relaxedMin = Math.max(18, preferences.ageRange.min - 2);
    const relaxedMax = Math.min(100, preferences.ageRange.max + 2);
    if (age < relaxedMin || age > relaxedMax) {
      return 0; // Hard fail even in relaxed mode
    }
    // Soft penalty for being outside original range but within relaxed range
    if (age < preferences.ageRange.min || age > preferences.ageRange.max) {
      score -= 15; // 15 point penalty for age mismatch
    }
  } else {
    if (age < preferences.ageRange.min || age > preferences.ageRange.max) {
      score -= 30; // 30 point penalty for age mismatch in strict mode
    }
  }

  // Year preference (soft in relaxed mode, moderate penalty in strict mode)
  if (!relaxed) {
    if (
      preferences.years.length > 0 &&
      !preferences.years.includes(profile.year)
    ) {
      score -= 20; // 20 point penalty for year mismatch
    }
  }
  // In relaxed mode, year is completely ignored (no penalty)

  // School exclusions (soft in relaxed mode, moderate penalty in strict mode)
  if (!relaxed) {
    if (
      preferences.schools.length > 0 &&
      preferences.schools.length < CORNELL_SCHOOLS.length
    ) {
      if (preferences.schools.includes(profile.school)) {
        score -= 25; // 25 point penalty for excluded school
      }
    }
  }
  // In relaxed mode, school exclusions are ignored

  // Major exclusions (soft in relaxed mode, moderate penalty in strict mode)
  if (!relaxed) {
    if (
      preferences.majors.length > 0 &&
      preferences.majors.length < ALL_MAJORS.length
    ) {
      const hasExcludedMajor = profile.major.some((userMajor: string) =>
        preferences.majors.includes(userMajor)
      );
      if (hasExcludedMajor) {
        score -= 25; // 25 point penalty for excluded major
      }
    }
  }
  // In relaxed mode, major exclusions are ignored

  return Math.max(0, score); // Ensure score doesn't go below 0
}

/**
 * Check if a profile matches user's preferences
 * @param profile - The profile to check
 * @param preferences - User's preferences
 * @param relaxed - If true, use relaxed criteria (±2 age, ignore year/school/major)
 * @returns true if compatible, false otherwise
 */
export function checkCompatibility(
  profile: ProfileDoc,
  preferences: PreferencesDoc,
  relaxed: boolean = false
): boolean {
  // Check gender preference (ALWAYS enforced, even in relaxed mode)
  if (
    preferences.genders.length > 0 &&
    !preferences.genders.includes(profile.gender)
  ) {
    return false;
  }

  // Check age range
  const age = calculateAge(profile.birthdate);
  if (relaxed) {
    // Relaxed mode: expand age range by ±2 years
    const relaxedMin = Math.max(18, preferences.ageRange.min - 2);
    const relaxedMax = Math.min(100, preferences.ageRange.max + 2);
    if (age < relaxedMin || age > relaxedMax) {
      return false;
    }
  } else {
    // Strict mode: use exact age range
    if (age < preferences.ageRange.min || age > preferences.ageRange.max) {
      return false;
    }
  }

  // Check year preference (IGNORED in relaxed mode)
  if (!relaxed) {
    if (
      preferences.years.length > 0 &&
      !preferences.years.includes(profile.year)
    ) {
      return false;
    }
  }

  // Check school preference as EXCLUSION filter (IGNORED in relaxed mode)
  if (!relaxed) {
    if (
      preferences.schools.length > 0 &&
      preferences.schools.length < CORNELL_SCHOOLS.length
    ) {
      if (preferences.schools.includes(profile.school)) {
        return false; // Reject if school is in exclusion list
      }
    }
  }

  // Check major preference as EXCLUSION filter (IGNORED in relaxed mode)
  if (!relaxed) {
    if (
      preferences.majors.length > 0 &&
      preferences.majors.length < ALL_MAJORS.length
    ) {
      const hasExcludedMajor = profile.major.some((userMajor: string) =>
        preferences.majors.includes(userMajor)
      );
      if (hasExcludedMajor) {
        return false; // Reject if user has an excluded major
      }
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
