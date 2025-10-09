// _layout.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { onAuthStateChanged } from './api/authService';

export default function RootLayout() {
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
    return unsubscribe; // Clean up subscription on unmount
  }, []);

  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === '(auth)';

    const checkAndRedirect = async () => {
      if (user && !inAuthGroup) {
        // User is signed in but not in auth group
        // Check onboarding status to determine where to redirect
        const onboardingComplete = await AsyncStorage.getItem('onboarding_complete');

        if (onboardingComplete === 'true') {
          // User has completed onboarding, go to tabs
          router.replace('/(auth)/(tabs)');
        } else {
          // User hasn't completed onboarding, go to create profile
          router.replace('/(auth)/create-profile');
        }
      } else if (!user && inAuthGroup) {
        // User is not signed in but in auth group, redirect to login
        router.replace('/');
      }
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
    </Stack>
  );
}

const styles = {
  loadingContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flex: 1,
  },
};
