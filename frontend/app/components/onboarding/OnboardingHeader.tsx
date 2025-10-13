import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { AppColors } from '../AppColors';
import IconButton from '../ui/IconButton';

interface OnboardingHeaderProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
}

export default function OnboardingHeader({
  currentStep,
  totalSteps,
  onBack,
}: OnboardingHeaderProps) {
  const progress = currentStep / totalSteps;
  const isFirstStep = currentStep === 1;
  const animatedWidth = useRef(new Animated.Value(progress * 100)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress * 100,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [progress, animatedWidth]);

  return (
    <View style={styles.container}>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: animatedWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>

      {!isFirstStep && (
        <IconButton icon={ChevronLeft} onPress={onBack} variant="secondary" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    padding: 16,
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: AppColors.backgroundDimmer,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: AppColors.accentDefault,
    borderRadius: 3,
  },
});
