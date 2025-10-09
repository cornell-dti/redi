import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { getCurrentUser } from './api/authService';
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
          // User is authenticated, check onboarding status
          const onboardingComplete = await AsyncStorage.getItem('onboarding_complete');
          
          if (onboardingComplete === 'true') {
            // User has completed onboarding, go to main app
            router.replace('/(auth)/(tabs)');
          } else {
            // User hasn't completed onboarding, go to create profile
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
    router.push('/(auth)/home');
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
          <AppText variant="title" style={styles.logo}>
            redi
          </AppText>
          <AppText variant="subtitle" style={styles.subtitle}>
            cornell&apos;s first dating app
          </AppText>
        </View>

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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 64,
    fontWeight: '700',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: AppColors.foregroundDimmer,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.backgroundDefault,
  },
});