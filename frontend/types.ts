// Database timestamp type
type Timestamp = Date | string | number;

export interface User {
  netid: string;
  password: string;
  createdAt: Timestamp;
}

// User API response type (what the backend returns)
export interface UserResponse {
  netid: string;
  email: string;
  createdAt: string; // ISO string
}

// User creation response type
export interface CreateUserResponse {
  id: string;
  netid: string;
  email: string;
  message: string;
}

// Login response type
export interface LoginResponse {
  message: string;
  user: UserResponse;
}

// =============================================================================
// PROFILE TYPES (aligned with backend)
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

export interface ApiError {
  error: string;
}
