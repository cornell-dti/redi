'use client';

import { createPrompt } from '@/api/admin';
import { PromptStatus, WeeklyPrompt } from '@/types/admin';
import { useState } from 'react';
import PromptAnswersViewer from './PromptAnswersViewer';

interface ProductionModeSectionProps {
  prompts: WeeklyPrompt[];
  onPromptCreated: () => void;
}

export default function ProductionModeSection({
  prompts,
  onPromptCreated,
}: ProductionModeSectionProps) {
  const [promptText, setPromptText] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [releaseDateWarning, setReleaseDateWarning] = useState<string | null>(null);
  const [matchDateWarning, setMatchDateWarning] = useState<string | null>(null);
  const [selectedPromptForAnswers, setSelectedPromptForAnswers] = useState<WeeklyPrompt | null>(null);

  // Get next Monday's date as default
  const getNextMonday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    return nextMonday.toISOString().split('T')[0];
  };

  // Get next Friday's date as default for match date
  const getNextFriday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilFriday = dayOfWeek === 0 ? 5 : (12 - dayOfWeek) % 7;
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + daysUntilFriday);
    return nextFriday.toISOString().split('T')[0];
  };

  // Generate promptId from release date (format: YYYY-WW)
  const generatePromptId = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    
    // Calculate ISO week number
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    
    return `${year}-${String(weekNumber).padStart(2, '0')}`;
  };

  // Initialize with next Monday and Friday
  useState(() => {
    setReleaseDate(getNextMonday());
    setMatchDate(getNextFriday());
  });

  // Check if a date is a Monday
  const isMonday = (dateString: string): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date.getDay() === 1;
  };

  // Check if a date is a Friday
  const isFriday = (dateString: string): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date.getDay() === 5;
  };

  // Get day name from date string
  const getDayName = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  // Handle release date change with validation
  const handleReleaseDateChange = (date: string) => {
    setReleaseDate(date);
    if (date && !isMonday(date)) {
      setReleaseDateWarning(`⚠️ Warning: ${getDayName(date)} is not a Monday. Auto-activation scheduled for Mondays.`);
    } else {
      setReleaseDateWarning(null);
    }
  };

  // Handle match date change with validation
  const handleMatchDateChange = (date: string) => {
    setMatchDate(date);
    if (date && !isFriday(date)) {
      setMatchDateWarning(`⚠️ Warning: ${getDayName(date)} is not a Friday. Auto-generation scheduled for Fridays.`);
    } else {
      setMatchDateWarning(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    console.log('📝 Form submitted');
    console.log('Prompt text:', promptText);
    console.log('Release date:', releaseDate);
    console.log('Match date:', matchDate);

    if (!promptText.trim()) {
      setError('Prompt text is required');
      return;
    }

    if (!releaseDate) {
      setError('Release date is required');
      return;
    }

    if (!matchDate) {
      setError('Match date is required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate promptId from release date
      const promptId = generatePromptId(releaseDate);
      console.log('🔑 Generated promptId:', promptId);

      // Create request with correct field names for backend
      const requestData = {
        promptId,
        question: promptText.trim(), // Backend expects 'question', not 'promptText'
        releaseDate: new Date(releaseDate).toISOString(),
        matchDate: new Date(matchDate).toISOString(),
      };

      console.log('📤 Sending request:', requestData);

      await createPrompt(requestData);

      console.log('✅ Prompt created successfully');
      setSuccess('Prompt created successfully!');
      setPromptText('');
      setReleaseDate(getNextMonday());
      setMatchDate(getNextFriday());
      onPromptCreated();
    } catch (err) {
      console.error('❌ Error creating prompt:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to create prompt'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter prompts by status
  const scheduledPrompts = prompts.filter(
    (p) => p.status === PromptStatus.SCHEDULED
  );
  const activePrompts = prompts.filter(
    (p) => p.status === PromptStatus.ACTIVE
  );
  const completedPrompts = prompts.filter(
    (p) => p.status === PromptStatus.COMPLETED
  );

  // Format date to ET timezone
  type FirestoreTimestamp = { toDate: () => Date } | { seconds: number };

  const formatDateET = (
    dateValue: string | Date | FirestoreTimestamp | null | undefined
  ) => {
    if (!dateValue) return 'N/A';

    let date: Date;

    // Handle Firestore Timestamp objects
    if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue) {
      date = dateValue.toDate();
    }
    // Handle Firestore Timestamp-like objects with seconds
    else if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
      date = new Date(dateValue.seconds * 1000);
    }
    // Handle string dates
    else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    }
    // Handle Date objects
    else if (dateValue instanceof Date) {
      date = dateValue;
    }
    else {
      return 'Invalid Date';
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    return date.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const PromptCard = ({ prompt }: { prompt: WeeklyPrompt }) => (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-black flex-1">{prompt.question}</h4>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            prompt.status === PromptStatus.SCHEDULED
              ? 'bg-blue-100 text-blue-700'
              : prompt.status === PromptStatus.ACTIVE
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
          }`}
        >
          {prompt.status}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-1">
        Release: {formatDateET(prompt.releaseDate)} ET
      </p>
      {prompt.matchDate && (
        <p className="text-sm text-gray-600 mb-1">
          Match: {formatDateET(prompt.matchDate)} ET
        </p>
      )}
      <div className="flex justify-end mt-2 mb-2">
        <button
          onClick={() => setSelectedPromptForAnswers(prompt)}
          className="px-3 py-1 text-xs rounded-full bg-gray-100 text-black hover:bg-gray-200 transition border border-gray-300"
        >
          View Answers {prompt.answerCount !== undefined && `(${prompt.answerCount})`}
        </button>
      </div>
      {prompt.activatedAt && (
        <p className="text-xs text-gray-500 mt-2">
          Activated: {formatDateET(prompt.activatedAt)} ET
        </p>
      )}
      {prompt.matchesGeneratedAt && (
        <p className="text-xs text-gray-500">
          Matches Generated: {formatDateET(prompt.matchesGeneratedAt)} ET
        </p>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-black mb-2">
        Production Mode
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Create prompts and view automated workflow
      </p>

      {/* Workflow indicator */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 text-sm text-blue-800">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="font-medium">
            Auto-activates Monday 12:01 AM ET → Auto-generates matches Friday 12:01 AM ET
          </span>
        </div>
      </div>

      {/* Create Prompt Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label
            htmlFor="promptText"
            className="block text-sm font-medium text-black mb-2"
          >
            Prompt Question *
          </label>
          <textarea
            id="promptText"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            required
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
            placeholder="Enter the weekly prompt question..."
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="releaseDate"
            className="block text-sm font-medium text-black mb-2"
          >
            Release Date (Monday) *
          </label>
          <input
            type="date"
            id="releaseDate"
            value={releaseDate}
            onChange={(e) => handleReleaseDateChange(e.target.value)}
            required
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 text-black ${
              releaseDateWarning
                ? 'border-yellow-400 focus:ring-yellow-500'
                : 'border-gray-300 focus:ring-black'
            }`}
          />
          {releaseDateWarning && (
            <p className="text-sm text-yellow-700 mt-1 flex items-start gap-1">
              <span className="flex-shrink-0 mt-0.5">⚠️</span>
              <span>{releaseDateWarning.replace('⚠️ ', '')}</span>
            </p>
          )}
        </div>

        <div className="mb-4">
          <label
            htmlFor="matchDate"
            className="block text-sm font-medium text-black mb-2"
          >
            Match Date (Friday) *
          </label>
          <input
            type="date"
            id="matchDate"
            value={matchDate}
            onChange={(e) => handleMatchDateChange(e.target.value)}
            required
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 text-black ${
              matchDateWarning
                ? 'border-yellow-400 focus:ring-yellow-500'
                : 'border-gray-300 focus:ring-black'
            }`}
          />
          {matchDateWarning && (
            <p className="text-sm text-yellow-700 mt-1 flex items-start gap-1">
              <span className="flex-shrink-0 mt-0.5">⚠️</span>
              <span>{matchDateWarning.replace('⚠️ ', '')}</span>
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[linear-gradient(135.7deg,_#000000_0%,_#333333_100.01%)] text-white rounded-full px-6 py-3 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
        >
          {isSubmitting && (
            <svg
              className="w-5 h-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          )}
          {isSubmitting ? 'Creating...' : 'Create Prompt'}
        </button>
      </form>

      {/* Prompt Lists */}
      <div className="space-y-6">
        {/* Scheduled Prompts */}
        <div>
          <h3 className="text-lg font-semibold text-black mb-3">
            Scheduled Prompts ({scheduledPrompts.length})
          </h3>
          {scheduledPrompts.length === 0 ? (
            <p className="text-gray-500 italic">No scheduled prompts</p>
          ) : (
            <div className="space-y-3">
              {scheduledPrompts.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>
          )}
        </div>

        {/* Active Prompts */}
        <div>
          <h3 className="text-lg font-semibold text-black mb-3">
            Active Prompts ({activePrompts.length})
          </h3>
          {activePrompts.length === 0 ? (
            <p className="text-gray-500 italic">No active prompts</p>
          ) : (
            <div className="space-y-3">
              {activePrompts.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>
          )}
        </div>

        {/* Completed Prompts */}
        <div>
          <h3 className="text-lg font-semibold text-black mb-3">
            Completed Prompts ({completedPrompts.length})
          </h3>
          {completedPrompts.length === 0 ? (
            <p className="text-gray-500 italic">No completed prompts</p>
          ) : (
            <div className="space-y-3">
              {completedPrompts.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Prompt Answers Viewer Modal */}
      {selectedPromptForAnswers && (
        <PromptAnswersViewer
          promptId={selectedPromptForAnswers.promptId}
          promptQuestion={selectedPromptForAnswers.question}
          onClose={() => setSelectedPromptForAnswers(null)}
        />
      )}
    </div>
  );
}