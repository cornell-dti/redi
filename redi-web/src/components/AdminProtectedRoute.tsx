'use client';

import { isAdmin } from '@/utils/auth';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
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

  useEffect(() => {
    console.log('🔐 AdminProtectedRoute useEffect running');
    
    const auth = getAuth(FIREBASE_APP);
    
    // Immediately check current user
    const currentUser = auth.currentUser;
    console.log('👤 Current user (immediate):', currentUser?.uid);
    
    if (currentUser) {
      console.log('✅ User already signed in on mount');
      if (isAdmin(currentUser.uid)) {
        console.log('✅ Setting to authorized immediately');
        setAuthState('authorized');
      } else {
        console.log('❌ Setting to unauthorized immediately');
        setAuthState('unauthorized');
      }
    }

    // Also set up listener for changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔄 onAuthStateChanged fired with user:', user?.uid);
      
      if (!user) {
        console.log('❌ No user - setting unauthenticated');
        setAuthState('unauthenticated');
      } else if (isAdmin(user.uid)) {
        console.log('✅ Admin user - setting authorized');
        setAuthState('authorized');
      } else {
        console.log('❌ Non-admin user - setting unauthorized');
        setAuthState('unauthorized');
      }
    });

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
          console.log('✅ Sign in success - auth state will update via onAuthStateChanged');
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
            You do not have permission to access this page.
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