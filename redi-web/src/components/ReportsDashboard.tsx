'use client';

import { fetchReports, resolveReport, updateReportStatus } from '@/api/admin';
import {
  ReportStatus,
  ReportWithProfilesResponse,
  UpdateReportStatusInput,
} from '@/types/admin';
import { useEffect, useState } from 'react';

const STATUS_COLORS: Record<ReportStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-800',
};

const REASON_LABELS: Record<string, string> = {
  inappropriate_content: 'Inappropriate Content',
  harassment: 'Harassment',
  spam: 'Spam',
  fake_profile: 'Fake Profile',
  other: 'Other',
};

export default function ReportsDashboard() {
  const [reports, setReports] = useState<ReportWithProfilesResponse[]>([]);
  const [filteredReports, setFilteredReports] = useState<
    ReportWithProfilesResponse[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [selectedReport, setSelectedReport] =
    useState<ReportWithProfilesResponse | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    // Filter reports based on selected status
    if (statusFilter === 'all') {
      setFilteredReports(reports);
    } else {
      setFilteredReports(reports.filter((r) => r.status === statusFilter));
    }
  }, [statusFilter, reports]);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchReports();
      setReports(data);
      setFilteredReports(data);
    } catch (err) {
      console.error('Error loading reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (
    reportId: string,
    input: UpdateReportStatusInput
  ) => {
    try {
      setIsUpdating(true);
      await updateReportStatus(reportId, input);
      await loadReports();
      setSelectedReport(null);
      setResolutionText('');
    } catch (err) {
      console.error('Error updating report:', err);
      alert(
        err instanceof Error ? err.message : 'Failed to update report status'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResolve = async (reportId: string, resolution: string) => {
    try {
      setIsUpdating(true);
      await resolveReport(reportId, resolution);
      await loadReports();
      setSelectedReport(null);
      setResolutionText('');
    } catch (err) {
      console.error('Error resolving report:', err);
      alert(err instanceof Error ? err.message : 'Failed to resolve report');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (isoString: string): string => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: ReportStatus) => {
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}
      >
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const pendingCount = reports.filter((r) => r.status === 'pending').length;
  const underReviewCount = reports.filter(
    (r) => r.status === 'under_review'
  ).length;
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length;
  const dismissedCount = reports.filter((r) => r.status === 'dismissed').length;

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-black mb-2">
          Reports Dashboard
        </h2>
        <p className="text-gray-600">
          Review and manage user reports to maintain community safety
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
          <span className="ml-3 text-gray-600">Loading reports...</span>
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
                onClick={loadReports}
                className="mt-2 text-sm text-red-600 underline hover:text-red-800"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="text-sm text-yellow-700 mb-1">Pending</div>
              <div className="text-2xl font-bold text-yellow-900">
                {pendingCount}
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm text-blue-700 mb-1">Under Review</div>
              <div className="text-2xl font-bold text-blue-900">
                {underReviewCount}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm text-green-700 mb-1">Resolved</div>
              <div className="text-2xl font-bold text-green-900">
                {resolvedCount}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-700 mb-1">Dismissed</div>
              <div className="text-2xl font-bold text-gray-900">
                {dismissedCount}
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                statusFilter === 'all'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({reports.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                statusFilter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('under_review')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                statusFilter === 'under_review'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              Under Review ({underReviewCount})
            </button>
            <button
              onClick={() => setStatusFilter('resolved')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                statusFilter === 'resolved'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              Resolved ({resolvedCount})
            </button>
            <button
              onClick={() => setStatusFilter('dismissed')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                statusFilter === 'dismissed'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Dismissed ({dismissedCount})
            </button>
          </div>

          {/* Reports List */}
          {filteredReports.length === 0 ? (
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
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <p className="text-gray-500">No reports found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Reporter
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Reported User
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Reason
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr
                      key={report.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {report.reporterPicture ? (
                            <img
                              src={report.reporterPicture}
                              alt={report.reporterName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600">
                                {report.reporterName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-black">
                              {report.reporterName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {report.reporterNetid}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {report.reportedPicture ? (
                            <img
                              src={report.reportedPicture}
                              alt={report.reportedName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600">
                                {report.reportedName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-black">
                              {report.reportedName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {report.reportedNetid}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-700">
                          {REASON_LABELS[report.reason] || report.reason}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {formatDate(report.createdAt)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {getStatusBadge(report.status)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => setSelectedReport(report)}
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
        </>
      )}

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-black mb-2">
                    Report Details
                  </h3>
                  <div className="text-sm text-gray-500">
                    ID: {selectedReport.id}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedReport(null);
                    setResolutionText('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
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

              <div className="space-y-4 mb-6">
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-1">
                    Status
                  </div>
                  {getStatusBadge(selectedReport.status)}
                </div>

                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-1">
                    Reporter
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedReport.reporterPicture ? (
                      <img
                        src={selectedReport.reporterPicture}
                        alt={selectedReport.reporterName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {selectedReport.reporterName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-black">
                        {selectedReport.reporterName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {selectedReport.reporterNetid}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-1">
                    Reported User
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedReport.reportedPicture ? (
                      <img
                        src={selectedReport.reportedPicture}
                        alt={selectedReport.reportedName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {selectedReport.reportedName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-black">
                        {selectedReport.reportedName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {selectedReport.reportedNetid}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-1">
                    Reason
                  </div>
                  <div className="text-black">
                    {REASON_LABELS[selectedReport.reason] ||
                      selectedReport.reason}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-1">
                    Description
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-black whitespace-pre-wrap">
                    {selectedReport.description}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-1">
                    Submitted
                  </div>
                  <div className="text-gray-600">
                    {formatDate(selectedReport.createdAt)}
                  </div>
                </div>

                {selectedReport.reviewedAt && (
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-1">
                      Reviewed
                    </div>
                    <div className="text-gray-600">
                      {formatDate(selectedReport.reviewedAt)}
                      {selectedReport.reviewedBy && (
                        <span className="text-sm text-gray-500 ml-2">
                          by {selectedReport.reviewedBy}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {selectedReport.resolution && (
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-1">
                      Resolution Notes
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-black whitespace-pre-wrap">
                      {selectedReport.resolution}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="border-t pt-6">
                <div className="text-sm font-semibold text-gray-700 mb-3">
                  Update Status
                </div>
                <div className="flex gap-2 mb-4 flex-wrap">
                  <button
                    onClick={() =>
                      handleUpdateStatus(selectedReport.id, {
                        status: 'under_review',
                      })
                    }
                    disabled={
                      isUpdating || selectedReport.status === 'under_review'
                    }
                    className="px-4 py-2 rounded-full text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Mark Under Review
                  </button>
                  <button
                    onClick={() =>
                      handleUpdateStatus(selectedReport.id, {
                        status: 'dismissed',
                      })
                    }
                    disabled={
                      isUpdating || selectedReport.status === 'dismissed'
                    }
                    className="px-4 py-2 rounded-full text-sm font-medium bg-gray-600 text-white hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Dismiss
                  </button>
                </div>

                <div className="text-sm font-semibold text-gray-700 mb-3">
                  Resolve Report
                </div>
                <textarea
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="Enter resolution notes (required)..."
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={4}
                />
                <button
                  onClick={() =>
                    handleResolve(selectedReport.id, resolutionText)
                  }
                  disabled={
                    isUpdating ||
                    !resolutionText.trim() ||
                    selectedReport.status === 'resolved'
                  }
                  className="px-6 py-2 rounded-full text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Updating...' : 'Resolve Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
