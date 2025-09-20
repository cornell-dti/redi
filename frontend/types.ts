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

export interface Profile {
  netid: string;
  bio: string;
  gender: Gender;
  birthdate: Date;
  instagram?: string;
  snapchat?: string;
  phoneNumber?: string;
  year: number;
  school: School;
  major: string[];
  pictures: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Helper types for creating profiles
export type CreateProfileInput = Omit<Profile, 'createdAt' | 'updatedAt'>;
export type UpdateProfileInput = Partial<Omit<Profile, 'netid' | 'createdAt' | 'updatedAt'>>;