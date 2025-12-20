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
  pronouns: string;
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
  pronouns: '',
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
  'He/Him/His',
  'She/Her/Hers',
  'They/Them/Theirs',
  'Other',
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
export const YEAR_OPTIONS = [
  'Freshman',
  'Sophomore',
  'Junior',
  'Senior',
  'Graduate',
];

export const AVAILABLE_PROMPTS = [
  'What kind of job are you looking for?',
  'Where have you interned?',
  "What's your dream job?",
  'What skills are you currently developing?',
  'What industry are you most interested in?',
  "What's a project you're proud of?",
  "What's your ideal company culture?",
  'What professional goal are you working toward?',
  "What's your biggest career accomplishment?",
  'What type of mentorship are you seeking?',
  "What's your approach to networking?",
  "What's a cause or initiative you care about?",
  "What's your leadership style?",
  "What's a skill you want to learn this year?",
  "What's your ideal work environment?",
];
