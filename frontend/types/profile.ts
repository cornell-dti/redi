// =============================================================================
// PROFILE TYPES
// =============================================================================

export type Gender = 'female' | 'male' | 'non-binary';

export type School =
  | 'College of Agriculture and Life Sciences'
  | 'College of Architecture, Art, and Planning'
  | 'College of Arts and Sciences'
  | 'Cornell SC Johnson College of Business'
  | 'College of Engineering'
  | 'College of Human Ecology'
  | 'School of Industrial and Labor Relations'
  | 'Graduate School'
  | 'Law School'
  | 'Brooks School of Public Policy'
  | 'Weill Cornell Medical'
  | 'College of Veterinary Medicine'
  | 'Nolan School of Hotel Administration';

// Profile response from API (matches backend ProfileResponse)
export interface ProfileResponse {
  netid: string;
  firstName: string;
  bio: string;
  gender: Gender;
  birthdate: string; // ISO string format
  hometown?: string;
  pronouns?: string[];
  ethnicity?: string[];
  sexualOrientation?: string[];
  showGenderOnProfile?: boolean;
  showPronounsOnProfile?: boolean;
  showHometownOnProfile?: boolean;
  showCollegeOnProfile?: boolean;
  showEthnicityOnProfile?: boolean;
  showSexualOrientationOnProfile?: boolean;
  prompts?: { question: string; answer: string }[];
  instagram?: string;
  snapchat?: string;
  phoneNumber?: string;
  linkedIn?: string;
  github?: string;
  website?: string;
  clubs?: string[];
  interests?: string[];
  year: number;
  school: School;
  major: string[];
  pictures: string[];
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
}

// Input for creating a new profile (matches backend CreateProfileInput)
export interface CreateProfileInput {
  netid: string;
  firstName: string;
  bio: string;
  gender: Gender;
  birthdate: string | Date; // ISO string or Date
  hometown?: string;
  pronouns?: string[];
  ethnicity?: string[];
  sexualOrientation?: string[];
  showGenderOnProfile?: boolean;
  showPronounsOnProfile?: boolean;
  showHometownOnProfile?: boolean;
  showCollegeOnProfile?: boolean;
  showEthnicityOnProfile?: boolean;
  showSexualOrientationOnProfile?: boolean;
  prompts?: { question: string; answer: string }[];
  instagram?: string;
  snapchat?: string;
  phoneNumber?: string;
  linkedIn?: string;
  github?: string;
  website?: string;
  clubs?: string[];
  interests?: string[];
  year: number;
  school: School;
  major: string[];
  pictures: string[];
}

// Input for updating a profile (all fields optional except those omitted)
export type UpdateProfileInput = Partial<Omit<CreateProfileInput, 'netid'>>;

// Response when creating a profile
export interface CreateProfileResponse {
  id: string;
  netid: string;
  message: string;
}
