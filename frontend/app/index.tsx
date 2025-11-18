import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppColors } from './components/AppColors';
import OnboardingVideo from './components/onboarding/OnboardingVideo';

export default function Index() {
  const [showVideo, setShowVideo] = useState(true);

  const handleVideoFinish = () => {
    setShowVideo(false);
    // Navigate to home screen where the splash and auth will be
    router.replace('/home');
  };

  // Note: Auth routing is handled by _layout.tsx
  // This page is only shown when user is not authenticated

  return (
    <View style={styles.container}>
      <OnboardingVideo visible={showVideo} onFinish={handleVideoFinish} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
  },
});
