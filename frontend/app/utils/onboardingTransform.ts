import { OnboardingData } from '../types/onboarding';

export interface CreateProfilePayload {
  firebaseUid: string;
  firstName: string;
  bio: string;
  gender: 'female' | 'male' | 'non-binary';
  birthdate: string; // ISO string
  year: number;
  school: string;
  major: string[];
  pictures: string[];
  hometown?: string;
  pronouns?: string[];
  sexualOrientation?: string[];
  interestedIn?: string[];
  showGenderOnProfile?: boolean;
  showPronounsOnProfile?: boolean;
  showHometownOnProfile?: boolean;
  showCollegeOnProfile?: boolean;
  showSexualOrientationOnProfile?: boolean;
  prompts?: { question: string; answer: string }[];
  instagram?: string;
  snapchat?: string;
  phoneNumber?: string;
}

/**
 * Converts MM/DD/YYYY format to ISO date string
 */
function convertBirthdateToISO(birthdate: string): string {
  const [month, day, year] = birthdate.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toISOString();
}

/**
 * Maps gender selection to backend enum
 * Takes the first selected gender since backend only supports single value
 */
function mapGenderToBackend(
  genders: string[]
): 'female' | 'male' | 'non-binary' {
  if (genders.length === 0) {
    throw new Error('At least one gender must be selected');
  }

  const firstGender = genders[0];
  switch (firstGender.toLowerCase()) {
    case 'woman':
      return 'female';
    case 'man':
      return 'male';
    case 'non-binary':
      return 'non-binary';
    default:
      return 'non-binary';
  }
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
): CreateProfilePayload {
  // Generate bio from prompts
  const bio = generateBioFromPrompts(onboardingData.prompts);

  // Convert birthdate to ISO string
  const birthdate = convertBirthdateToISO(onboardingData.birthdate);

  // Map gender to backend format
  const gender = mapGenderToBackend(onboardingData.genders);

  // Ensure year is set
  if (onboardingData.year === null) {
    throw new Error('Graduation year is required');
  }

  // Transform the onboarding data into exact format our backend API expects
  const payload: CreateProfilePayload = {
    firebaseUid,
    firstName: onboardingData.firstName,
    bio,
    gender,
    birthdate,
    year: onboardingData.year,
    school: onboardingData.school,
    major: onboardingData.major,
    pictures: onboardingData.pictures,
    hometown: onboardingData.hometown || undefined,
    pronouns:
      onboardingData.pronouns.length > 0 ? onboardingData.pronouns : undefined,
    sexualOrientation:
      onboardingData.sexualOrientation.length > 0
        ? onboardingData.sexualOrientation
        : undefined,
    interestedIn:
      onboardingData.interestedIn.length > 0
        ? onboardingData.interestedIn
        : undefined,
    showGenderOnProfile: onboardingData.showGenderOnProfile,
    showPronounsOnProfile: onboardingData.showPronounsOnProfile,
    showHometownOnProfile: onboardingData.showHometownOnProfile,
    showCollegeOnProfile: onboardingData.showCollegeOnProfile,
    showSexualOrientationOnProfile:
      onboardingData.showSexualOrientationOnProfile,
    prompts:
      onboardingData.prompts.length > 0
        ? onboardingData.prompts.map((p) => ({
            question: p.question,
            answer: p.answer,
          }))
        : undefined,
  };

  return payload;
}

/**
 * Validates that all required fields are present before submission
 */
export function validateProfilePayload(payload: CreateProfilePayload): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!payload.firstName) errors.push('First name is required');
  if (!payload.bio) errors.push('Bio is required');
  if (!payload.gender) errors.push('Gender is required');
  if (!payload.birthdate) errors.push('Birthdate is required');
  if (!payload.year) errors.push('Graduation year is required');
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
