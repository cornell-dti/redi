'use client';

import { activatePrompt, deleteActivePrompt, generateMatches } from '@/api/admin';
import { WeeklyPrompt } from '@/types/admin';
import { useState } from 'react';
import ConfirmationModal from './ConfirmationModal';
import PromptAnswersViewer from './PromptAnswersViewer';

interface TestingSectionProps {
  prompts: WeeklyPrompt[];
  onActionComplete: () => void;
}

export default function TestingSection({
  prompts,
  onActionComplete,
}: TestingSectionProps) {
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const [isActivating, setIsActivating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPromptForAnswers, setSelectedPromptForAnswers] = useState<WeeklyPrompt | null>(null);

  const selectedPrompt = prompts.find((p) => p.id === selectedPromptId);

  const handleActivate = async () => {
    if (!selectedPromptId) return;

    setError(null);
    setSuccess(null);
    setIsActivating(true);

    try {
      await activatePrompt(selectedPromptId);
      setSuccess('Prompt activated successfully!');
      setShowActivateModal(false);
      onActionComplete();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to activate prompt'
      );
      setShowActivateModal(false);
    } finally {
      setIsActivating(false);
    }
  };

  const handleGenerateMatches = async () => {
    if (!selectedPromptId) return;

    setError(null);
    setSuccess(null);
    setIsGenerating(true);

    try {
      await generateMatches(selectedPromptId);
      setSuccess('Matches generated successfully!');
      setShowGenerateModal(false);
      onActionComplete();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate matches'
      );
      setShowGenerateModal(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteActive = async () => {
    setError(null);
    setSuccess(null);
    setIsDeleting(true);

    try {
      await deleteActivePrompt();
      setSuccess('Active prompt deleted successfully!');
      setShowDeleteModal(false);
      onActionComplete();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete active prompt'
      );
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date to ET timezone
  const formatDateET = (dateValue: unknown) => {
    if (!dateValue) return 'N/A';

    let date: Date;

    // Handle Firestore Timestamp objects
    if (
    dateValue && 
    typeof dateValue === 'object' && 
    'toDate' in dateValue && 
    typeof dateValue.toDate === 'function'
  ) {
    date = dateValue.toDate();
  }
  // Handle Firestore Timestamp-like objects with seconds
  else if (
    dateValue && 
    typeof dateValue === 'object' && 
    'seconds' in dateValue && 
    typeof dateValue.seconds === 'number'
  ) {
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-yellow-200">
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
          className="text-yellow-600 flex-shrink-0"
        >
          <path d="M12 2v4" />
          <path d="m16.2 7.8 2.9-2.9" />
          <path d="M18 12h4" />
          <path d="m16.2 16.2 2.9 2.9" />
          <path d="M12 18v4" />
          <path d="m4.9 19.1 2.9-2.9" />
          <path d="M2 12h4" />
          <path d="m4.9 4.9 2.9 2.9" />
        </svg>
        <div>
          <h2 className="text-2xl font-bold text-black">
            Testing / Manual Control
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manually trigger actions for testing purposes
          </p>
        </div>
      </div>

      {/* Warning banner */}
      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6 mt-4">
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
            className="text-yellow-600 flex-shrink-0 mt-0.5"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          <p className="text-sm text-yellow-800">
            These actions will bypass the automated Monday/Friday schedule. Use only for testing.
          </p>
        </div>
      </div>

      {/* Select Prompt */}
      <div className="mb-6">
        <label
          htmlFor="promptSelect"
          className="block text-sm font-medium text-black mb-2"
        >
          Select Prompt
        </label>
        <select
          id="promptSelect"
          value={selectedPromptId}
          onChange={(e) => {
            setSelectedPromptId(e.target.value);
            setError(null);
            setSuccess(null);
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
        >
          <option value="">-- Select a prompt --</option>
          {prompts.map((prompt) => (
            <option key={prompt.id} value={prompt.id}>
              {prompt.question} ({prompt.status}) - {formatDateET(prompt.releaseDate)}
            </option>
          ))}
        </select>
      </div>

      {/* Prompt Details */}
      {selectedPrompt && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-black mb-2">Current State</h3>
          <div className="space-y-1 text-sm">
            <p className="text-gray-700">
              <span className="font-medium">Status:</span>{' '}
              <span
                className={`px-2 py-0.5 rounded ${
                  selectedPrompt.status === 'scheduled'
                    ? 'bg-blue-100 text-blue-700'
                    : selectedPrompt.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                }`}
              >
                {selectedPrompt.status}
              </span>
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Release Date:</span>{' '}
              {formatDateET(selectedPrompt.releaseDate)} ET
            </p>
            {selectedPrompt.activatedAt && (
              <p className="text-gray-700">
                <span className="font-medium">Activated:</span>{' '}
                {formatDateET(selectedPrompt.activatedAt)} ET
              </p>
            )}
            {selectedPrompt.matchesGeneratedAt && (
              <p className="text-gray-700">
                <span className="font-medium">Matches Generated:</span>{' '}
                {formatDateET(selectedPrompt.matchesGeneratedAt)} ET
              </p>
            )}
            {selectedPrompt.answerCount !== undefined && (
              <div className="flex items-center justify-between">
                <p className="text-gray-700">
                  <span className="font-medium">Answers Received:</span>{' '}
                  {selectedPrompt.answerCount}
                </p>
                {selectedPrompt.answerCount > 0 && (
                  <button
                    onClick={() => setSelectedPromptForAnswers(selectedPrompt)}
                    className="px-3 py-1 text-xs rounded-full bg-white text-black hover:bg-gray-100 transition border border-gray-300"
                  >
                    View Answers
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setShowActivateModal(true)}
          disabled={!selectedPromptId || isActivating || isGenerating || isDeleting}
          className="flex-1 bg-blue-600 text-white rounded-full px-6 py-3 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Activate Now
        </button>
        <button
          onClick={() => setShowGenerateModal(true)}
          disabled={!selectedPromptId || isActivating || isGenerating || isDeleting}
          className="flex-1 bg-green-600 text-white rounded-full px-6 py-3 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Generate Matches Now
        </button>
      </div>

      {/* Delete Active Prompt Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={isActivating || isGenerating || isDeleting}
          className="bg-red-600 text-white rounded-full px-6 py-3 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Delete Active Prompt
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
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
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
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

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showActivateModal}
        title="Activate Prompt"
        message={`Are you sure you want to activate "${selectedPrompt?.question}"?`}
        warningMessage="This will bypass the Monday schedule and make the prompt active immediately."
        confirmText="Activate Now"
        cancelText="Cancel"
        onConfirm={handleActivate}
        onCancel={() => setShowActivateModal(false)}
        isLoading={isActivating}
      />

      <ConfirmationModal
        isOpen={showGenerateModal}
        title="Generate Matches"
        message={`Are you sure you want to generate matches for "${selectedPrompt?.question}"?`}
        warningMessage="This will bypass the Friday schedule and generate matches immediately based on current answers."
        confirmText="Generate Matches"
        cancelText="Cancel"
        onConfirm={handleGenerateMatches}
        onCancel={() => setShowGenerateModal(false)}
        isLoading={isGenerating}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Active Prompt"
        message="Are you sure you want to delete the currently active prompt?"
        warningMessage="This action cannot be undone. All data associated with this prompt will be permanently deleted."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteActive}
        onCancel={() => setShowDeleteModal(false)}
        isLoading={isDeleting}
      />

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
