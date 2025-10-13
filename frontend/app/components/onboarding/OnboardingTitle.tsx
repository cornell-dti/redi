import React from 'react';
import { StyleSheet, View } from 'react-native';
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
      <AppText variant="title">{title}</AppText>
      {subtitle && <AppText variant="body">{subtitle}</AppText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
  },
});
