import {
  OnboardingData,
  CreateProfileInput,
  Gender,
  UpdatePreferencesInput,
} from '@/types';

/**
 * Converts MM/DD/YYYY format to ISO date string
 */
function convertBirthdateToISO(birthdate: string): string {
  const [month, day, year] = birthdate.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toISOString();
}

/**
 * Normalizes gender values to lowercase format expected by backend
 * Handles both old capitalized values and new lowercase values
 */
function normalizeGenderValue(gender: string): string {
  const normalized = gender.toLowerCase().trim();

  // Map variations to standard values
  if (
    normalized === 'woman' ||
    normalized === 'women' ||
    normalized === 'female'
  ) {
    return 'female';
  }
  if (normalized === 'man' || normalized === 'men' || normalized === 'male') {
    return 'male';
  }
  if (normalized === 'non-binary' || normalized === 'nonbinary') {
    return 'non-binary';
  }

  // If already normalized, return as-is
  if (['female', 'male', 'non-binary'].includes(normalized)) {
    return normalized;
  }

  // Default fallback
  return 'non-binary';
}

/**
 * Normalizes an array of gender values
 */
function normalizeGenderArray(genders: string[]): string[] {
  return genders.map(normalizeGenderValue);
}

/**
 * Maps gender selection to backend enum
 * Takes the first selected gender since backend only supports single value
 * Now expects lowercase values ('male', 'female', 'non-binary') from GENDER_OPTIONS
 */
function mapGenderToBackend(
  genders: string[]
): 'female' | 'male' | 'non-binary' {
  if (genders.length === 0) {
    throw new Error('At least one gender must be selected');
  }

  // Normalize the gender value before returning
  const normalized = normalizeGenderValue(genders[0]);
  return normalized as 'female' | 'male' | 'non-binary';
}

/**
 * Generates a bio from prompts if bio is empty
 */
function generateBioFromPrompts(prompts: OnboardingData['prompts']): string {
  if (prompts.length === 0) {
    return 'New to Redi!';
  }

  return prompts
    .map((p) => `${p.question}\n${p.answer}`)
    .join('\n\n')
    .substring(0, 500); // Limit to 500 chars
}

/**
 * Transforms onboarding data to profile creation payload for backend API
 */
export function transformOnboardingToProfilePayload(
  onboardingData: OnboardingData,
  firebaseUid: string
): CreateProfileInput & { firebaseUid: string } {
  // Generate bio from prompts
  const bio = generateBioFromPrompts(onboardingData.prompts);

  // Convert birthdate to ISO string
  const birthdate = convertBirthdateToISO(onboardingData.birthdate);

  // Map gender to backend format
  const gender = mapGenderToBackend(onboardingData.genders);

  // Ensure year is set
  if (onboardingData.year === null) {
    throw new Error('Year is required');
  }

  // Get netid from user email (will be set by backend, but we need a placeholder)
  // The backend will derive the actual netid from firebaseUid
  const netid = ''; // Backend will override this

  // Transform the onboarding data into exact format our backend API expects
  const payload: CreateProfileInput & { firebaseUid: string } = {
    firebaseUid,
    netid, // Will be set by backend
    firstName: onboardingData.firstName,
    bio,
    gender,
    birthdate,
    year: onboardingData.year,
    school: onboardingData.school as any, // Type assertion for School
    major: onboardingData.major,
    pictures: onboardingData.pictures,
    hometown: onboardingData.hometown || undefined,
    pronouns:
      onboardingData.pronouns.length > 0 ? onboardingData.pronouns : undefined,
    ethnicity:
      onboardingData.ethnicity && onboardingData.ethnicity.length > 0
        ? onboardingData.ethnicity
        : undefined,
    sexualOrientation:
      onboardingData.sexualOrientation.length > 0
        ? onboardingData.sexualOrientation
        : undefined,
    showGenderOnProfile: onboardingData.showGenderOnProfile,
    showPronounsOnProfile: onboardingData.showPronounsOnProfile,
    showHometownOnProfile: onboardingData.showHometownOnProfile,
    showCollegeOnProfile: onboardingData.showCollegeOnProfile,
    showEthnicityOnProfile: onboardingData.showEthnicityOnProfile,
    showSexualOrientationOnProfile:
      onboardingData.showSexualOrientationOnProfile,
    prompts:
      onboardingData.prompts.length > 0
        ? onboardingData.prompts.map((p) => ({
            question: p.question,
            answer: p.answer,
          }))
        : undefined,
    clubs: onboardingData.clubs.length > 0 ? onboardingData.clubs : undefined,
    linkedIn: onboardingData.linkedIn || undefined,
    github: onboardingData.github || undefined,
    website: onboardingData.website || undefined,
    interests:
      onboardingData.interests.length > 0
        ? onboardingData.interests
        : undefined,
  };

  return payload;
}

/**
 * Extracts preferences data from onboarding data
 * This is used to initialize user preferences during onboarding
 */
export function extractPreferencesFromOnboarding(
  onboardingData: OnboardingData
): UpdatePreferencesInput {
  // Normalize interestedIn to Gender[] format
  const genders: Gender[] =
    onboardingData.interestedIn.length > 0
      ? (normalizeGenderArray(onboardingData.interestedIn) as Gender[])
      : [];

  return {
    genders,
    // Could add other default preferences here in the future
    // For now, we only set genders from the onboarding flow
  };
}

/**
 * Validates that all required fields are present before submission
 */
export function validateProfilePayload(
  payload: CreateProfileInput & { firebaseUid: string }
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!payload.firstName) errors.push('First name is required');
  if (!payload.bio) errors.push('Bio is required');
  if (!payload.gender) errors.push('Gender is required');
  if (!payload.birthdate) errors.push('Birthdate is required');
  if (!payload.year) errors.push('Year is required');
  if (!payload.school) errors.push('School is required');
  if (!payload.major || payload.major.length === 0)
    errors.push('At least one major is required');
  if (!payload.pictures || payload.pictures.length < 3) {
    errors.push('At least 3 photos are required');
  }
  if (payload.pictures && payload.pictures.length > 5) {
    errors.push('Maximum 5 photos allowed');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
