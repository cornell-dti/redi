// Navigation type definitions for Expo Router

export type RootStackParamList = {
  index: undefined;
  '(auth)': undefined;
};

export type AuthStackParamList = {
  '(tabs)': undefined;
  'create-profile': undefined;
  home: undefined;
};

export type TabsParamList = {
  index: undefined; // Matches screen
  chat: undefined;
  notifications: undefined;
  profile: undefined;
};

export type ScreensParamList = {
  'chat-detail': {
    userId: string;
    name: string;
  };
};

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
  | 'Nolan School of Hotel Administration'

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

// Chat and messaging types
export interface ChatMessage {
  id: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

export interface ChatConversation {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  image: string;
  online: boolean;
}

// Match and discovery types
export interface MatchProfile {
  id: string;
  name: string;
  age: number;
  school: string;
  image: string;
  bio: string;
  distance?: number;
  commonInterests?: string[];
}

// Notification types
export interface NotificationItem {
  id: string;
  type: 'match' | 'message' | 'like' | 'profile' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  image?: string;
  icon: string;
}

// Filter and preference types
export interface SearchFilters {
  minAge?: number;
  maxAge?: number;
  schools?: string[];
  interests?: string[];
  distance?: number;
}

export type GraduationYear = 2025 | 2026 | 2027 | 2028;

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}
