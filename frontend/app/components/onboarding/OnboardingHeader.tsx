import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
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

  return (
    <View style={styles.container}>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
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
