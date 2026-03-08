import auth from '@react-native-firebase/auth';
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

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      unsubscribe();
      if (user) return; // signed in — _layout.tsx handles routing under the splash screen
      hasShownOnboardingVideo().then((hasShown) => {
        if (hasShown) {
          router.replace('/home');
        } else {
          setShowVideo(true);
        }
      });
    });
    return unsubscribe;
  }, []);

  const handleVideoFinish = async () => {
    await markOnboardingVideoAsShown();
    setShowVideo(false);
    router.replace('/home');
  };

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
