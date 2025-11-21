'use client';

import { useEffect, useState } from 'react';

export interface MatchReadinessData {
  status: 'ready' | 'warning' | 'error';
  activePrompt: {
    promptId: string;
    question: string;
    matchDate: string;
    matchDateLocal: string;
    isScheduledForTomorrow: boolean;
  } | null;
  userResponses: {
    count: number;
    uniqueUsers: number;
    sampleAnswers: Array<{ netid: string; answer: string }>;
  };
  systemHealth: {
    profilesExist: boolean;
    functionsDeployed: boolean;
    scheduledTime: string;
  };
  issues: string[];
  warnings: string[];
}

interface MatchReadinessCheckProps {
  onRefresh?: () => void;
}

export default function MatchReadinessCheck({
  onRefresh,
}: MatchReadinessCheckProps) {
  const [data, setData] = useState<MatchReadinessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const loadReadinessData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

      const auth = await import('firebase/auth');
      const firebase = await import('../../firebase');
      const user = auth.getAuth(firebase.FIREBASE_APP).currentUser;

      if (!user) {
        throw new Error('Not authenticated');
      }

      const token = await user.getIdToken(true);

      const res = await fetch(`${API_BASE_URL}/api/admin/health/match-readiness`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch readiness data');
      }

      const readinessData = await res.json();
      setData(readinessData);
    } catch (err) {
      console.error('Error loading match readiness:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load readiness check'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReadinessData();
  }, []);

  const handleRefresh = () => {
    loadReadinessData();
    onRefresh?.();
  };

  const getStatusIcon = () => {
    if (!data) return null;

    if (data.status === 'ready') {
      return (
        <svg
          className="w-6 h-6 text-green-600"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="m9 11 3 3L22 4" />
        </svg>
      );
    } else if (data.status === 'warning') {
      return (
        <svg
          className="w-6 h-6 text-yellow-600"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      );
    } else {
      return (
        <svg
          className="w-6 h-6 text-red-600"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m15 9-6 6" />
          <path d="m9 9 6 6" />
        </svg>
      );
    }
  };

  const getStatusClasses = () => {
    if (!data) return 'bg-gray-50 border-gray-200';
    if (data.status === 'ready') return 'bg-green-50 border-green-200';
    if (data.status === 'warning') return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-black mb-2">
            Match Readiness Check
          </h2>
          <p className="text-gray-600">
            System health and pre-deployment verification
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-black rounded-full hover:bg-gray-200 transition"
        >
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
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </svg>
          Refresh
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <svg
            className="w-8 h-8 animate-spin text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span className="ml-3 text-gray-600">Checking system health...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
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
                onClick={loadReadinessData}
                className="mt-2 text-sm text-red-600 underline hover:text-red-800"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && data && (
        <>
          {/* Status Overview Card */}
          <div
            className={`${getStatusClasses()} border-2 rounded-lg p-6 mb-6`}
          >
            <div className="flex items-start gap-4">
              {getStatusIcon()}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-black mb-2">
                  {data.status === 'ready' && '✅ Ready for Match Generation'}
                  {data.status === 'warning' &&
                    '⚠️ Ready with Warnings'}
                  {data.status === 'error' && '❌ Not Ready - Issues Found'}
                </h3>

                {data.activePrompt && (
                  <div className="text-sm text-gray-700 mb-3">
                    <div className="font-semibold">Active Prompt:</div>
                    <div className="pl-4 mt-1">
                      <div>ID: {data.activePrompt.promptId}</div>
                      <div>Question: "{data.activePrompt.question}"</div>
                      <div>
                        Match Date: {data.activePrompt.matchDateLocal}
                      </div>
                      <div>
                        Scheduled:{' '}
                        <span className="font-semibold">
                          {data.systemHealth.scheduledTime}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {data.issues.length > 0 && (
                  <div className="mt-3">
                    <div className="font-semibold text-red-900 mb-1">
                      ⛔ Blocking Issues:
                    </div>
                    <ul className="list-disc list-inside text-sm text-red-800 pl-4">
                      {data.issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {data.warnings.length > 0 && (
                  <div className="mt-3">
                    <div className="font-semibold text-yellow-900 mb-1">
                      ⚠️ Warnings:
                    </div>
                    <ul className="list-disc list-inside text-sm text-yellow-800 pl-4">
                      {data.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">User Responses</div>
              <div className="text-3xl font-bold text-black">
                {data.userResponses.count}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {data.userResponses.uniqueUsers} unique users
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">System Status</div>
              <div className="text-3xl font-bold text-black">
                {data.systemHealth.functionsDeployed &&
                data.systemHealth.profilesExist
                  ? 'Ready'
                  : 'Issues'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Functions & Profiles OK
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Next Match Drop</div>
              <div className="text-lg font-bold text-black">
                {data.activePrompt?.isScheduledForTomorrow
                  ? 'Tomorrow'
                  : 'Not Scheduled'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {data.systemHealth.scheduledTime}
              </div>
            </div>
          </div>

          {/* Sample Answers - Expandable */}
          {data.userResponses.sampleAnswers.length > 0 && (
            <div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-black transition mb-3"
              >
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
                  className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
                Sample User Answers ({data.userResponses.sampleAnswers.length})
              </button>

              {isExpanded && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="space-y-2">
                    {data.userResponses.sampleAnswers.map((answer, i) => (
                      <div
                        key={i}
                        className="text-sm text-gray-700 border-l-2 border-gray-300 pl-3"
                      >
                        <span className="font-mono text-xs text-gray-500">
                          {answer.netid}:
                        </span>{' '}
                        "{answer.answer}"
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
