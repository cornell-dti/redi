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
