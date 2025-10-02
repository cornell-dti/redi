import { router } from 'expo-router';
import { useEffect } from 'react';

// Redirect component - this file now just redirects to the main tabs
export default function HomePage() {
  useEffect(() => {
    // TODO: Check if user has completed profile setup
    // If profile incomplete: router.replace('/(auth)/create-profile');
    // If profile complete: router.replace('/(auth)/(tabs)');

    // For now, always redirect to tabs (main app)
    router.replace('/(auth)/(tabs)' as any);;
  }, []);

  // Return null since this component just redirects
  return null;
}