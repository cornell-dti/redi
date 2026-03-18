/**
 * Static mock card data for the "For You" daily feed.
 *
 * - Profile action and preference cards are defined here and interleaved with
 *   real API match cards in HomeScreen's buildDailyCards().
 * - MatchCard data always comes from the API (see index.tsx).
 * - WeeklyPromptCard data will eventually come from the API too; these are
 *   placeholders shown when no active prompt is available.
 */

import { MatchCard, PreferenceCard, ProfileActionCard, WeeklyPromptCard } from '@/app/components/ui/cardTypes';

// ─── Profile Action Cards ─────────────────────────────────────────────────────
// One card per fillable profile field. Set `completed: true` to hide from stack.

export const PROFILE_ACTION_CARDS: ProfileActionCard[] = [
  {
    id: 'profile-photo',
    type: 'profile_action',
    actionTitle: 'Add a profile photo',
    actionDescription: 'A photo helps matches recognize you and makes your profile stand out.',
    actionIconName: 'camera',
  },
  {
    id: 'profile-hometown',
    type: 'profile_action',
    actionTitle: 'Add your hometown',
    actionDescription: 'Let matches know where you grew up.',
    actionIconName: 'home',
  },
  {
    id: 'profile-location',
    type: 'profile_action',
    actionTitle: 'Add your campus location',
    actionDescription: 'Let matches know where you usually hang out on campus.',
    actionIconName: 'mapPin',
  },
  {
    id: 'profile-social',
    type: 'profile_action',
    actionTitle: 'Link your Instagram',
    actionDescription: 'Give matches a better sense of your vibe before you connect.',
    actionIconName: 'link',
  },
  {
    id: 'profile-interests',
    type: 'profile_action',
    actionTitle: 'Add your interests',
    actionDescription: "Shared interests are a great conversation starter — and they help us find people you'll click with.",
    actionIconName: 'star',
  },
  {
    id: 'profile-prompt',
    type: 'profile_action',
    actionTitle: 'Answer a profile prompt',
    actionDescription: 'Give matches an easy conversation starter by answering a fun question.',
    actionIconName: 'message',
  },
  {
    id: 'profile-major',
    type: 'profile_action',
    actionTitle: 'Add your major',
    actionDescription: 'Let matches know what you study at Cornell.',
    actionIconName: 'bookOpen',
  },
  {
    id: 'profile-year',
    type: 'profile_action',
    actionTitle: 'Add your graduation year',
    actionDescription: 'Helps matches know where you are in your Cornell journey.',
    actionIconName: 'user',
  },
];

// ─── Preference Cards ─────────────────────────────────────────────────────────
// Each card refines the match algorithm. Four reply formats:
//   options  — two tappable buttons
//   text     — freeform text input
//   ranking  — drag-to-reorder (or up/down) list
//   scale    — slider between two labeled extremes

export const PREFERENCE_CARDS: PreferenceCard[] = [
  // options
  {
    id: 'pref-dining',
    type: 'preference',
    question: 'Morrison Dining Hall or Appel Commons?',
    replyType: 'options',
    options: ['Morrison', 'Appel'],
  },
  {
    id: 'pref-morning',
    type: 'preference',
    question: 'Early bird or night owl?',
    replyType: 'options',
    options: ['Early bird 🌅', 'Night owl 🦉'],
  },
  {
    id: 'pref-pet',
    type: 'preference',
    question: 'Dog person or cat person?',
    replyType: 'options',
    options: ['Dog 🐶', 'Cat 🐱'],
  },
  {
    id: 'pref-coffee',
    type: 'preference',
    question: 'Coffee or tea?',
    replyType: 'options',
    options: ['Coffee ☕', 'Tea 🍵'],
  },

  // text
  {
    id: 'pref-ideal-date',
    type: 'preference',
    question: 'Describe your ideal first date in one sentence.',
    replyType: 'text',
  },
  {
    id: 'pref-dealbreaker',
    type: 'preference',
    question: "What's a dealbreaker for you?",
    replyType: 'text',
  },

  // ranking
  {
    id: 'pref-study',
    type: 'preference',
    question: 'Rank your ideal study spots.',
    replyType: 'ranking',
    options: ['Solo in my room', 'Library (silent)', 'Café', 'Study group'],
  },
  {
    id: 'pref-values',
    type: 'preference',
    question: 'Rank what matters most to you in a relationship.',
    replyType: 'ranking',
    options: ['Trust', 'Humor', 'Ambition', 'Kindness', 'Spontaneity'],
  },
  {
    id: 'pref-weekend',
    type: 'preference',
    question: 'Rank your ideal weekend activities.',
    replyType: 'ranking',
    options: ['Outdoors / hiking', 'House party', 'Low-key dinner', 'Exploring the city'],
  },

  // scale
  {
    id: 'pref-social',
    type: 'preference',
    question: 'How social are you on a typical weekend?',
    replyType: 'scale',
    scaleMin: 'Total homebody',
    scaleMax: 'Always out',
  },
  {
    id: 'pref-adventurous',
    type: 'preference',
    question: 'How adventurous are you with food?',
    replyType: 'scale',
    scaleMin: 'Stick to what I know',
    scaleMax: 'Try anything',
  },
  {
    id: 'pref-spontaneous',
    type: 'preference',
    question: 'How spontaneous are you?',
    replyType: 'scale',
    scaleMin: 'I need a plan',
    scaleMax: 'Last-minute everything',
  },
];

// ─── Mock Match Cards ─────────────────────────────────────────────────────────
// Used when no API match data is available (dev / offline mode).

export const MOCK_MATCH_CARDS: MatchCard[] = [
  {
    id: 'mock-match-1',
    type: 'match',
    matchName: 'Emma',
    matchAge: 21,
    matchYear: 'Junior',
    matchMajor: 'Computer Science',
  },
  {
    id: 'mock-match-2',
    type: 'match',
    matchName: 'Liam',
    matchAge: 22,
    matchYear: 'Senior',
    matchMajor: 'Economics',
  },
  {
    id: 'mock-match-3',
    type: 'match',
    matchName: 'Sofia',
    matchAge: 20,
    matchYear: 'Sophomore',
    matchMajor: 'Biological Sciences',
  },
];

// ─── Weekly Prompt Cards ──────────────────────────────────────────────────────
// Limited-time prompts — answers go on your public profile.
// In production these come from the API; these are fallback mocks.

export const WEEKLY_PROMPT_CARDS: WeeklyPromptCard[] = [
  {
    id: 'weekly-what-proud',
    type: 'weekly_prompt',
    promptText: "What's something you're proud of that doesn't show up on a résumé?",
    expiresAt: '2026-03-17T00:00:00Z',
  },
  {
    id: 'weekly-campus-spot',
    type: 'weekly_prompt',
    promptText: 'If you could live anywhere on campus for a semester, where and why?',
    expiresAt: '2026-03-17T00:00:00Z',
  },
  {
    id: 'weekly-change-mind',
    type: 'weekly_prompt',
    promptText: "What's something that recently changed your mind?",
    expiresAt: '2026-03-17T00:00:00Z',
  },
];
