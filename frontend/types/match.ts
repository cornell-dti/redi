// =============================================================================
// MATCH & DISCOVERY TYPES
// =============================================================================

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

export interface SearchFilters {
  minAge?: number;
  maxAge?: number;
  schools?: string[];
  interests?: string[];
  distance?: number;
}
