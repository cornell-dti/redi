'use client';

import { fetchMatchStats } from '@/api/admin';
import { MatchStatsResponse } from '@/types/admin';
import { useEffect, useState } from 'react';
import PromptMatchDetailsViewer from './PromptMatchDetailsViewer';

export default function MatchesDashboard() {
  const [stats, setStats] = useState<MatchStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [selectedPromptQuestion, setSelectedPromptQuestion] =
    useState<string>('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchMatchStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading match stats:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load match statistics'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (promptId: string, question: string) => {
    setSelectedPromptId(promptId);
    setSelectedPromptQuestion(question);
  };

  const handleCloseDetails = () => {
    setSelectedPromptId(null);
    setSelectedPromptQuestion('');
  };

  const formatDate = (isoString: string): string => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-black mb-2">
          Matches Dashboard
        </h2>
        <p className="text-gray-600">
          Track match generation and reveal statistics across all prompts
        </p>
      </div>

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
          <span className="ml-3 text-gray-600">Loading statistics...</span>
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
                onClick={loadStats}
                className="mt-2 text-sm text-red-600 underline hover:text-red-800"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && stats && (
        <>
          {/* Overview Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Total Matches</div>
              <div className="text-3xl font-bold text-black">
                {stats.totalMatches.toLocaleString()}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Users Matched</div>
              <div className="text-3xl font-bold text-black">
                {stats.totalUsersMatched.toLocaleString()}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Reveal Rate</div>
              <div className="text-3xl font-bold text-black">
                {stats.revealRate.toFixed(1)}%
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-black h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(stats.revealRate, 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">
                Avg Matches/Prompt
              </div>
              <div className="text-3xl font-bold text-black">
                {stats.averageMatchesPerPrompt.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Per-Prompt Breakdown */}
          <div>
            <h3 className="text-xl font-bold text-black mb-4">
              Per-Prompt Breakdown
            </h3>

            {stats.promptStats.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
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
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
                <p className="text-gray-500">
                  No matches have been generated yet
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Prompt Question
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Match Date
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                        Users Matched
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                        Reveals
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                        Reveal Rate
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.promptStats.map((promptStat) => (
                      <tr
                        key={promptStat.promptId}
                        className="border-b border-gray-100 hover:bg-gray-50 transition"
                      >
                        <td className="py-4 px-4">
                          <div className="text-black font-medium max-w-md truncate">
                            {promptStat.question}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {promptStat.promptId}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {formatDate(promptStat.matchDate)}
                        </td>
                        <td className="py-4 px-4 text-center text-black font-medium">
                          {promptStat.totalUsersMatched}
                        </td>
                        <td className="py-4 px-4 text-center text-gray-600">
                          {promptStat.totalReveals} /{' '}
                          {promptStat.totalMatchDocuments * 3}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-black font-medium">
                              {promptStat.revealRate.toFixed(1)}%
                            </span>
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-black h-1.5 rounded-full transition-all"
                                style={{
                                  width: `${Math.min(promptStat.revealRate, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() =>
                              handleViewDetails(
                                promptStat.promptId,
                                promptStat.question
                              )
                            }
                            className="px-4 py-1.5 text-sm rounded-full bg-gray-100 text-black hover:bg-gray-200 transition border border-gray-300"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Match Details Modal */}
      {selectedPromptId && (
        <PromptMatchDetailsViewer
          promptId={selectedPromptId}
          promptQuestion={selectedPromptQuestion}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
}
