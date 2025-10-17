import { Year } from '@/constants/cornell';

/**
 * Calculate age from birthdate
 * @param birthdate - ISO string or Date object
 * @returns Age in years
 */
export function calculateAge(birthdate: string | Date): number {
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

/**
 * Format ethnicity for display in profile view
 * - Removes content in parentheses
 * - Removes text after "or"
 * - Filters out "Other" and "Prefer not to say"
 * @param ethnicities - Array of ethnicity strings
 * @returns Formatted ethnicity strings for display
 * @example
 * formatEthnicityForDisplay(['East Asian (Chinese, Japanese, Korean, etc.)'])
 * // Returns: ['East Asian']
 * formatEthnicityForDisplay(['Black or African American'])
 * // Returns: ['Black']
 */
export function formatEthnicityForDisplay(ethnicities: string[]): string[] {
  return ethnicities
    .filter((eth) => eth !== 'Other' && eth !== 'Prefer not to say')
    .map((eth) => {
      // Remove parentheses and their content
      let formatted = eth.replace(/\s*\([^)]*\)/g, '');

      // Remove text after "or" (including "or")
      formatted = formatted.split(' or ')[0];

      // Trim any extra whitespace
      return formatted.trim();
    })
    .filter((eth) => eth.length > 0); // Remove empty strings
}
