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

/**
 * Input for updating a weekly prompt (admin only)
 * Corresponds to backend UpdateWeeklyPromptInput type
 */
export type UpdateWeeklyPromptInput = Partial<
  Omit<CreateWeeklyPromptInput, 'promptId'>
>;
