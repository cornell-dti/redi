'use client';

import { useState, useEffect } from 'react';
import {
  fetchUsersWithProfiles,
  createManualMatch,
  fetchRecentMatches,
  UserWithProfile,
  ManualMatchResponse,
} from '@/api/admin';

export default function ManualMatchCreation() {
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recentMatches, setRecentMatches] = useState<ManualMatchResponse[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);

  // Form state
  const [user1NetId, setUser1NetId] = useState('');
  const [user2NetId, setUser2NetId] = useState('');
  const [promptId, setPromptId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [chatUnlocked, setChatUnlocked] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // Load users on mount
  useEffect(() => {
    loadUsers();
    loadRecentMatches();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const usersList = await fetchUsersWithProfiles();
      setUsers(usersList);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load users'
      );
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadRecentMatches = async () => {
    try {
      setIsLoadingMatches(true);
      const matches = await fetchRecentMatches();
      console.log('Loaded recent matches:', matches);
      console.log('Sample match structure:', matches[0]);
      setRecentMatches(matches);
    } catch (err) {
      console.error('Error loading recent matches:', err);
      // Don't show error to user for recent matches - just show empty list
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const validateForm = (): string | null => {
    // Check all fields are filled
    if (!user1NetId || !user2NetId || !promptId || !expiresAt) {
      return 'All required fields must be filled';
    }

    // Check users aren't the same
    if (user1NetId === user2NetId) {
      return 'Cannot match a user with themselves';
    }

    // Validate date
    const expiresAtDate = new Date(expiresAt);
    if (isNaN(expiresAtDate.getTime())) {
      return 'Invalid expiration date';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      // Validate form
      const validationError = validateForm();
      if (validationError) {
        setError(validationError);
        setIsSubmitting(false);
        return;
      }

      // Create manual match via API
      const result = await createManualMatch({
        user1NetId,
        user2NetId,
        promptId,
        expiresAt,
        chatUnlocked,
        revealed,
      });

      setSuccess(result.message);

      // Reset form
      setUser1NetId('');
      setUser2NetId('');
      setPromptId('');
      // Reset to default (1 week from now)
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
      setExpiresAt(oneWeekFromNow.toISOString().slice(0, 16));
      setChatUnlocked(false);
      setRevealed(false);

      // Reload recent matches
      loadRecentMatches();
    } catch (err) {
      console.error('Error creating matches:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to create matches'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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

  // Set default expiresAt to 1 week from now
  useEffect(() => {
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    const formatted = oneWeekFromNow.toISOString().slice(0, 16);
    setExpiresAt(formatted);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-purple-200">
      <div className="flex items-start gap-3 mb-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-purple-600 flex-shrink-0"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <div>
          <h2 className="text-2xl font-bold text-black">
            Manual Match Creation
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Create test matches between two users
          </p>
        </div>
      </div>

      {/* Warning banner */}
      <div className="bg-purple-50 border border-purple-300 rounded-lg p-4 mb-6 mt-4">
        <div className="flex items-start gap-2">
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
            className="text-purple-600 flex-shrink-0 mt-0.5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <p className="text-sm text-purple-800">
            This will create manual matches for testing purposes. Use with caution.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User 1 Selection */}
        <div>
          <label
            htmlFor="user1"
            className="block text-sm font-medium text-black mb-2"
          >
            User 1 NetId <span className="text-red-500">*</span>
          </label>
          {isLoadingUsers ? (
            <div className="text-sm text-gray-500">Loading users...</div>
          ) : (
            <select
              id="user1"
              value={user1NetId}
              onChange={(e) => setUser1NetId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
              required
            >
              <option value="">-- Select User 1 --</option>
              {users.map((user) => (
                <option key={user.netId} value={user.netId}>
                  {user.firstName} ({user.netId})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* User 2 Selection */}
        <div>
          <label
            htmlFor="user2"
            className="block text-sm font-medium text-black mb-2"
          >
            User 2 NetId <span className="text-red-500">*</span>
          </label>
          {isLoadingUsers ? (
            <div className="text-sm text-gray-500">Loading users...</div>
          ) : (
            <select
              id="user2"
              value={user2NetId}
              onChange={(e) => setUser2NetId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
              required
            >
              <option value="">-- Select User 2 --</option>
              {users.map((user) => (
                <option key={user.netId} value={user.netId}>
                  {user.firstName} ({user.netId})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Prompt ID */}
        <div>
          <label
            htmlFor="promptId"
            className="block text-sm font-medium text-black mb-2"
          >
            Prompt ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="promptId"
            value={promptId}
            onChange={(e) => setPromptId(e.target.value)}
            placeholder="e.g., 2025-W99"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Format: YYYY-Wxx (e.g., 2025-W99 for testing)
          </p>
        </div>

        {/* Expires At */}
        <div>
          <label
            htmlFor="expiresAt"
            className="block text-sm font-medium text-black mb-2"
          >
            Expires At <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            id="expiresAt"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Default: 1 week from now
          </p>
        </div>

        {/* Optional Checkboxes */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="chatUnlocked"
              checked={chatUnlocked}
              onChange={(e) => setChatUnlocked(e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="chatUnlocked" className="text-sm text-gray-700">
              Chat Unlocked (allow immediate messaging)
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="revealed"
              checked={revealed}
              onChange={(e) => setRevealed(e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="revealed" className="text-sm text-gray-700">
              Revealed (mark match as already viewed)
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || isLoadingUsers}
          className="w-full bg-purple-600 text-white rounded-full px-6 py-3 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          {isSubmitting ? 'Creating Matches...' : 'Create Matches'}
        </button>
      </form>

      {/* Status Messages */}
      {error && (
        <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
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
              className="text-red-600 flex-shrink-0 mt-0.5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m15 9-6 6" />
              <path d="m9 9 6 6" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
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
              className="text-green-600 flex-shrink-0 mt-0.5"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="m9 11 3 3L22 4" />
            </svg>
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Recent Matches */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-black mb-4">
          Recent Matches (Last 10)
        </h3>

        {isLoadingMatches ? (
          <div className="text-center py-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-purple-600" />
            <p className="text-sm text-gray-600 mt-2">Loading matches...</p>
          </div>
        ) : recentMatches.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No matches created yet
          </div>
        ) : (
          <div className="space-y-3">
            {recentMatches.map((match, index) => (
              <div
                key={`${match.netId}-${match.promptId}-${index}`}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-black">
                      <span className="text-purple-600">{match.netId}</span> →{' '}
                      <span className="text-purple-600">
                        {Array.isArray(match.matches)
                          ? match.matches.join(', ')
                          : match.matches || 'N/A'}
                      </span>
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Prompt: {match.promptId}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Created: {formatDate(match.createdAt)} | Expires:{' '}
                      {formatDate(match.expiresAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
