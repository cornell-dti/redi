import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppColors } from './components/AppColors';
import OnboardingVideo, {
  hasShownOnboardingVideo,
  markOnboardingVideoAsShown,
} from './components/onboarding/OnboardingVideo';

export default function Index() {
  const [showVideo, setShowVideo] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkVideoStatus();
  }, []);

  const checkVideoStatus = async () => {
    try {
      const hasShown = await hasShownOnboardingVideo();

      if (hasShown) {
        // Skip video, go directly to home
        // Don't set isChecking to false - keep loading state while navigating
        router.replace('/home');
      } else {
        // Show video for first time
        setShowVideo(true);
        setIsChecking(false);
      }
    } catch (error) {
      console.error('Error checking video status:', error);
      // On error, show video to be safe
      setShowVideo(true);
      setIsChecking(false);
    }
  };

  const handleVideoFinish = async () => {
    try {
      // Mark video as seen
      await markOnboardingVideoAsShown();
    } catch (error) {
      console.error('Error saving video status:', error);
    }

    setShowVideo(false);
    // Navigate to home screen where the splash and auth will be
    router.replace('/home');
  };

  // Note: Auth routing is handled by _layout.tsx
  // This page is only shown when user is not authenticated

  if (isChecking) {
    // Return empty view while checking
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      {showVideo && <OnboardingVideo visible={showVideo} onFinish={handleVideoFinish} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
  },
});
