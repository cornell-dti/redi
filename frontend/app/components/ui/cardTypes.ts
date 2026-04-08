/**
 * Daily card types in the "For You" feed:
 *
 * 1. profile_action  — Nudge the user to fill out a profile field (photo, hometown,
 *                      interests, etc.). Hides from the stack once `completed`.
 *
 * 2. preference      — Improve the match algorithm by answering a question.
 *                      Supports four reply formats: options (buttons), text (freeform),
 *                      ranking (drag-to-reorder), and scale (slider).
 *
 * 3. match           — A real weekly match showing another user's profile card.
 *
 * 4. weekly_prompt   — A limited-time prompt (e.g. "What are you proud of?").
 *                      The answer is added to your public profile once submitted.
 */

export type DailyCardType = DailyCard['type'];

// ─── 1. Profile Action ────────────────────────────────────────────────────────

export type ProfileActionIcon =
  | 'camera'    // profile photo
  | 'mapPin'    // campus location
  | 'home'      // hometown
  | 'message'   // profile prompt answer
  | 'link'      // social media
  | 'star'      // interests / hobbies
  | 'user'      // general info (age, name)
  | 'bookOpen'; // major / graduation year

export interface ProfileActionCard {
  id: string;
  type: 'profile_action';
  actionTitle: string;
  actionDescription: string;
  actionIconName: ProfileActionIcon;
  /** When true the card is filtered out of the stack */
  completed?: boolean;
}

// ─── 2. Preference ────────────────────────────────────────────────────────────

/** How the user answers a preference card */
export type PreferenceReplyType = 'options' | 'text' | 'ranking' | 'scale';

export interface PreferenceCard {
  id: string;
  type: 'preference';
  question: string;
  /** Optional decorative image shown on the card face */
  decorativeImage?: string;
  replyType: PreferenceReplyType;
  /** Used by 'options' (two-button choice) and 'ranking' (ordered list) */
  options?: string[];
  /** Used by 'scale' — label for the left end */
  scaleMin?: string;
  /** Used by 'scale' — label for the right end */
  scaleMax?: string;
}

// ─── 3. Match ─────────────────────────────────────────────────────────────────

import type { ProfileResponse } from '@/types';

export interface MatchCard {
  id: string;
  type: 'match';
  matchName: string;
  matchAge?: number;
  matchYear?: string;
  matchMajor?: string;
  matchImage?: string;
  /** Full profile — available for real API matches, undefined for mock cards */
  matchProfile?: ProfileResponse;
}

// ─── 4. Weekly Prompt ─────────────────────────────────────────────────────────

export interface WeeklyPromptCard {
  id: string;
  type: 'weekly_prompt';
  promptText: string;
  /** ISO 8601 — displayed as a countdown badge on the card */
  expiresAt?: string;
  /** Backend prompt ID used when submitting the answer */
  promptId?: string;
}

// ─── 5. Tutorial ─────────────────────────────────────────────────────────────

export type TutorialStep = 'skip' | 'act' | 'filter';

export interface TutorialCard {
  id: string;
  type: 'tutorial';
  step: TutorialStep;
  title: string;
  subtitle: string;
}

// ─── Union ────────────────────────────────────────────────────────────────────

export type DailyCard = ProfileActionCard | PreferenceCard | MatchCard | WeeklyPromptCard | TutorialCard;
