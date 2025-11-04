'use client';

import Link from 'next/link';

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-semibold">Effective Date:</span> 11/02/25
            </p>
            <p>
              <span className="font-semibold">Last Updated:</span> 11/02/25
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-700 leading-relaxed mb-6">
            At <span className="font-semibold">Redi</span>, we value your
            privacy and are committed to keeping your information safe and
            minimal. This Privacy Policy explains how we collect, use, and
            protect information when you use the Redi mobile application and
            related services (collectively, the &quot;Service&quot;). By using
            Redi, you agree to the practices described below.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Information We Collect
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Redi collects only the limited information necessary to make the
              app function properly and provide a smooth user experience.
              Specifically:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-3">
              <li>
                <span className="font-semibold">Identifiers:</span> We collect
                your Cornell email address to verify that you are part of the
                Cornell community. This is used for eligibility verification
                only and is deleted when your session ends.
              </li>
              <li>
                <span className="font-semibold">User Content:</span> We
                temporarily process profile inputs you provide — such as
                prompts, preferences, or photos — solely for the purpose of
                generating match recommendations. This data is not permanently
                stored or used to personally identify you.
              </li>
              <li>
                <span className="font-semibold">Diagnostics:</span> We may
                collect anonymized technical data such as app performance
                metrics or crash reports to help us fix bugs and improve
                functionality.
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              We do <span className="font-semibold">not</span> collect your
              location, contacts, financial information, or health data. We also
              do <span className="font-semibold">not</span> use tracking
              technologies for advertising or cross-app identification.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. How We Use Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use your information to operate and improve the Service.
              Specifically:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                To generate and display compatible match suggestions using our
                machine learning model.
              </li>
              <li>To maintain the reliability and security of the app.</li>
              <li>
                To verify that users are eligible members of the Cornell
                community.
              </li>
              <li>
                To analyze de-identified, aggregate usage patterns for product
                improvement.
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Your information is never sold, shared, or used for third-party
              advertising.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Data Processing and Retention
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Profile data that you provide is processed in real time and then
              deleted. When you input your preferences or responses, the data is
              sent through a machine learning algorithm to generate
              compatibility results. Once the match process is complete, the
              data is removed from our systems or anonymized so it cannot be
              linked back to you.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We may retain de-identified, aggregated statistics (such as the
              number of matches made or overall engagement metrics) to improve
              Redi&apos;s matching algorithm over time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Machine Learning and AI Processing
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Our matching system uses machine learning to interpret the profile
              information you provide and recommend compatible matches. This
              process happens automatically and does not involve human review.
              The algorithm analyzes patterns and similarities between user
              inputs, but it does not store or remember identifiable data. Over
              time, we may use anonymized, aggregate results to improve model
              accuracy and fairness.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Data Security
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We use encryption and secure infrastructure to protect your
              information while it's being processed. All communications between
              your device and our servers occur over HTTPS. Although no system
              is completely secure, we follow industry-standard practices to
              safeguard data against unauthorized access, loss, or misuse.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Third-Party Services
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Redi may rely on trusted third-party vendors — such as cloud
              hosting and analytics providers — to operate the Service. These
              vendors are bound by confidentiality and data processing
              agreements. They are not allowed to access or use your data for
              any reason other than to support Redi&apos;s core functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Your Rights and Data Deletion
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have the right to control your information. You may:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                Request deletion of your data at any time by contacting{' '}
                <a
                  href="mailto:redicornell@gmail.com"
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  redicornell@gmail.com
                </a>
                .
              </li>
              <li>
                Ask for confirmation of what information we currently hold about
                you (if any).
              </li>
              <li>
                Withdraw your consent to processing and stop using the Service.
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Once we receive a verified deletion request, all identifiable
              information will be permanently deleted within{' '}
              <span className="font-semibold">7 days</span>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Children&apos;s Privacy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Redi is not intended for individuals under 18 years of age. We do
              not knowingly collect data from minors. If we become aware that
              data from a minor has been collected, it will be deleted
              immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. No Tracking or Cross-App Identification
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Redi does not track your activity across other apps or websites,
              and we do not link any data to advertising or marketing
              identifiers. Your activity in Redi stays within Redi.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              10. Changes to This Policy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We may occasionally update this Privacy Policy to reflect
              improvements in our practices or changes in legal requirements. If
              we make material updates, we will notify users within the app or
              via email before the new policy takes effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              11. Contact Us
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions or concerns about this Privacy Policy or our
              data handling practices, you can contact us at:{' '}
              <a
                href="mailto:redicornell@gmail.com"
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                redicornell@gmail.com
              </a>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-600">
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
