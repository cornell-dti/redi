import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { getCurrentUser } from './api/authService';
import { getCurrentUserProfile } from './api/profileApi';
import { AppColors } from './components/AppColors';
import AppText from './components/ui/AppText';
import Button from './components/ui/Button';

export default function Index() {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const user = getCurrentUser();

        if (user) {
          // User is authenticated, check if they have a profile
          const profile = await getCurrentUserProfile();

          if (profile) {
            // User has a complete profile, go to main app
            router.replace('/(auth)/(tabs)');
          } else {
            // User doesn't have a profile yet, go to create profile
            router.replace('/(auth)/create-profile');
          }
        } else {
          // User is not authenticated, show the landing page
          setIsChecking(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsChecking(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleGetStarted = () => {
    router.push('/home');
  };

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.accentDefault} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.centerContent}>
          <AppText variant="title">redi</AppText>
          <AppText variant="subtitle">cornell&apos;s first dating app</AppText>
        </View>
        <AppText variant="body" style={styles.madeByText}>
          Made by Incubator
        </AppText>
        <Button
          title="Get Started"
          onPress={handleGetStarted}
          variant="primary"
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingVertical: 80,
  },
  madeByText: {
    textAlign: 'center' as const,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.backgroundDefault,
  },
});
