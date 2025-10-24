// _layout.tsx
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import auth from '@react-native-firebase/auth';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { onAuthStateChanged } from './api/authService';
import { getCurrentUserProfile } from './api/profileApi';
import { ThemeProvider, useThemeAware } from './contexts/ThemeContext';

/**
 * Token Refresh Configuration
 * Automatically refreshes Firebase ID tokens every 45 minutes
 * to ensure authentication remains valid
 */
const TOKEN_REFRESH_INTERVAL_MS = 45 * 60 * 1000; // 45 minutes

function RootNavigator() {
  useThemeAware(); // This makes all screens theme-aware
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const router = useRouter();
  const segments = useSegments();

  const handleAuthStateChanged = (user: FirebaseAuthTypes.User | null) => {
    console.log('Auth state changed:', user?.email || 'No user');
    setUser(user);
    if (initializing) setInitializing(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(handleAuthStateChanged);
    return unsubscribe;
  }, []);

  // Automatic token refresh to maintain authentication
  useEffect(() => {
    if (!user) return;

    const refreshToken = async () => {
      try {
        const currentUser = auth().currentUser;
        if (currentUser) {
          await currentUser.getIdToken(true); // Force refresh
          console.log('🔄 Token refreshed successfully');
        }
      } catch (error) {
        console.error('❌ Token refresh failed:', error);
      }
    };

    // Set up periodic refresh
    const intervalId = setInterval(refreshToken, TOKEN_REFRESH_INTERVAL_MS);

    // Cleanup on unmount or user sign out
    return () => clearInterval(intervalId);
  }, [user]);

  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === '(auth)';

    const checkAndRedirect = async () => {
      console.log('=== AUTH CHECK ===');
      console.log('User:', user?.email || 'No user');
      console.log('inAuthGroup:', inAuthGroup);
      console.log('segments:', segments);
      console.log('Full path:', segments.join('/'));

      if (user && !inAuthGroup) {
        // User is signed in but not in auth group
        // Check if user has a profile to determine where to redirect
        try {
          const profile = await getCurrentUserProfile();

          if (profile) {
            // User has a complete profile, go to tabs
            console.log('✅ Redirecting to tabs - user has profile');
            router.replace('/(auth)/(tabs)');
          } else {
            // User doesn't have a profile yet, go to create profile
            console.log('✅ Redirecting to create-profile - no profile found');
            router.replace('/(auth)/create-profile');
          }
        } catch (error) {
          console.error('Error checking profile:', error);
          // If there's an error checking the profile, default to create profile
          console.log(
            '✅ Redirecting to create-profile - error checking profile'
          );
          router.replace('/(auth)/create-profile');
        }
      } else if (!user && inAuthGroup) {
        // User is not signed in but in auth group, redirect to login
        console.log('✅ Redirecting to root - no user but in auth group');
        router.replace('/');
      } else if (!user && !inAuthGroup) {
        console.log(
          'ℹ️  No user and not in auth group - staying at current location'
        );
      } else {
        console.log(
          'ℹ️  User authenticated and in auth group - no action needed'
        );
      }
      console.log('=== END AUTH CHECK ===\n');
    };

    checkAndRedirect();
  }, [user, initializing]);

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Login' }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen
        name="home"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}

const styles = {
  loadingContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flex: 1,
  },
};
