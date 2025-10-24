// =============================================================================
// NUDGE TYPES
// =============================================================================

export interface NudgeResponse {
  fromNetid: string;
  toNetid: string;
  promptId: string;
  mutual: boolean;
  createdAt: string; // ISO string format
}

export interface CreateNudgeInput {
  fromNetid: string;
  toNetid: string;
  promptId: string;
}

export interface NudgeStatusResponse {
  sent: boolean; // User has nudged this match
  received: boolean; // Match has nudged the user
  mutual: boolean; // Both have nudged each other
}
