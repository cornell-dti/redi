import { Year } from '@/constants/cornell';
import { getProfileAge, ProfileResponse } from '@/types';

/**
 * Calculate age from birthdate
 * @param birthdate - ISO string or Date object
 * @returns Age in years
 * @deprecated Use getProfileAge() from types/profile.ts for ProfileResponse objects
 */
export function calculateAge(birthdate: string | Date): number {
  if (!birthdate) return 0;
  const birth = typeof birthdate === 'string' ? new Date(birthdate) : birthdate;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Get age from a profile response, handling different privacy contexts
 * For public profiles, returns the age field directly
 * For own/matched profiles, calculates age from birthdate
 * @param profile - Profile response from API
 * @returns Age in years
 */
export function getAgeFromProfile(profile: ProfileResponse): number {
  return getProfileAge(profile);
}

/**
 * Convert graduation year to year string
 * @param year - Graduation year (e.g., 2026)
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

  return 'Freshman'; // Fallback for edge cases
}
