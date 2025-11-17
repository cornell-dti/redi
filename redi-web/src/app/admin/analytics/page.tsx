'use client';

import { useState, useEffect } from 'react';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import Link from 'next/link';
import { getAuth } from 'firebase/auth';
import { FIREBASE_APP } from '../../../../firebase';
import {
  fetchDemographicBreakdown,
  fetchCompatibilityMatrix,
  fetchEngagementMetrics,
  fetchMutualNudgeStats,
  fetchAllPrompts,
} from '@/api/admin';
import type {
  DemographicBreakdownResponse,
  CompatibilityMatrixResponse,
  EngagementMetricsResponse,
  MutualNudgeStatsResponse,
} from '@/types/analytics';
import type { WeeklyPrompt } from '@/types/admin';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

const COLORS = [
  '#000000',
  '#333333',
  '#666666',
  '#999999',
  '#BBBBBB',
  '#DDDDDD',
  '#E5E5E5',
  '#F0F0F0',
  '#F5F5F5',
];

export default function AdminAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [demographics, setDemographics] =
    useState<DemographicBreakdownResponse | null>(null);
  const [compatibility, setCompatibility] =
    useState<CompatibilityMatrixResponse | null>(null);
  const [engagement, setEngagement] =
    useState<EngagementMetricsResponse | null>(null);
  const [nudges, setNudges] = useState<MutualNudgeStatsResponse | null>(null);

  // Prompt filter state
  const [prompts, setPrompts] = useState<WeeklyPrompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');

  useEffect(() => {
    loadAllData();
    loadPrompts();
  }, []);

  useEffect(() => {
    if (prompts.length > 0) {
      loadDemographics();
    }
  }, [selectedPromptId]);

  const loadPrompts = async () => {
    try {
      const allPrompts = await fetchAllPrompts();
      setPrompts(allPrompts);
    } catch (err) {
      console.error('Error loading prompts:', err);
    }
  };

  const loadDemographics = async () => {
    try {
      const data = await fetchDemographicBreakdown(
        selectedPromptId || undefined
      );
      setDemographics(data);
    } catch (err) {
      console.error('Error loading demographics:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load demographics'
      );
    }
  };

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [demoData, compatData, engageData, nudgeData] = await Promise.all([
        fetchDemographicBreakdown(),
        fetchCompatibilityMatrix(),
        fetchEngagementMetrics(),
        fetchMutualNudgeStats(),
      ]);

      setDemographics(demoData);
      setCompatibility(compatData);
      setEngagement(engageData);
      setNudges(nudgeData);
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load analytics data'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    const auth = getAuth(FIREBASE_APP);
    await auth.signOut();
    window.location.href = '/admin/prompts';
  };

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-black">
                  Analytics Dashboard
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  User demographics, engagement metrics, and match quality
                  indicators
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/prompts"
                  className="px-4 py-2 bg-gray-100 text-black rounded-full hover:bg-gray-200 transition border border-gray-300"
                >
                  Back to Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-gray-100 text-black rounded-full hover:bg-gray-200 transition border border-gray-300"
                >
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
              <svg
                className="w-12 h-12 text-black animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a9 9 0 1 1-6.219-8.56"
                />
              </svg>
              <span className="ml-3 text-gray-600">Loading analytics...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-600"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path d="m15 9-6 6" stroke="currentColor" strokeWidth="2" />
                    <path d="m9 9 6 6" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                  <button
                    onClick={loadAllData}
                    className="mt-2 text-sm text-red-600 underline hover:text-red-800"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {!isLoading && !error && (
            <div className="space-y-8">
              {/* 1. Demographics Pie Chart */}
              {demographics && (
                <div className="bg-white rounded-lg shadow-lg p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold text-black mb-2">
                        Gender & Orientation Breakdown
                      </h2>
                      <p className="text-gray-600">
                        Distribution of users by gender identity and dating
                        preferences
                        {demographics.filteredByPrompt &&
                          ` (filtered by prompt)`}
                      </p>
                    </div>

                    {/* Prompt Filter */}
                    <select
                      value={selectedPromptId}
                      onChange={(e) => setSelectedPromptId(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-full bg-white text-black focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="">All Users</option>
                      {prompts.map((prompt) => (
                        <option key={prompt.promptId} value={prompt.promptId}>
                          {prompt.promptId} - {prompt.question.substring(0, 50)}
                          ...
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-8">
                    {/* Pie Chart */}
                    <div className="flex-1" style={{ height: '400px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={demographics.categories}
                            dataKey="count"
                            nameKey="label"
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            label={(entry: { percent: number }) =>
                              `${(entry.percent * 100).toFixed(1)}%`
                            }
                          >
                            {demographics.categories.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Stats Table */}
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-4">
                        <div className="text-sm text-gray-600 mb-1">
                          Total Users
                        </div>
                        <div className="text-4xl font-bold text-black">
                          {demographics.totalUsers.toLocaleString()}
                        </div>
                      </div>

                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b-2 border-gray-200">
                            <th className="text-left py-2 text-gray-700">
                              Category
                            </th>
                            <th className="text-right py-2 text-gray-700">
                              Count
                            </th>
                            <th className="text-right py-2 text-gray-700">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {demographics.categories.map((cat, idx) => (
                            <tr key={idx} className="border-b border-gray-100">
                              <td className="py-2 text-gray-900">
                                {cat.label}
                              </td>
                              <td className="text-right py-2 font-semibold text-black">
                                {cat.count}
                              </td>
                              <td className="text-right py-2 text-gray-900">
                                {cat.percentage.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Compatibility Matrix */}
              {compatibility && (
                <div className="bg-white rounded-lg shadow-lg p-8">
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-black mb-2">
                      Match Compatibility Matrix
                    </h2>
                    <p className="text-gray-600">
                      Supply and demand analysis - shows how many potential
                      matches each demographic has
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-3 px-4 text-gray-700">
                            User Demographic
                          </th>
                          <th className="text-center py-3 px-4 text-gray-700">
                            Target Demographic
                          </th>
                          <th className="text-center py-3 px-4 text-gray-700">
                            Available Matches
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {compatibility.matrix
                          .filter((cell) => cell.availableMatches > 0)
                          .sort(
                            (a, b) => b.availableMatches - a.availableMatches
                          )
                          .map((cell, idx) => (
                            <tr
                              key={idx}
                              className="border-b border-gray-100 hover:bg-gray-50"
                            >
                              <td className="py-3 px-4 text-gray-900">
                                {cell.userDemographic.replace(/_/g, ' ')}
                              </td>
                              <td className="text-center py-3 px-4 text-gray-900">
                                {cell.targetDemographic.replace(/_/g, ' ')}
                              </td>
                              <td className="text-center py-3 px-4 font-semibold text-black">
                                {cell.availableMatches}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 3. Engagement Metrics */}
              {engagement && (
                <div className="bg-white rounded-lg shadow-lg p-8">
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-black mb-2">
                      Weekly Active Users & Response Rate
                    </h2>
                    <p className="text-gray-600">
                      User engagement and prompt participation trends
                    </p>
                  </div>

                  {/* Current Week Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">
                        Current Week Active
                      </div>
                      <div className="text-4xl font-bold text-black">
                        {engagement.currentWeek.activeUsers}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">
                        Total Eligible Users
                      </div>
                      <div className="text-4xl font-bold text-black">
                        {engagement.currentWeek.totalEligibleUsers}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">
                        Response Rate
                      </div>
                      <div className="text-4xl font-bold text-black">
                        {engagement.currentWeek.responseRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Historical Trend */}
                  <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          engagement.currentWeek,
                          ...engagement.historicalWeeks,
                        ].reverse()}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="weekStart"
                          tickFormatter={(val) =>
                            new Date(val).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          }
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(val) =>
                            `Week of ${new Date(val as string).toLocaleDateString()}`
                          }
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="activeUsers"
                          stroke="#000000"
                          strokeWidth={2}
                          name="Active Users"
                        />
                        <Line
                          type="monotone"
                          dataKey="responseRate"
                          stroke="#666666"
                          strokeWidth={2}
                          name="Response Rate %"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* 4. Mutual Nudge Stats */}
              {nudges && (
                <div className="bg-white rounded-lg shadow-lg p-8">
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-black mb-2">
                      Mutual Nudge Rate by Demographic
                    </h2>
                    <p className="text-gray-600">
                      Match quality indicator - higher mutual nudge rates
                      suggest better matching
                    </p>
                  </div>

                  {/* Overall Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">
                        Total Matches This Week
                      </div>
                      <div className="text-4xl font-bold text-black">
                        {nudges.overall.totalMatches}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">
                        Mutual Nudges
                      </div>
                      <div className="text-4xl font-bold text-black">
                        {nudges.overall.mutualNudges}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">
                        Overall Rate
                      </div>
                      <div className="text-4xl font-bold text-black">
                        {nudges.overall.mutualNudgeRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Bar Chart by Demographic */}
                  <div style={{ height: '400px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={nudges.demographics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="demographicLabel"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="mutualNudgeRate"
                          fill="#000000"
                          name="Mutual Nudge Rate %"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Detailed Table */}
                  <table className="w-full text-sm mt-6">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 text-gray-700">
                          Demographic
                        </th>
                        <th className="text-center py-3 px-4 text-gray-700">
                          Total Matches
                        </th>
                        <th className="text-center py-3 px-4 text-gray-700">
                          Mutual Nudges
                        </th>
                        <th className="text-center py-3 px-4 text-gray-700">
                          Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {nudges.demographics.map((demo, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4 text-gray-900">
                            {demo.demographicLabel}
                          </td>
                          <td className="text-center py-3 px-4 text-black">
                            {demo.totalMatches}
                          </td>
                          <td className="text-center py-3 px-4 text-black">
                            {demo.mutualNudges}
                          </td>
                          <td className="text-center py-3 px-4 font-semibold text-black">
                            {demo.mutualNudgeRate.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-sm text-gray-600 text-center">
              REDI Analytics Dashboard - Data refreshes on page load
            </p>
          </div>
        </footer>
      </div>
    </AdminProtectedRoute>
  );
}
