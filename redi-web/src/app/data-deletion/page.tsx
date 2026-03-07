'use client';

import Link from 'next/link';

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 md:p-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-purple-600 hover:text-purple-700 font-medium mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Account & Data Deletion
          </h1>
          <p className="text-gray-600 mt-2">
            Request deletion of your Redi account and associated data
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              How to Request Account Deletion
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you would like to delete your <span className="font-semibold">Redi</span> account
              and all associated data, please follow these steps:
            </p>

            <div className="bg-purple-50 border-l-4 border-purple-600 p-6 my-6 rounded-r-lg">
              <ol className="list-decimal pl-6 text-gray-700 space-y-3 font-medium">
                <li>
                  Send an email to{' '}
                  <a
                    href="mailto:redicornell@gmail.com?subject=Account Deletion Request"
                    className="text-purple-600 hover:text-purple-700 font-semibold underline"
                  >
                    redicornell@gmail.com
                  </a>
                </li>
                <li>
                  Use the subject line: <span className="italic">&quot;Account Deletion Request&quot;</span>
                </li>
                <li>
                  Include the email address associated with your Redi account
                </li>
                <li>
                  Wait for confirmation that your request has been processed
                </li>
              </ol>
            </div>

            <p className="text-gray-700 leading-relaxed">
              Our team will verify your identity and process your deletion request promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              What Data Will Be Deleted
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you request account deletion, the following data will be permanently removed:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Your Cornell email address and account identifiers</li>
              <li>Profile information and user-generated content</li>
              <li>Match history and preferences</li>
              <li>Any photos or media you uploaded</li>
              <li>Communication records and interactions within the app</li>
              <li>All other personally identifiable information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              What Data Will Be Retained
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              For product improvement purposes, we may retain:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                <span className="font-semibold">De-identified, aggregated statistics</span> such as
                overall usage metrics and engagement patterns that cannot be linked back to you
              </li>
              <li>
                <span className="font-semibold">Anonymized data</span> used to improve our matching
                algorithm and app functionality
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              This retained data is completely anonymized and cannot be used to identify you
              personally.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Deletion Timeline
            </h2>
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-6">
              <p className="text-gray-700 leading-relaxed">
                Once we receive and verify your deletion request, all personally identifiable
                information will be permanently deleted from our systems within{' '}
                <span className="font-bold text-pink-700 text-xl">7 days</span>.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                You will receive a confirmation email once the deletion process is complete.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Important Notes
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-3">
              <li>
                Account deletion is <span className="font-semibold">permanent and irreversible</span>.
                Once deleted, you cannot recover your account or data.
              </li>
              <li>
                If you wish to use Redi again in the future, you will need to create a new account.
              </li>
              <li>
                Deletion requests are processed manually to ensure security. You should receive
                confirmation within 1-2 business days.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Questions or Concerns?
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about the deletion process or our data practices,
              please contact us at{' '}
              <a
                href="mailto:redicornell@gmail.com"
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                redicornell@gmail.com
              </a>
              . For more information about how we handle your data, please review our{' '}
              <Link
                href="/privacy"
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-600">
            <Link
              href="/privacy"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Privacy Policy
            </Link>
            {' • '}
            <Link
              href="/terms"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Terms & Conditions
            </Link>
            {' • '}
            <Link
              href="/"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
