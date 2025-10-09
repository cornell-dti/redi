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
  school: string;
  major: string[];
  showCollegeOnProfile: boolean;

  // Step 7: Graduation Year
  year: number | null;

  // Step 8: Sexual Orientation
  sexualOrientation: string[];
  showSexualOrientationOnProfile: boolean;

  // Step 9: Interested In
  interestedIn: string[];

  // Step 10: Photos
  pictures: string[];

  // Step 11: Prompts
  prompts: PromptData[];
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
  interestedIn: [],
  pictures: [],
  prompts: [],
};

// Available options for dropdowns and selections
export const GENDER_OPTIONS = ['Man', 'Woman', 'Non-Binary'];
export const PRONOUN_OPTIONS = ['He', 'Him', 'His', 'She', 'Her', 'Hers', 'They', 'Them'];
export const SEXUAL_ORIENTATION_OPTIONS = [
  'Straight',
  'Gay',
  'Lesbian',
  'Bisexual',
  'Asexual',
  'Pansexual',
];
export const INTERESTED_IN_OPTIONS = ['Men', 'Women', 'Non-Binary'];
export const GRADUATION_YEARS = [2026, 2027, 2028, 2029, 2030];
export const CORNELL_SCHOOLS = [
  'College of Agriculture and Life Sciences',
  'College of Architecture, Art, and Planning',
  'College of Arts and Sciences',
  'Cornell SC Johnson College of Business',
  'College of Engineering',
  'College of Human Ecology',
  'School of Industrial and Labor Relations',
  'Graduate School',
  'Law School',
  'Business School',
  'Medical College',
  'Veterinary Medicine',
];

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
