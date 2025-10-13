// =============================================================================
// PREFERENCES TYPES
// =============================================================================

import { Gender, School } from './profile';

// Academic year classifications
export type Year =
  | 'Freshman'
  | 'Sophomore'
  | 'Junior'
  | 'Senior'
  | 'Graduate'
  | 'PhD'
  | 'Post-Doc';

// Preferences response from API (matches backend PreferencesResponse)
export interface PreferencesResponse {
  netid: string;
  ageRange: {
    min: number;
    max: number;
  };
  years: Year[];
  schools: School[];
  majors: string[];
  genders: Gender[];
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
}

// Input for creating new preferences (matches backend CreatePreferencesInput)
export interface CreatePreferencesInput {
  netid: string;
  ageRange: {
    min: number;
    max: number;
  };
  years: Year[];
  schools: School[];
  majors: string[];
  genders: Gender[];
}

// Input for updating preferences (matches backend UpdatePreferencesInput)
export type UpdatePreferencesInput = Partial<
  Omit<CreatePreferencesInput, 'netid'>
>;

// Response when creating preferences
export interface CreatePreferencesResponse {
  netid: string;
  message: string;
}
