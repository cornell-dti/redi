import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppColors } from '../AppColors';
import AppText from '../ui/AppText';

interface OnboardingTitleProps {
  title: string;
  subtitle?: string;
}

export default function OnboardingTitle({
  title,
  subtitle,
}: OnboardingTitleProps) {
  return (
    <View style={styles.container}>
      <AppText variant="title" style={styles.title}>
        {title}
      </AppText>
      {subtitle && (
        <AppText
          variant="body"
          style={styles.subtitle}
        >
          {subtitle}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    color: AppColors.foregroundDimmer,
  },
});
