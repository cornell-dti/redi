'use client';

import Link from 'next/link';

export default function TermsPage() {
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
            Terms & Conditions
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
            Welcome to <span className="font-semibold">Redi</span> ("Redi,"
            "we," "us," or "our"). By downloading or using the Redi mobile
            application and related services (collectively, the "Service"), you
            agree to these Terms and Conditions ("Terms"). Please read them
            carefully before use. If you do not agree, please do not use the
            Service.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Eligibility
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Redi is designed exclusively for members of the Cornell University
              community who are 18 years of age or older and use a valid Cornell
              email address for verification. By using the Service, you
              represent and warrant that you meet these criteria.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Account and Access
            </h2>
            <p className="text-gray-700 leading-relaxed">
              You may be required to verify your identity with your Cornell
              email or other credentials. You are responsible for maintaining
              the confidentiality of your login information and for all activity
              under your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Use of the Service
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Use Redi only for lawful personal purposes.</li>
              <li>
                Do not misuse, interfere with, reverse engineer, or extract data
                from the Service.
              </li>
              <li>
                Redi may suspend or terminate accounts that violate these Terms.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Data Processing and Machine Learning
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                Redi does{' '}
                <span className="font-semibold">
                  not permanently store user profile data.
                </span>
              </li>
              <li>
                Profile inputs (e.g., preferences, prompts, responses, photos)
                are <span className="font-semibold">temporarily processed</span>{' '}
                through a machine-learning model to generate match
                recommendations.
              </li>
              <li>
                Once processing is complete, these inputs are deleted or
                anonymized and cannot be used to identify you.
              </li>
              <li>
                Redi may retain aggregated, de-identified statistics to improve
                its models.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. User Content
            </h2>
            <p className="text-gray-700 leading-relaxed">
              You own the content you submit. You grant Redi a limited,
              revocable license to process that content solely for matching and
              Service functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Intellectual Property
            </h2>
            <p className="text-gray-700 leading-relaxed">
              All trademarks, logos, designs, and software belong to Redi or its
              licensors. You may not copy, modify, or redistribute any part of
              the Service without written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Disclaimers
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Redi is provided "as is," without warranties of any kind. We do
              not guarantee the accuracy of match results or continuous
              availability of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Limitation of Liability
            </h2>
            <p className="text-gray-700 leading-relaxed">
              To the maximum extent permitted by law, Redi and its affiliates
              are not liable for indirect, incidental, or consequential damages
              arising from use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. Termination
            </h2>
            <p className="text-gray-700 leading-relaxed">
              You may delete your account at any time. We may suspend or
              terminate access for violations of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              10. Changes to These Terms
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We may update these Terms periodically. Continued use after notice
              of changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              11. Contact
            </h2>
            <p className="text-gray-700 leading-relaxed">
              For questions about these Terms, contact us at:{' '}
              <a
                href="mailto:support@redi.love"
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                EMAIL
              </a>
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
