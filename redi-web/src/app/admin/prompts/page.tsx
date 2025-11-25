'use client';

import { fetchAllPrompts } from '@/api/admin';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import ManualMatchCreation from '@/components/ManualMatchCreation';
import MatchesDashboard from '@/components/MatchesDashboard';
import ProductionModeSection from '@/components/ProductionModeSection';
import ReportsDashboard from '@/components/ReportsDashboard';
import TestingSection from '@/components/TestingSection';
import { WeeklyPrompt } from '@/types/admin';
import { getAuth } from 'firebase/auth';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FIREBASE_APP } from '../../../../firebase';

export default function AdminPromptsPage() {
  const [prompts, setPrompts] = useState<WeeklyPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    const auth = getAuth(FIREBASE_APP);
    await auth.signOut();
  };

  const loadPrompts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const fetchedPrompts = await fetchAllPrompts();
      setPrompts(fetchedPrompts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prompts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPrompts();
  }, []);

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-black">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage weekly prompts and matches
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/analytics"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-black transition"
                >
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
                    <path d="M3 3v18h18" />
                    <path d="m19 9-5 5-4-4-3 3" />
                  </svg>
                  Analytics
                </Link>
                <Link
                  href="/admin/broadcast"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-black transition"
                >
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
                    <path d="M12 2v20M2 12h20" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                  Broadcast
                </Link>
                <Link
                  href="/"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-black transition"
                >
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
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  Back to Home
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-red-600 rounded-full hover:bg-red-700 transition"
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
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" x2="9" y1="12" y2="12" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <svg
                  className="w-12 h-12 text-black animate-spin"
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
                <p className="text-lg text-black opacity-70">
                  Loading prompts...
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
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
                  className="text-red-600 flex-shrink-0"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="m15 9-6 6" />
                  <path d="m9 9 6 6" />
                </svg>
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">
                    Error Loading Prompts
                  </h3>
                  <p className="text-sm text-red-700">{error}</p>
                  <button
                    onClick={loadPrompts}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-full text-sm hover:bg-red-700 transition"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Dashboard Content */}
          {!isLoading && !error && (
            <div className="space-y-8">
              {/* Production Mode Section */}
              <ProductionModeSection
                prompts={prompts}
                onPromptCreated={loadPrompts}
              />

              {/* Matches Dashboard */}
              <MatchesDashboard />

              {/* Manual Match Creation */}
              <ManualMatchCreation />

              {/* Reports Dashboard */}
              <ReportsDashboard />

              {/* Testing Section */}
              <TestingSection
                prompts={prompts}
                onActionComplete={loadPrompts}
              />

              {/* Refresh Button */}
              <div className="flex justify-center">
                <button
                  onClick={loadPrompts}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300 transition"
                >
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
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M8 16H3v5" />
                  </svg>
                  Refresh Data
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-12">
          <div className="border-t border-gray-200 pt-6">
            <p className="text-center text-sm text-gray-500">
              Redi Admin Dashboard - Weekly Prompts Management
            </p>
          </div>
        </footer>
      </div>
    </AdminProtectedRoute>
  );
}
