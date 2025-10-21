'use client';

import { fetchPromptMatches } from '@/api/admin';
import { MatchWithProfile, PromptMatchDetailResponse } from '@/types/admin';
import { useEffect, useState } from 'react';

interface PromptMatchDetailsViewerProps {
  promptId: string;
  promptQuestion: string;
  onClose: () => void;
}

type FilterType = 'all' | 'revealed' | 'unrevealed';

export default function PromptMatchDetailsViewer({
  promptId,
  promptQuestion,
  onClose,
}: PromptMatchDetailsViewerProps) {
  const [data, setData] = useState<PromptMatchDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadMatches = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetchPromptMatches(promptId);
        setData(result);
      } catch (err) {
        console.error('Error loading matches:', err);
        setError(err instanceof Error ? err.message : 'Failed to load matches');
      } finally {
        setIsLoading(false);
      }
    };

    loadMatches();
  }, [promptId]);

  const formatTimestamp = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getFilteredMatches = (): MatchWithProfile[] => {
    if (!data) return [];

    let filtered = data.matches;

    // Apply reveal filter
    if (filter === 'revealed') {
      filtered = filtered.filter((match) =>
        match.matches.some((m) => m.revealed)
      );
    } else if (filter === 'unrevealed') {
      filtered = filtered.filter((match) =>
        match.matches.every((m) => !m.revealed)
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (match) =>
          match.firstName.toLowerCase().includes(query) ||
          match.netid.toLowerCase().includes(query) ||
          match.matches.some(
            (m) =>
              m.firstName.toLowerCase().includes(query) ||
              m.netid.toLowerCase().includes(query)
          )
      );
    }

    return filtered;
  };

  const filteredMatches = getFilteredMatches();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 pr-4">
              <h2 className="text-2xl font-bold text-black mb-2">
                Match Details
              </h2>
              <p className="text-gray-600 mb-1">{promptQuestion}</p>
              <p className="text-sm text-gray-500">{promptId}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition flex-shrink-0"
              aria-label="Close"
            >
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
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          {/* Stats Summary */}
          {data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-600">Total Matches</div>
                <div className="text-xl font-bold text-black">
                  {data.totalMatchDocuments}
                </div>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-600">Total Reveals</div>
                <div className="text-xl font-bold text-black">
                  {data.totalReveals} / {data.totalPossibleReveals}
                </div>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-600">Reveal Rate</div>
                <div className="text-xl font-bold text-black">
                  {data.revealRate.toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-600">Users Matched</div>
                <div className="text-xl font-bold text-black">
                  {data.totalUsersMatched}
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-full text-sm transition ${
                  filter === 'all'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('revealed')}
                className={`px-4 py-2 rounded-full text-sm transition ${
                  filter === 'revealed'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                With Reveals
              </button>
              <button
                onClick={() => setFilter('unrevealed')}
                className={`px-4 py-2 rounded-full text-sm transition ${
                  filter === 'unrevealed'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                No Reveals
              </button>
            </div>

            <input
              type="text"
              placeholder="Search by name or NetID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-black text-sm"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <svg
                className="w-8 h-8 animate-spin text-gray-400"
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
              <span className="ml-3 text-gray-600">Loading matches...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
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
                    className="text-red-600"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="m15 9-6 6" />
                    <path d="m9 9 6 6" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 text-sm text-red-600 underline hover:text-red-800"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !error && filteredMatches.length === 0 && (
            <div className="text-center py-12">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto text-gray-300 mb-4"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <p className="text-gray-500">
                {searchQuery || filter !== 'all'
                  ? 'No matches found with the current filters'
                  : 'No matches generated yet for this prompt'}
              </p>
            </div>
          )}

          {!isLoading && !error && filteredMatches.length > 0 && (
            <div className="grid gap-4">
              {filteredMatches.map((match, index) => (
                <div
                  key={`${match.netid}-${index}`}
                  className="bg-gray-50 rounded-lg p-5 border border-gray-200"
                >
                  {/* User who received matches */}
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                    {match.profilePicture ? (
                      <img
                        src={match.profilePicture}
                        alt={match.firstName}
                        className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gray-300 flex items-center justify-center text-white text-xl font-semibold">
                        {match.firstName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="text-black font-bold text-lg">
                        {match.firstName}
                      </h4>
                      <p className="text-sm text-gray-500">{match.netid}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTimestamp(match.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Reveals</div>
                      <div className="text-lg font-bold text-black">
                        {match.matches.filter((m) => m.revealed).length} / 3
                      </div>
                    </div>
                  </div>

                  {/* Matched users */}
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-gray-600 mb-2">
                      Their Matches:
                    </div>
                    {match.matches.map((matchedUser, matchIndex) => (
                      <div
                        key={`${matchedUser.netid}-${matchIndex}`}
                        className={`flex items-center gap-3 p-3 rounded transition ${
                          matchedUser.revealed
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        {matchedUser.profilePicture ? (
                          <img
                            src={matchedUser.profilePicture}
                            alt={matchedUser.firstName}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white text-sm font-semibold">
                            {matchedUser.firstName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="text-black font-medium">
                            {matchedUser.firstName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {matchedUser.netid}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {matchedUser.revealed ? (
                            <div className="flex items-center gap-1 text-green-600 text-sm">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              <span className="font-medium">Revealed</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-gray-400 text-sm">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                <line x1="2" x2="22" y1="2" y2="22" />
                              </svg>
                              <span>Not Revealed</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="text-sm text-gray-600">
            Showing {filteredMatches.length} of {data?.matches.length || 0}{' '}
            matches
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-[linear-gradient(135.7deg,_#000000_0%,_#333333_100.01%)] text-white hover:opacity-90 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
