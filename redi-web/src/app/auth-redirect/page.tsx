'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AuthRedirect() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'manual'>('loading');

  useEffect(() => {
    // Get all the Firebase auth parameters from URL
    const apiKey = searchParams.get('apiKey');
    const oobCode = searchParams.get('oobCode');
    const mode = searchParams.get('mode');
    const email = searchParams.get('email');

    // Build the deep link for the mobile app
    let deepLink = 'redi://';

    if (apiKey && oobCode) {
      // Construct the deep link with Firebase auth parameters
      const params = new URLSearchParams({
        apiKey,
        oobCode,
        mode: mode || 'signIn',
      });

      if (email) {
        params.append('email', email);
      }

      deepLink = `redi://?${params.toString()}`;
    }

    console.log('Deep link:', deepLink);

    // Try to open the mobile app
    window.location.href = deepLink;

    // Show manual button after 2 seconds if app didn't open
    setTimeout(() => {
      setStatus('manual');
    }, 2000);
  }, [searchParams]);

  const handleManualOpen = () => {
    const apiKey = searchParams.get('apiKey');
    const oobCode = searchParams.get('oobCode');
    const mode = searchParams.get('mode');
    const email = searchParams.get('email');

    let deepLink = 'redi://';

    if (apiKey && oobCode) {
      const params = new URLSearchParams({
        apiKey,
        oobCode,
        mode: mode || 'signIn',
      });

      if (email) {
        params.append('email', email);
      }

      deepLink = `redi://?${params.toString()}`;
    }

    window.location.href = deepLink;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500 p-5">
      <div className="text-center max-w-md">
        {status === 'loading' && (
          <>
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h1 className="text-5xl font-bold text-white mb-4">redi</h1>
            <p className="text-xl text-white/90">Opening the app...</p>
          </>
        )}

        {status === 'manual' && (
          <>
            <h1 className="text-5xl font-bold text-white mb-4">redi</h1>
            <p className="text-xl text-white/90 mb-6">
              Click below if the app didn&apos;t open
            </p>
            <button
              onClick={handleManualOpen}
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Open Redi App
            </button>
            <p className="text-sm text-white/70 mt-4">
              Don&apos;t have the app?{' '}
              <a href="#" className="underline">
                Download from App Store
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
