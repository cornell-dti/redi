// Database timestamp type 
type Timestamp = Date | string | number;

export interface User {
  netid: string;
  password: string;
  createdAt: Timestamp;
}

export type Gender = 'female' | 'male' | 'non-binary';

export type School = 
  | 'College of Arts and Science'
  | 'Cals'
  | 'Hotel and Administration' 
  | 'AAP'
  | 'Dyson'
  | 'Engineering'
  | 'ILR'
  | 'Human Ecology'
  | 'Veterinary Medicine'
  | 'Graduate School'
  | 'Law School'
  | 'Business School'
  | 'Medical College';

export interface ProfileResponse {
  netid: string;
  bio: string;
  gender: 'female' | 'male' | 'non-binary';
  birthdate: string; // ISO string
  instagram?: string;
  snapchat?: string;
  phoneNumber?: string;
  year: number;
  school: string;
  major: string[];
  pictures: string[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface CreateProfileInput {
  bio: string;
  gender: 'female' | 'male' | 'non-binary';
  birthdate: string | Date;
  instagram?: string;
  snapchat?: string;
  phoneNumber?: string;
  year: number;
  school: string;
  major?: string[];
  pictures?: string[];
}

export interface UpdateProfileInput {
  bio?: string;
  gender?: 'female' | 'male' | 'non-binary';
  birthdate?: string | Date;
  instagram?: string;
  snapchat?: string;
  phoneNumber?: string;
  year?: number;
  school?: string;
  major?: string[];
  pictures?: string[];
}

export interface CreateProfileResponse {
  id: string;
  netid: string;
  message: string;
}

export interface ApiError {
  error: string;
}

// Helper types for creating profiles