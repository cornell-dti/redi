// =============================================================================
// ONBOARDING TYPES
// =============================================================================

import { School } from './profile';

export interface OnboardingData {
  // Step 2: Basic Info
  firstName: string;
  birthdate: string; // MM/DD/YYYY format

  // Step 3: Gender
  genders: string[];
  showGenderOnProfile: boolean;

  // Step 4: Pronouns
  pronouns: string[];
  showPronounsOnProfile: boolean;

  // Step 5: Hometown
  hometown: string;
  showHometownOnProfile: boolean;

  // Step 6: College Info
  school: School | '';
  major: string[];
  showCollegeOnProfile: boolean;

  // Step 7: Year
  year: string | null;

  // Step 8: Sexual Orientation
  sexualOrientation: string[];
  showSexualOrientationOnProfile: boolean;

  // Step 9: Ethnicity
  ethnicity?: string[];
  showEthnicityOnProfile?: boolean;

  // Step 10: Interested In
  interestedIn: string[];

  // Step 10: Photos
  pictures: string[];

  // Step 11: Prompts
  prompts: PromptData[];

  // Step 12: Clubs
  clubs: string[];

  // Step 13: Social Links
  linkedIn?: string;
  instagram?: string;
  snapchat?: string;
  github?: string;
  website?: string;

  // Step 14: Interests
  interests: string[];
}

export interface PromptData {
  id: string;
  question: string;
  answer: string;
}

export const INITIAL_ONBOARDING_DATA: OnboardingData = {
  firstName: '',
  birthdate: '',
  genders: [],
  showGenderOnProfile: true,
  pronouns: [],
  showPronounsOnProfile: true,
  hometown: '',
  showHometownOnProfile: true,
  school: '',
  major: [],
  showCollegeOnProfile: true,
  year: null,
  sexualOrientation: [],
  showSexualOrientationOnProfile: true,
  ethnicity: [],
  showEthnicityOnProfile: true,
  interestedIn: [],
  pictures: [],
  prompts: [],
  clubs: [],
  linkedIn: '',
  instagram: '',
  snapchat: '',
  github: '',
  website: '',
  interests: [],
};

// Available options for dropdowns and selections
// Gender options with display labels and values matching the Gender type
export const GENDER_OPTIONS = [
  { label: 'Man', value: 'male' },
  { label: 'Woman', value: 'female' },
  { label: 'Non-Binary', value: 'non-binary' },
] as const;
export const PRONOUN_OPTIONS = [
  'He',
  'Him',
  'His',
  'She',
  'Her',
  'Hers',
  'They',
  'Them',
];
export const SEXUAL_ORIENTATION_OPTIONS = [
  'Straight',
  'Gay',
  'Lesbian',
  'Bisexual',
  'Asexual',
  'Pansexual',
];
export const INTERESTED_IN_OPTIONS = ['Men', 'Women', 'Non-Binary'];
export const ETHNICITY_OPTIONS = [
  'East Asian (Chinese, Japanese, Korean, etc.)',
  'South Asian (Indian, Pakistani, Bangladeshi, etc.)',
  'Southeast Asian (Filipino, Vietnamese, Thai, etc.)',
  'Black or African American',
  'Hispanic or Latino',
  'Middle Eastern or North African',
  'Native American or Alaska Native',
  'Native Hawaiian or Pacific Islander',
  'White or Caucasian',
  'Mixed or Multiracial',
  'Other',
  'Prefer not to say',
] as const;
export const YEAR_OPTIONS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];

// Sample prompts for Step 11
export const AVAILABLE_PROMPTS = [
  'My ideal Sunday morning...',
  'The key to my heart is...',
  'I go crazy for...',
  'My most controversial opinion...',
  'Green flags I look for...',
  'Dating me is like...',
  "I'm looking for someone who...",
  'Together we could...',
  'A perfect date would be...',
  'I know the best spot in Ithaca for...',
];
