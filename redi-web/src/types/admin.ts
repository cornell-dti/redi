// TypeScript types for the admin dashboard

// ============================================================================= 
// WEEKLY PROMPTS TYPES 
// =============================================================================

/**
 * Weekly prompt response from API
 * Corresponds to backend WeeklyPromptResponse interface
 */
export interface WeeklyPromptResponse {
  promptId: string; // Year-week format (e.g., "2025-W42")
  question: string; // The prompt question text
  releaseDate: string; // Monday at 12:01 AM ET (ISO string format)
  matchDate: string; // Friday at 12:01 AM ET (ISO string format)
  active: boolean; // Only one prompt should be active at a time
  createdAt: string; // ISO string format
}

/**
 * Weekly prompt answer response from API
 * Corresponds to backend WeeklyPromptAnswerResponse interface
 */
export interface WeeklyPromptAnswerResponse {
  netid: string;
  promptId: string; // Reference to the prompt (e.g., "2025-W42")
  answer: string;
  createdAt: string; // ISO string format
}

/**
 * Input for creating a new prompt answer
 * Corresponds to backend CreateWeeklyPromptAnswerInput type
 */
export interface CreateWeeklyPromptAnswerInput {
  netid: string;
  promptId: string;
  answer: string;
}

/**
 * Weekly match response from API
 * Corresponds to backend WeeklyMatchResponse interface
 */
export interface WeeklyMatchResponse {
  netid: string; // User receiving the matches
  promptId: string; // Reference to the prompt used for matching
  matches: string[]; // Array of 3 matched user netids
  revealed: boolean[]; // Array of 3 booleans indicating if match was viewed
  createdAt: string; // When matches were generated (Friday) - ISO string format
}

/**
 * Input for updating match revealed status
 * Corresponds to backend UpdateWeeklyMatchRevealedInput interface
 */
export interface UpdateWeeklyMatchRevealedInput {
  matchIndex: number; // Index of the match to reveal (0-2)
}

/**
 * Input for creating a new weekly prompt (admin only)
 * Corresponds to backend CreateWeeklyPromptInput type
 */
export interface CreateWeeklyPromptInput {
  promptId: string; // Year-week format (e.g., "2025-W42")
  question: string;
  releaseDate: string | Date; // Monday at 12:01 AM ET
  matchDate: string | Date; // Friday at 12:01 AM ET
}

// =============================================================================
// ADMIN DASHBOARD TYPES (Extended from API types)
// =============================================================================

export enum PromptStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

/**
 * Extended Weekly Prompt type for admin dashboard
 * Includes UI-specific fields like status and answer count
 */
export interface WeeklyPrompt extends WeeklyPromptResponse {
  id: string; // Same as promptId, for backward compatibility
  status?: PromptStatus; // Computed status based on dates and active flag
  activatedAt?: string; // ISO date string
  matchesGeneratedAt?: string; // ISO date string
  answerCount?: number; // Count of answers received
  updatedAt?: string; // ISO date string
}

export interface WeeklyAnswer {
  id: string;
  promptId: string;
  userId: string;
  netid: string;
  answerText: string;
  answer: string; // Alias for answerText
  createdAt: string;
}

export interface WeeklyMatch {
  id: string;
  promptId: string;
  netid: string; // User receiving the matches
  user1Id?: string; // Deprecated, use netid
  user2Id?: string; // Deprecated, use matches array
  matches: string[]; // Array of matched netids
  revealed: boolean[]; // Array indicating which matches have been viewed
  matchScore?: number;
  createdAt: string;
  viewedByUser1?: boolean; // Deprecated
  viewedByUser2?: boolean; // Deprecated
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================
/**
 * Request type for creating a prompt (alias for CreateWeeklyPromptInput)
 */
export type CreatePromptRequest = CreateWeeklyPromptInput;

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = void> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Response when activating a prompt
 */
export interface ActivatePromptResponse {
  promptId: string;
  active: boolean;
  activatedAt: string;
}

/**
 * Response when generating matches
 */
export interface GenerateMatchesResponse {
  promptId: string;
  matchedCount: number;
  matchCount?: number; // Alias for matchedCount
  generatedAt?: string;
  message?: string;
}