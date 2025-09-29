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

// User profile types
export interface UserProfile {
  id: string;
  netid: string;
  name: string;
  age: number;
  bio: string;
  school: string;
  major: string[];
  graduationYear: number;
  photos: string[];
  interests: string[];
  instagram?: string;
  snapchat?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProfileData {
  photos: string[];
  bio: string;
  school: string;
  graduationYear: number;
  major: string;
  interests: string[];
  instagram?: string;
  snapchat?: string;
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

// Cornell-specific types
export type CornellSchool =
  | 'College of Arts and Sciences'
  | 'College of Agriculture and Life Sciences'
  | 'College of Engineering'
  | 'School of Hotel Administration'
  | 'College of Human Ecology'
  | 'School of Industrial and Labor Relations'
  | 'College of Architecture, Art, and Planning'
  | 'Dyson School of Applied Economics'
  | 'Graduate School';

export type GraduationYear = 2025 | 2026 | 2027 | 2028;

export type Gender = 'male' | 'female' | 'non-binary' | 'other';

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