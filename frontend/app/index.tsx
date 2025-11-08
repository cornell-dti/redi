import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { AppColors } from './components/AppColors';
import AppText from './components/ui/AppText';
import Button from './components/ui/Button';

export default function Index() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Animate in when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    router.push('/home');
  };

  // Note: Auth routing is handled by _layout.tsx
  // This page is only shown when user is not authenticated

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.centerContent}>
          <AppText variant="title">redi</AppText>
          <AppText variant="subtitle">cornell&apos;s first dating app</AppText>
        </View>

        <Button
          title="Get Started"
          onPress={handleGetStarted}
          variant="primary"
          fullWidth
          iconRight={ArrowRight}
        />

        <AppText variant="body" style={styles.madeByText} color="dimmer">
          Made by Incubator
        </AppText>
      </Animated.View>
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
    textAlign: 'center',
    marginTop: 24,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
