'use client';

import { getUserCount, sendBroadcastNotification } from '@/api/admin';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import { getAuth } from 'firebase/auth';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FIREBASE_APP } from '../../../../firebase';

export default function AdminBroadcastPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [userCount, setUserCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignOut = async () => {
    const auth = getAuth(FIREBASE_APP);
    await auth.signOut();
  };

  const loadUserCount = async () => {
    setIsLoadingCount(true);
    try {
      const count = await getUserCount();
      setUserCount(count);
    } catch (err) {
      console.error('Error loading user count:', err);
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to load user count'
      );
    } finally {
      setIsLoadingCount(false);
    }
  };

  useEffect(() => {
    loadUserCount();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmDialog(true);
  };

  const handleConfirmSend = async () => {
    setShowConfirmDialog(false);
    setIsSending(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const result = await sendBroadcastNotification(title, body);
      setSuccessMessage(
        `Successfully sent notification to ${result.successCount} out of ${result.totalUsers} users`
      );
      setTitle('');
      setBody('');
      // Reload user count
      await loadUserCount();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to send notification'
      );
    } finally {
      setIsSending(false);
    }
  };

  const isFormValid = title.trim().length > 0 && body.trim().length > 0;
  const titleCharsRemaining = 50 - title.length;
  const bodyCharsRemaining = 200 - body.length;

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-black">
                  Broadcast Notifications
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Send push notifications to all REDI users
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
                  href="/admin/prompts"
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
                    <path d="M3 12h18" />
                    <path d="M3 6h18" />
                    <path d="M3 18h18" />
                  </svg>
                  Dashboard
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
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* User Count Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3">
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
                className="text-black"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <div>
                <p className="text-sm text-gray-600">Users with push tokens</p>
                {isLoadingCount ? (
                  <p className="text-2xl font-bold text-black">Loading...</p>
                ) : (
                  <p className="text-2xl font-bold text-black">
                    {userCount ?? 0}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
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
                  className="text-green-600 flex-shrink-0"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">
                    Notification Sent
                  </h3>
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
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
                  <h3 className="font-semibold text-red-900 mb-1">Error</h3>
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-black mb-4">
                Compose Notification
              </h2>

              {/* Title Input */}
              <div className="mb-4">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={50}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
                  placeholder="e.g., New Matches Available!"
                  required
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-gray-500">Max 50 characters</p>
                  <p
                    className={`text-xs ${titleCharsRemaining < 0 ? 'text-red-600' : 'text-gray-500'}`}
                  >
                    {titleCharsRemaining} remaining
                  </p>
                </div>
              </div>

              {/* Body Textarea */}
              <div className="mb-4">
                <label
                  htmlFor="body"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={200}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black resize-none"
                  placeholder="e.g., Check out your new matches for this week's prompt!"
                  required
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-gray-500">Max 200 characters</p>
                  <p
                    className={`text-xs ${bodyCharsRemaining < 0 ? 'text-red-600' : 'text-gray-500'}`}
                  >
                    {bodyCharsRemaining} remaining
                  </p>
                </div>
              </div>
            </div>

            {/* Preview */}
            {(title || body) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-black mb-4">
                  Preview
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  How the notification will appear on mobile devices:
                </p>
                <div className="bg-gray-100 rounded-lg p-4 max-w-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-black text-sm mb-1">
                        {title || 'Title'}
                      </p>
                      <p className="text-gray-700 text-xs break-words">
                        {body || 'Message body'}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">now</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={!isFormValid || isSending}
                className="px-8 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <span className="flex items-center gap-2">
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
                    Sending...
                  </span>
                ) : (
                  'Send to All Users'
                )}
              </button>
            </div>
          </form>
        </main>

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-black mb-4">
                Confirm Broadcast
              </h3>
              <p className="text-gray-700 mb-4">
                Are you sure you want to send this notification to all{' '}
                <strong>{userCount ?? 0}</strong> users?
              </p>

              {/* Preview in dialog */}
              <div className="bg-gray-100 rounded-lg p-4 mb-6">
                <p className="font-semibold text-black text-sm mb-1">
                  {title}
                </p>
                <p className="text-gray-700 text-xs">{body}</p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSend}
                  className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition"
                >
                  Confirm Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-12">
          <div className="border-t border-gray-200 pt-6">
            <p className="text-center text-sm text-gray-500">
              Redi Admin Dashboard - Broadcast Notifications
            </p>
          </div>
        </footer>
      </div>
    </AdminProtectedRoute>
  );
}
