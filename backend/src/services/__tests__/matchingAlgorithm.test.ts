/**
 * Unit tests for matching algorithm
 * Tests the core compatibility checking logic, especially majors and schools exclusion
 */

import {
  checkCompatibility,
  checkMutualCompatibility,
  calculateCompatibilityScore,
} from '../matchingAlgorithm';
import { PreferencesDoc, ProfileDoc } from '../../../types';
import { ALL_MAJORS, CORNELL_SCHOOLS } from '../../../constants/cornell';

// Helper function to create a basic profile for testing
function createTestProfile(overrides: Partial<ProfileDoc> = {}): ProfileDoc {
  return {
    netid: 'test123',
    firstName: 'Test',
    bio: 'Test bio',
    gender: 'female',
    birthdate: new Date('2000-01-01'),
    year: 'Junior',
    school: 'College of Engineering',
    major: ['Computer Science'],
    pictures: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Helper function to create basic preferences for testing
function createTestPreferences(
  overrides: Partial<PreferencesDoc> = {}
): PreferencesDoc {
  return {
    netid: 'test123',
    ageRange: { min: 18, max: 25 },
    years: ['Freshman', 'Sophomore', 'Junior', 'Senior'],
    schools: [],
    majors: [],
    genders: ['male', 'female'],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('Matching Algorithm - checkCompatibility', () => {
  describe('Majors Exclusion Logic', () => {
    test('Empty majors array should match all majors', () => {
      const profile = createTestProfile({ major: ['Computer Science'] });
      const preferences = createTestPreferences({ majors: [] });

      expect(checkCompatibility(profile, preferences)).toBe(true);
    });

    test('Should exclude profiles with excluded majors', () => {
      const profile = createTestProfile({ major: ['Computer Science'] });
      const preferences = createTestPreferences({
        majors: ['Computer Science'],
      });

      expect(checkCompatibility(profile, preferences)).toBe(false);
    });

    test('Should accept profiles without excluded majors', () => {
      const profile = createTestProfile({ major: ['Mathematics'] });
      const preferences = createTestPreferences({
        majors: ['Computer Science', 'Physics'],
      });

      expect(checkCompatibility(profile, preferences)).toBe(true);
    });

    test('Should exclude if ANY major is in exclusion list (profile with multiple majors)', () => {
      const profile = createTestProfile({
        major: ['Computer Science', 'Mathematics'],
      });
      const preferences = createTestPreferences({
        majors: ['Computer Science'], // Excluding CS
      });

      // Should be excluded because profile has CS (even though it also has Math)
      expect(checkCompatibility(profile, preferences)).toBe(false);
    });

    test('Should accept if NONE of the majors are in exclusion list (profile with multiple majors)', () => {
      const profile = createTestProfile({
        major: ['Mathematics', 'Physics'],
      });
      const preferences = createTestPreferences({
        majors: ['Computer Science', 'Biology'],
      });

      // Should be accepted because neither Math nor Physics are excluded
      expect(checkCompatibility(profile, preferences)).toBe(true);
    });

    test('Soft filter: excluding ALL majors should still allow matches', () => {
      const profile = createTestProfile({ major: ['Computer Science'] });
      const preferences = createTestPreferences({
        majors: [...ALL_MAJORS], // Excluding all majors
      });

      // Soft filter: should still match because all majors are excluded
      expect(checkCompatibility(profile, preferences)).toBe(true);
    });

    test('Should exclude multiple majors correctly', () => {
      const csProfile = createTestProfile({ major: ['Computer Science'] });
      const mathProfile = createTestProfile({ major: ['Mathematics'] });
      const physicsProfile = createTestProfile({ major: ['Physics'] });

      const preferences = createTestPreferences({
        majors: ['Computer Science', 'Mathematics'], // Exclude CS and Math
      });

      expect(checkCompatibility(csProfile, preferences)).toBe(false);
      expect(checkCompatibility(mathProfile, preferences)).toBe(false);
      expect(checkCompatibility(physicsProfile, preferences)).toBe(true);
    });
  });

  describe('Schools Exclusion Logic', () => {
    test('Empty schools array should match all schools', () => {
      const profile = createTestProfile({
        school: 'College of Engineering',
      });
      const preferences = createTestPreferences({ schools: [] });

      expect(checkCompatibility(profile, preferences)).toBe(true);
    });

    test('Should exclude profiles from excluded schools', () => {
      const profile = createTestProfile({
        school: 'College of Engineering',
      });
      const preferences = createTestPreferences({
        schools: ['College of Engineering'],
      });

      expect(checkCompatibility(profile, preferences)).toBe(false);
    });

    test('Should accept profiles from non-excluded schools', () => {
      const profile = createTestProfile({
        school: 'College of Arts and Sciences',
      });
      const preferences = createTestPreferences({
        schools: ['College of Engineering'],
      });

      expect(checkCompatibility(profile, preferences)).toBe(true);
    });

    test('Soft filter: excluding ALL schools should still allow matches', () => {
      const profile = createTestProfile({
        school: 'College of Engineering',
      });
      const preferences = createTestPreferences({
        schools: [...CORNELL_SCHOOLS], // Excluding all schools
      });

      // Soft filter: should still match because all schools are excluded
      expect(checkCompatibility(profile, preferences)).toBe(true);
    });

    test('Should exclude multiple schools correctly', () => {
      const engineeringProfile = createTestProfile({
        school: 'College of Engineering',
      });
      const artsProfile = createTestProfile({
        school: 'College of Arts and Sciences',
      });
      const businessProfile = createTestProfile({
        school: 'Cornell SC Johnson College of Business',
      });

      const preferences = createTestPreferences({
        schools: ['College of Engineering', 'College of Arts and Sciences'],
      });

      expect(checkCompatibility(engineeringProfile, preferences)).toBe(false);
      expect(checkCompatibility(artsProfile, preferences)).toBe(false);
      expect(checkCompatibility(businessProfile, preferences)).toBe(true);
    });
  });

  describe('Other Preference Filters (unchanged)', () => {
    test('Should filter by gender', () => {
      const femaleProfile = createTestProfile({ gender: 'female' });
      const maleProfile = createTestProfile({ gender: 'male' });

      const preferencesFemaleOnly = createTestPreferences({
        genders: ['female'],
      });

      expect(checkCompatibility(femaleProfile, preferencesFemaleOnly)).toBe(
        true
      );
      expect(checkCompatibility(maleProfile, preferencesFemaleOnly)).toBe(
        false
      );
    });

    test('Should filter by age range', () => {
      const youngProfile = createTestProfile({
        birthdate: new Date('2005-01-01'),
      }); // ~20 years old
      const oldProfile = createTestProfile({
        birthdate: new Date('1990-01-01'),
      }); // ~35 years old

      const preferences = createTestPreferences({
        ageRange: { min: 18, max: 25 },
      });

      expect(checkCompatibility(youngProfile, preferences)).toBe(true);
      expect(checkCompatibility(oldProfile, preferences)).toBe(false);
    });

    test('Should filter by year', () => {
      const juniorProfile = createTestProfile({ year: 'Junior' });
      const graduateProfile = createTestProfile({ year: 'Graduate' });

      const preferences = createTestPreferences({
        years: ['Freshman', 'Sophomore', 'Junior', 'Senior'],
      });

      expect(checkCompatibility(juniorProfile, preferences)).toBe(true);
      expect(checkCompatibility(graduateProfile, preferences)).toBe(false);
    });
  });

  describe('Combined Filters', () => {
    test('All filters must pass for compatibility', () => {
      const profile = createTestProfile({
        gender: 'female',
        birthdate: new Date('2002-01-01'), // ~23 years old
        year: 'Junior',
        school: 'College of Engineering',
        major: ['Computer Science'],
      });

      // Preferences that exclude this profile's school
      const preferencesExcludeSchool = createTestPreferences({
        genders: ['female'],
        ageRange: { min: 18, max: 25 },
        years: ['Junior'],
        schools: ['College of Engineering'], // Exclude Engineering
        majors: [],
      });

      expect(checkCompatibility(profile, preferencesExcludeSchool)).toBe(
        false
      );

      // Preferences that exclude this profile's major
      const preferencesExcludeMajor = createTestPreferences({
        genders: ['female'],
        ageRange: { min: 18, max: 25 },
        years: ['Junior'],
        schools: [],
        majors: ['Computer Science'], // Exclude CS
      });

      expect(checkCompatibility(profile, preferencesExcludeMajor)).toBe(false);

      // Preferences that accept this profile
      const preferencesAccept = createTestPreferences({
        genders: ['female'],
        ageRange: { min: 18, max: 25 },
        years: ['Junior'],
        schools: [], // No schools excluded
        majors: [], // No majors excluded
      });

      expect(checkCompatibility(profile, preferencesAccept)).toBe(true);
    });
  });
});

describe('Matching Algorithm - checkMutualCompatibility', () => {
  test('Both users must be compatible with each other', () => {
    const profileA = createTestProfile({
      netid: 'user1',
      gender: 'female',
      major: ['Computer Science'],
      school: 'College of Engineering',
    });

    const profileB = createTestProfile({
      netid: 'user2',
      gender: 'male',
      major: ['Mathematics'],
      school: 'College of Arts and Sciences',
    });

    const preferencesA = createTestPreferences({
      netid: 'user1',
      genders: ['male'],
      majors: [], // Not excluding any majors
      schools: [], // Not excluding any schools
    });

    const preferencesB = createTestPreferences({
      netid: 'user2',
      genders: ['female'],
      majors: [], // Not excluding any majors
      schools: [], // Not excluding any schools
    });

    expect(
      checkMutualCompatibility(profileA, preferencesA, profileB, preferencesB)
    ).toBe(true);
  });

  test('Should fail if user A excludes user B\'s major', () => {
    const profileA = createTestProfile({
      netid: 'user1',
      gender: 'female',
      major: ['Computer Science'],
    });

    const profileB = createTestProfile({
      netid: 'user2',
      gender: 'male',
      major: ['Mathematics'],
    });

    const preferencesA = createTestPreferences({
      netid: 'user1',
      genders: ['male'],
      majors: ['Mathematics'], // User A excludes Math majors
    });

    const preferencesB = createTestPreferences({
      netid: 'user2',
      genders: ['female'],
      majors: [], // User B doesn't exclude any majors
    });

    // Should fail because A excludes B's major
    expect(
      checkMutualCompatibility(profileA, preferencesA, profileB, preferencesB)
    ).toBe(false);
  });

  test('Should fail if user B excludes user A\'s school', () => {
    const profileA = createTestProfile({
      netid: 'user1',
      gender: 'female',
      school: 'College of Engineering',
    });

    const profileB = createTestProfile({
      netid: 'user2',
      gender: 'male',
      school: 'College of Arts and Sciences',
    });

    const preferencesA = createTestPreferences({
      netid: 'user1',
      genders: ['male'],
      schools: [], // Not excluding any schools
    });

    const preferencesB = createTestPreferences({
      netid: 'user2',
      genders: ['female'],
      schools: ['College of Engineering'], // User B excludes Engineering
    });

    // Should fail because B excludes A's school
    expect(
      checkMutualCompatibility(profileA, preferencesA, profileB, preferencesB)
    ).toBe(false);
  });
});

describe('Matching Algorithm - calculateCompatibilityScore', () => {
  test('Should give bonus points for same school', () => {
    const profileA = createTestProfile({
      school: 'College of Engineering',
    });
    const profileB = createTestProfile({
      school: 'College of Engineering',
    });
    const profileC = createTestProfile({
      school: 'College of Arts and Sciences',
    });

    const scoreAB = calculateCompatibilityScore(profileA, profileB);
    const scoreAC = calculateCompatibilityScore(profileA, profileC);

    // Same school should have higher score due to 20-point bonus
    expect(scoreAB).toBeGreaterThan(scoreAC);
  });

  test('Should give bonus points for major overlap', () => {
    const profileA = createTestProfile({
      major: ['Computer Science', 'Mathematics'],
    });
    const profileB = createTestProfile({
      major: ['Computer Science'],
    });
    const profileC = createTestProfile({
      major: ['Biology'],
    });

    const scoreAB = calculateCompatibilityScore(profileA, profileB);
    const scoreAC = calculateCompatibilityScore(profileA, profileC);

    // Shared major should have higher score
    expect(scoreAB).toBeGreaterThan(scoreAC);
  });
});
