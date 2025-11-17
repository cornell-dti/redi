'use client';

import { useState, useEffect, useRef } from 'react';
import {
  fetchUsersWithProfiles,
  createManualMatch,
  fetchRecentMatches,
  fetchUserDetails as fetchUserDetailsAPI,
  UserWithProfile,
  ManualMatchResponse,
  UserDetailsResponse,
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

  // User details state
  const [user1Details, setUser1Details] = useState<UserDetailsResponse | null>(
    null
  );
  const [user2Details, setUser2Details] = useState<UserDetailsResponse | null>(
    null
  );
  const [isLoadingUser1, setIsLoadingUser1] = useState(false);
  const [isLoadingUser2, setIsLoadingUser2] = useState(false);
  const [user1Error, setUser1Error] = useState<string | null>(null);
  const [user2Error, setUser2Error] = useState<string | null>(null);

  // Searchable dropdown state
  const [user1SearchTerm, setUser1SearchTerm] = useState('');
  const [user2SearchTerm, setUser2SearchTerm] = useState('');
  const [showUser1Dropdown, setShowUser1Dropdown] = useState(false);
  const [showUser2Dropdown, setShowUser2Dropdown] = useState(false);
  const user1DropdownRef = useRef<HTMLDivElement>(null);
  const user2DropdownRef = useRef<HTMLDivElement>(null);

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
      setError(err instanceof Error ? err.message : 'Failed to load users');
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        user1DropdownRef.current &&
        !user1DropdownRef.current.contains(event.target as Node)
      ) {
        setShowUser1Dropdown(false);
      }
      if (
        user2DropdownRef.current &&
        !user2DropdownRef.current.contains(event.target as Node)
      ) {
        setShowUser2Dropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter users based on search term
  const filterUsers = (searchTerm: string): UserWithProfile[] => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (user) =>
        user.netId.toLowerCase().includes(term) ||
        user.firstName.toLowerCase().includes(term)
    );
  };

  // Handle User 1 search input change
  const handleUser1SearchChange = (value: string) => {
    setUser1SearchTerm(value);
    setShowUser1Dropdown(true);
    setUser1NetId('');
    setUser1Details(null);
    setUser1Error(null);
  };

  // Handle User 1 selection from dropdown
  const handleUser1Select = async (user: UserWithProfile) => {
    setUser1NetId(user.netId);
    setUser1SearchTerm(`${user.firstName} (${user.netId})`);
    setShowUser1Dropdown(false);
    setUser1Error(null);

    // Fetch user details
    setIsLoadingUser1(true);
    try {
      const details = await fetchUserDetailsAPI(user.netId, promptId);
      setUser1Details(details);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Error loading user details';
      setUser1Error(errorMsg);
    } finally {
      setIsLoadingUser1(false);
    }
  };

  // Handle User 2 search input change
  const handleUser2SearchChange = (value: string) => {
    setUser2SearchTerm(value);
    setShowUser2Dropdown(true);
    setUser2NetId('');
    setUser2Details(null);
    setUser2Error(null);
  };

  // Handle User 2 selection from dropdown
  const handleUser2Select = async (user: UserWithProfile) => {
    setUser2NetId(user.netId);
    setUser2SearchTerm(`${user.firstName} (${user.netId})`);
    setShowUser2Dropdown(false);
    setUser2Error(null);

    // Fetch user details
    setIsLoadingUser2(true);
    try {
      const details = await fetchUserDetailsAPI(user.netId, promptId);
      setUser2Details(details);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Error loading user details';
      setUser2Error(errorMsg);
    } finally {
      setIsLoadingUser2(false);
    }
  };

  // Re-fetch user details when promptId changes
  useEffect(() => {
    if (user1NetId) {
      const refetchUser1 = async () => {
        setIsLoadingUser1(true);
        try {
          const details = await fetchUserDetailsAPI(user1NetId, promptId);
          setUser1Details(details);
        } catch (err) {
          const errorMsg =
            err instanceof Error ? err.message : 'Error loading user details';
          setUser1Error(errorMsg);
        } finally {
          setIsLoadingUser1(false);
        }
      };
      refetchUser1();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptId]);

  useEffect(() => {
    if (user2NetId) {
      const refetchUser2 = async () => {
        setIsLoadingUser2(true);
        try {
          const details = await fetchUserDetailsAPI(user2NetId, promptId);
          setUser2Details(details);
        } catch (err) {
          const errorMsg =
            err instanceof Error ? err.message : 'Error loading user details';
          setUser2Error(errorMsg);
        } finally {
          setIsLoadingUser2(false);
        }
      };
      refetchUser2();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptId]);

  const validateForm = (): string | null => {
    // Check all fields are filled
    if (!user1NetId || !user2NetId || !promptId || !expiresAt) {
      return 'All required fields must be filled';
    }

    // Check users exist
    if (user1Error || !user1Details) {
      return 'User 1 not found or invalid';
    }

    if (user2Error || !user2Details) {
      return 'User 2 not found or invalid';
    }

    // Check users aren't the same
    if (user1NetId.toLowerCase() === user2NetId.toLowerCase()) {
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

      // Create manual match via API with append support
      const result = await createManualMatch({
        user1NetId,
        user2NetId,
        promptId,
        expiresAt,
        chatUnlocked,
        revealed,
        appendToExisting: true, // Allow appending to existing matches
      });

      setSuccess(result.message);

      // Reset form
      setUser1NetId('');
      setUser2NetId('');
      setUser1SearchTerm('');
      setUser2SearchTerm('');
      setPromptId('');
      // Reset to default (1 week from now)
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
      setExpiresAt(oneWeekFromNow.toISOString().slice(0, 16));
      setChatUnlocked(false);
      setRevealed(false);

      // Reset user details
      setUser1Details(null);
      setUser2Details(null);
      setUser1Error(null);
      setUser2Error(null);

      // Reload recent matches
      loadRecentMatches();
    } catch (err) {
      console.error('Error creating matches:', err);
      setError(err instanceof Error ? err.message : 'Failed to create matches');
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
          <div className="text-sm text-purple-800">
            <p className="font-semibold mb-1">Manual Match Creation</p>
            <p>
              This will create matches for testing. If users already have
              matches for the same prompt, new matches will be appended (max 3
              per user).
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User 1 NetID Searchable Dropdown */}
        <div ref={user1DropdownRef}>
          <label
            htmlFor="user1"
            className="block text-sm font-medium text-black mb-2"
          >
            User 1 NetID <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              id="user1"
              value={user1SearchTerm}
              onChange={(e) => handleUser1SearchChange(e.target.value)}
              onFocus={() => setShowUser1Dropdown(true)}
              placeholder="Search by name or NetID..."
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 text-black ${
                user1Error
                  ? 'border-red-300 focus:ring-red-500'
                  : user1Details
                    ? 'border-green-300 focus:ring-green-500'
                    : 'border-gray-300 focus:ring-purple-500'
              }`}
              required={!user1NetId}
              disabled={isLoadingUsers}
              autoComplete="off"
            />
            {isLoadingUser1 && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-purple-600" />
              </div>
            )}
            {!isLoadingUser1 && user1Details && (
              <div className="absolute right-3 top-3 text-green-600">✓</div>
            )}
            {!isLoadingUser1 && user1Error && (
              <div className="absolute right-3 top-3 text-red-600">✗</div>
            )}

            {/* Dropdown List */}
            {showUser1Dropdown && !isLoadingUsers && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filterUsers(user1SearchTerm).length > 0 ? (
                  filterUsers(user1SearchTerm).map((user) => (
                    <button
                      key={user.netId}
                      type="button"
                      onClick={() => handleUser1Select(user)}
                      className="w-full px-4 py-2 text-left hover:bg-purple-50 focus:bg-purple-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                    >
                      <div className="text-sm font-medium text-black">
                        {user.firstName}
                      </div>
                      <div className="text-xs text-gray-600">{user.netId}</div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    No users found
                  </div>
                )}
              </div>
            )}
          </div>
          {user1Error && (
            <p className="text-sm text-red-600 mt-1">{user1Error}</p>
          )}
          {isLoadingUsers && (
            <p className="text-sm text-gray-500 mt-1">Loading users...</p>
          )}
        </div>

        {/* User 1 Details Card */}
        {user1Details && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-purple-900 mb-3">
              {user1Details.firstName} ({user1Details.netId})
            </h4>

            {/* Profile Pictures */}
            {user1Details.pictures.length > 0 ? (
              <div className="mb-3">
                <p className="text-xs text-purple-700 mb-2">
                  Profile Pictures:
                </p>
                <div className="flex gap-2 flex-wrap">
                  {user1Details.pictures.map((pic, idx) => (
                    <img
                      key={idx}
                      src={pic}
                      alt={`${user1Details.firstName} photo ${idx + 1}`}
                      className="w-16 h-16 rounded-lg object-cover border border-purple-300"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-purple-600 mb-3">
                No profile pictures
              </p>
            )}

            {/* Prompt Answer */}
            <div>
              <p className="text-xs text-purple-700 mb-1">Prompt Response:</p>
              {!promptId ? (
                <p className="text-xs text-purple-600 italic">
                  Enter a Prompt ID to see user response
                </p>
              ) : user1Details.promptAnswer ? (
                <p className="text-sm text-purple-900 bg-white p-2 rounded border border-purple-200">
                  {user1Details.promptAnswer}
                </p>
              ) : (
                <p className="text-xs text-purple-600 italic">
                  N/A - User did not respond to this prompt
                </p>
              )}
            </div>
          </div>
        )}

        {/* User 2 NetID Searchable Dropdown */}
        <div ref={user2DropdownRef}>
          <label
            htmlFor="user2"
            className="block text-sm font-medium text-black mb-2"
          >
            User 2 NetID <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              id="user2"
              value={user2SearchTerm}
              onChange={(e) => handleUser2SearchChange(e.target.value)}
              onFocus={() => setShowUser2Dropdown(true)}
              placeholder="Search by name or NetID..."
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 text-black ${
                user2Error
                  ? 'border-red-300 focus:ring-red-500'
                  : user2Details
                    ? 'border-green-300 focus:ring-green-500'
                    : 'border-gray-300 focus:ring-purple-500'
              }`}
              required={!user2NetId}
              disabled={isLoadingUsers}
              autoComplete="off"
            />
            {isLoadingUser2 && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-purple-600" />
              </div>
            )}
            {!isLoadingUser2 && user2Details && (
              <div className="absolute right-3 top-3 text-green-600">✓</div>
            )}
            {!isLoadingUser2 && user2Error && (
              <div className="absolute right-3 top-3 text-red-600">✗</div>
            )}

            {/* Dropdown List */}
            {showUser2Dropdown && !isLoadingUsers && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filterUsers(user2SearchTerm).length > 0 ? (
                  filterUsers(user2SearchTerm).map((user) => (
                    <button
                      key={user.netId}
                      type="button"
                      onClick={() => handleUser2Select(user)}
                      className="w-full px-4 py-2 text-left hover:bg-purple-50 focus:bg-purple-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                    >
                      <div className="text-sm font-medium text-black">
                        {user.firstName}
                      </div>
                      <div className="text-xs text-gray-600">{user.netId}</div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    No users found
                  </div>
                )}
              </div>
            )}
          </div>
          {user2Error && (
            <p className="text-sm text-red-600 mt-1">{user2Error}</p>
          )}
          {isLoadingUsers && (
            <p className="text-sm text-gray-500 mt-1">Loading users...</p>
          )}
        </div>

        {/* User 2 Details Card */}
        {user2Details && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-purple-900 mb-3">
              {user2Details.firstName} ({user2Details.netId})
            </h4>

            {/* Profile Pictures */}
            {user2Details.pictures.length > 0 ? (
              <div className="mb-3">
                <p className="text-xs text-purple-700 mb-2">
                  Profile Pictures:
                </p>
                <div className="flex gap-2 flex-wrap">
                  {user2Details.pictures.map((pic, idx) => (
                    <img
                      key={idx}
                      src={pic}
                      alt={`${user2Details.firstName} photo ${idx + 1}`}
                      className="w-16 h-16 rounded-lg object-cover border border-purple-300"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-purple-600 mb-3">
                No profile pictures
              </p>
            )}

            {/* Prompt Answer */}
            <div>
              <p className="text-xs text-purple-700 mb-1">Prompt Response:</p>
              {!promptId ? (
                <p className="text-xs text-purple-600 italic">
                  Enter a Prompt ID to see user response
                </p>
              ) : user2Details.promptAnswer ? (
                <p className="text-sm text-purple-900 bg-white p-2 rounded border border-purple-200">
                  {user2Details.promptAnswer}
                </p>
              ) : (
                <p className="text-xs text-purple-600 italic">
                  N/A - User did not respond to this prompt
                </p>
              )}
            </div>
          </div>
        )}

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
          <p className="text-xs text-gray-500 mt-1">Default: 1 week from now</p>
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
