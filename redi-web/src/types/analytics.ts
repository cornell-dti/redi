// Analytics types for frontend use
// Mirrors backend analytics types

export type DemographicCategory =
  | 'women_seeking_women'
  | 'women_seeking_men'
  | 'women_seeking_multiple'
  | 'men_seeking_women'
  | 'men_seeking_men'
  | 'men_seeking_multiple'
  | 'nonbinary_seeking_women'
  | 'nonbinary_seeking_men'
  | 'nonbinary_seeking_multiple'
  | 'other';

export interface DemographicBreakdownResponse {
  categories: Array<{
    label: string;
    categoryKey: DemographicCategory;
    count: number;
    percentage: number;
  }>;
  totalUsers: number;
  filteredByPrompt: boolean;
  promptId?: string;
}

export interface CompatibilityCell {
  userDemographic: DemographicCategory;
  targetDemographic: DemographicCategory;
  availableMatches: number;
}

export interface CompatibilityMatrixResponse {
  matrix: CompatibilityCell[];
  generatedAt: string;
}

export interface WeeklyEngagementStats {
  weekStart: string;
  weekEnd: string;
  promptId?: string;
  activeUsers: number;
  totalEligibleUsers: number;
  responseRate: number;
}

export interface EngagementMetricsResponse {
  currentWeek: WeeklyEngagementStats;
  historicalWeeks: WeeklyEngagementStats[];
}

export interface DemographicNudgeStats {
  demographic: DemographicCategory;
  demographicLabel: string;
  totalMatches: number;
  mutualNudges: number;
  mutualNudgeRate: number;
}

export interface MutualNudgeStatsResponse {
  weekStart: string;
  weekEnd: string;
  promptId?: string;
  demographics: DemographicNudgeStats[];
  overall: {
    totalMatches: number;
    mutualNudges: number;
    mutualNudgeRate: number;
  };
}
