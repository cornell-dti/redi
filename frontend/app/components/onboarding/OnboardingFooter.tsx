import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';

import { useThemeAware } from '@/app/contexts/ThemeContext';
import { ArrowRight } from 'lucide-react-native';
import { useMotion } from '../../contexts/MotionContext';
import { AppColors } from '../AppColors';
import AppText from '../ui/AppText';
import Button from '../ui/Button';
import Checkbox from '../ui/Checkbox';
import LoadingSpinner from '../ui/LoadingSpinner';

interface OnboardingFooterProps {
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  showCheckbox?: boolean;
  checkboxLabel?: string;
  checkboxChecked?: boolean;
  onCheckboxChange: (checked: boolean) => void;
  loading?: boolean;
}

export default function OnboardingFooter({
  onNext,
  nextDisabled = false,
  nextLabel = 'Next',
  showCheckbox = false,
  checkboxLabel,
  checkboxChecked = false,
  onCheckboxChange,
  loading = false,
}: OnboardingFooterProps) {
  useThemeAware(); // Force re-render when theme changes

  const { animationEnabled } = useMotion();
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (loading) {
      if (!animationEnabled) {
        // No animation - set values immediately
        slideAnim.setValue(0);
        opacityAnim.setValue(1);
      } else {
        // Slide in and fade in when loading starts
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } else {
      // Reset animation values when not loading
      slideAnim.setValue(-20);
      opacityAnim.setValue(0);
    }
  }, [loading, slideAnim, opacityAnim, animationEnabled]);

  // Animated spinner component that conforms to CustomIcon type
  const AnimatedSpinner = ({
    size = 20,
    color = AppColors.backgroundDefault,
  }: {
    size?: number;
    color?: string;
  }) => (
    <Animated.View
      style={{
        transform: [{ translateX: slideAnim }],
        opacity: opacityAnim,
      }}
    >
      <LoadingSpinner size={size} color={color} />
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {showCheckbox && checkboxLabel && onCheckboxChange && (
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => onCheckboxChange(!checkboxChecked)}
        >
          <Checkbox
            value={checkboxChecked}
            onValueChange={onCheckboxChange}
            color={checkboxChecked ? AppColors.accentDefault : undefined}
          />
          <AppText variant="body" style={styles.checkboxLabel}>
            {checkboxLabel}
          </AppText>
        </TouchableOpacity>
      )}
      <Button
        title={nextLabel}
        iconLeft={loading ? AnimatedSpinner : undefined}
        iconRight={loading ? undefined : ArrowRight}
        onPress={onNext}
        variant="primary"
        fullWidth
        disabled={nextDisabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 48,
    backgroundColor: AppColors.backgroundDefault,
    gap: 16,
  },
  checkboxRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  checkboxLabel: {
    textAlign: 'center',
  },
});
