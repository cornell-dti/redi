// _layout.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import auth from '@react-native-firebase/auth';
import * as Linking from 'expo-linking';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { APIError } from './api/apiClient';
import { onAuthStateChanged, signInWithEmailLink } from './api/authService';
import { getCurrentUserProfile } from './api/profileApi';
import { HapticsProvider } from './contexts/HapticsContext';
import { MotionProvider } from './contexts/MotionContext';
import { ProfileProvider } from './contexts/ProfileContext';
import { ThemeProvider, useThemeAware } from './contexts/ThemeContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { clearBadgeCount } from './services/notificationPermissions';

SplashScreen.preventAutoHideAsync();


/**
 * Token Refresh Configuration
 * Automatically refreshes Firebase ID tokens every 45 minutes
 * to ensure authentication remains valid
 */
const TOKEN_REFRESH_INTERVAL_MS = 45 * 60 * 1000; // 45 minutes

/**
 * Profile Cache Configuration
 * Cache profile data to handle rate limiting and network errors gracefully
 */
const PROFILE_CACHE_KEY = '@profile_cache';
const PROFILE_CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface CachedProfile {
  data: any;
  timestamp: number;
}

function RootNavigator() {
  useThemeAware(); // This makes all screens theme-aware
  const { showToast } = useToast();
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const router = useRouter();
  const segments = useSegments();
  const appState = useRef(AppState.currentState);
  const isHandlingDeepLink = useRef(false);

  const handleAuthStateChanged = (user: FirebaseAuthTypes.User | null) => {
    console.log('[Auth] Auth state changed:', user?.email || 'No user');
    console.log('[Auth] Current initializing state:', initializing);
    setUser(user);
    if (initializing) {
      console.log('[Auth] Setting initializing to false');
      setInitializing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(handleAuthStateChanged);
    return unsubscribe;
  }, []);

  // Handle passwordless email link sign-in via deep link
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;

      // Parse the URL to check if it contains Firebase auth parameters
      const parsedUrl = Linking.parse(url);
      const { apiKey, oobCode, mode, email } = parsedUrl.queryParams || {};

      if (apiKey && oobCode) {
        const params = new URLSearchParams({
          apiKey: apiKey as string,
          oobCode: oobCode as string,
          mode: (mode as string) || 'signIn',
        });

        if (email) {
          params.append('email', email as string);
        }

        // Reconstruct the Firebase email link
        const firebaseEmailLink = `https://redi.love/auth-redirect?${params.toString()}`;

        isHandlingDeepLink.current = true;
        try {
          await signInWithEmailLink(firebaseEmailLink, email as string | undefined);

          showToast({ label: 'Signed in successfully!' });

          const profile = await getCurrentUserProfile();
          if (profile) {
            router.replace('/(auth)/(tabs)');
          } else {
            router.replace('/(auth)/create-profile');
          }
        } catch (error) {
          Alert.alert(
            'Sign In Failed',
            error instanceof Error ? error.message : 'Failed to sign in with email link'
          );
          router.replace('/home');
        } finally {
          isHandlingDeepLink.current = false;
        }
      }
    };

    // Check for initial URL when app is opened from a link.
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  // Clear badge when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground - clear badge
        clearBadgeCount();
      }
      appState.current = nextAppState;
    });

    // Also clear badge on initial mount when app opens
    clearBadgeCount();

    return () => {
      subscription.remove();
    };
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
    console.log('[Routing] useEffect triggered - user:', user?.email, 'initializing:', initializing);
    if (initializing) {
      console.log('[Routing] Still initializing, skipping redirect check');
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    /**
     * Get cached profile data if available and fresh
     */
    const getCachedProfile = async (): Promise<any | null> => {
      try {
        const cachedData = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
        if (!cachedData) return null;

        const cached: CachedProfile = JSON.parse(cachedData);
        const age = Date.now() - cached.timestamp;

        if (age < PROFILE_CACHE_DURATION_MS) {
          console.log('📦 Using cached profile (age: ${age}ms)');
          return cached.data;
        }

        console.log('🗑️  Cache expired, fetching fresh profile');
        return null;
      } catch (error) {
        console.error('Error reading profile cache:', error);
        return null;
      }
    };

    /**
     * Save profile to cache
     */
    const cacheProfile = async (profile: any): Promise<void> => {
      try {
        const cached: CachedProfile = {
          data: profile,
          timestamp: Date.now(),
        };
        await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cached));
        console.log('💾 Profile cached successfully');
      } catch (error) {
        console.error('Error caching profile:', error);
      }
    };

    const checkAndRedirect = async () => {
      if (isHandlingDeepLink.current) return;
      console.log('=== AUTH CHECK ===');
      console.log('User:', user?.email || 'No user');
      console.log('inAuthGroup:', inAuthGroup);
      console.log('segments:', segments);
      console.log('Full path:', segments.join('/'));

      try {
        if (user && !inAuthGroup) {
          // User is signed in but not in auth group
          // Check if user has a profile to determine where to redirect
          try {
            const profile = await getCurrentUserProfile();

            if (profile) {
              // User has a complete profile, go to tabs
              console.log('✅ Redirecting to tabs - user has profile');
              await cacheProfile(profile); // Cache successful fetch
              router.replace('/(auth)/(tabs)');
            } else {
              // User doesn't have a profile yet, go to create profile
              console.log('✅ Redirecting to create-profile - no profile found');
              router.replace('/(auth)/create-profile');
            }
          } catch (error: any) {
            console.error('Error checking profile:', error);

            // Differentiated error handling based on error type
            if (error instanceof APIError) {
              if (error.status === 429) {
                // Rate limited - check cache and stay in place
                console.log('⚠️  Rate limited - checking cache');
                const cachedProfile = await getCachedProfile();

                if (cachedProfile) {
                  // Have cached profile, redirect to tabs
                  console.log('✅ Using cached profile - redirecting to tabs');
                  router.replace('/(auth)/(tabs)');
                } else {
                  // No cache - show alert but don't redirect
                  console.log('❌ Rate limited with no cache - showing alert');
                  Alert.alert(
                    'Too Many Requests',
                    "Please wait a moment before trying again. We're experiencing high traffic.",
                    [{ text: 'OK' }]
                  );
                }
              } else if (error.status >= 500 && error.status < 600) {
                // Server error - check cache
                console.log('⚠️  Server error - checking cache');
                const cachedProfile = await getCachedProfile();

                if (cachedProfile) {
                  console.log('✅ Using cached profile - redirecting to tabs');
                  router.replace('/(auth)/(tabs)');
                } else {
                  console.log('❌ Server error with no cache - showing alert');
                  Alert.alert(
                    'Server Error',
                    'Unable to load your profile. Please try again later.',
                    [{ text: 'OK' }]
                  );
                }
              } else if (error.status === 404) {
                // Profile not found - redirect to create profile
                console.log(
                  '✅ Redirecting to create-profile - 404 profile not found'
                );
                router.replace('/(auth)/create-profile');
              } else {
                // Other API errors - likely profile doesn't exist
                console.log('✅ Redirecting to create-profile - other API error');
                router.replace('/(auth)/create-profile');
              }
            } else {
              // Network or other errors - check cache
              console.log('⚠️  Network/unknown error - checking cache');
              const cachedProfile = await getCachedProfile();

              if (cachedProfile) {
                console.log('✅ Using cached profile - redirecting to tabs');
                router.replace('/(auth)/(tabs)');
              } else {
                console.log(
                  '⚠️  No cached profile available - defaulting to create-profile'
                );
                Alert.alert(
                  'Connection Error',
                  'Unable to verify your profile. Please check your internet connection.',
                  [
                    {
                      text: 'Retry',
                      onPress: () => checkAndRedirect(),
                    },
                    {
                      text: 'Continue',
                      onPress: () => router.replace('/(auth)/create-profile'),
                    },
                  ]
                );
              }
            }
          }
        } else if (!user && inAuthGroup) {
          // User is not signed in but in auth group, redirect to login
          console.log('✅ Redirecting to home - no user but in auth group');
          router.replace('/home' as any);
        } else if (!user && !inAuthGroup) {
          console.log('✅ Redirecting to home - no user and not in auth group');
          router.replace('/home' as any);
        } else {
          console.log(
            'ℹ️  User authenticated and in auth group - no action needed'
          );
        }
        console.log('=== END AUTH CHECK ===\n');
      } finally {
        // Splash is hidden by destination screens (home.tsx / auth layout) on mount
      }
    };

    checkAndRedirect();
  }, [user, initializing]);


  const stack = (
    <Stack screenOptions={{ animation: 'default' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="auth-redirect" options={{ headerShown: false, animation: 'none' }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ headerShown: false, animation: 'slide_from_left' }} />
    </Stack>
  );

  return user ? (
    <NotificationsProvider>{stack}</NotificationsProvider>
  ) : (
    stack
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <MotionProvider>
          <HapticsProvider>
            <ToastProvider>
              <ProfileProvider>
                <RootNavigator />
              </ProfileProvider>
            </ToastProvider>
          </HapticsProvider>
        </MotionProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

