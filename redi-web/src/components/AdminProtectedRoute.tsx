'use client';

import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { FIREBASE_APP } from '../../firebase';
import AdminSignIn from './AdminSignIn';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

type AuthState = 'loading' | 'unauthenticated' | 'unauthorized' | 'authorized';

export default function AdminProtectedRoute({
  children,
}: AdminProtectedRouteProps) {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const auth = getAuth(FIREBASE_APP);

    const verifyAdminStatus = async (user: User | null) => {
      if (!user) {
        setAuthState('unauthenticated');
        return;
      }

      try {
        console.log('🔍 Verifying admin status for user:', user.uid);

        // Force token refresh to get latest custom claims
        const tokenResult = await user.getIdTokenResult(true);

        console.log('🔍 Token claims:', tokenResult.claims);

        // Check custom claim
        if (tokenResult.claims.admin === true) {
          console.log('✅ User has admin custom claim');
          setAuthState('authorized');
        } else {
          console.log('⛔ User does NOT have admin custom claim');
          setAuthState('unauthorized');
          setErrorMessage('Your account does not have admin privileges');
        }
      } catch (error) {
        console.error('❌ Error verifying admin status:', error);
        setAuthState('unauthorized');
        setErrorMessage('Failed to verify admin status');
      }
    };

    // Initial check
    verifyAdminStatus(auth.currentUser);

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, verifyAdminStatus);

    return () => unsubscribe();
  }, []);

  console.log('📊 Rendering with authState:', authState);

  if (authState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
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
          <p className="text-lg text-black opacity-70">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return (
      <AdminSignIn
        onSignInSuccess={() => {
          console.log(
            '✅ Sign in success - auth state will update via onAuthStateChanged'
          );
          // Don't set state here - let onAuthStateChanged handle it
        }}
      />
    );
  }

  if (authState === 'unauthorized') {
    const auth = getAuth(FIREBASE_APP);
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4 text-center p-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-500"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
          </svg>
          <h1 className="text-2xl font-bold text-black">Access Denied</h1>
          <p className="text-lg text-black opacity-70">
            {errorMessage || 'You do not have permission to access this page.'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Only authorized administrators can access this dashboard.
          </p>
          <button
            onClick={() => {
              console.log('🚪 Signing out...');
              auth.signOut();
            }}
            className="px-6 py-2 bg-gray-200 text-black rounded-full hover:bg-gray-300 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  console.log('🎉 Rendering protected children');
  return <>{children}</>;
}
