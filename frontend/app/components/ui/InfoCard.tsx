import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { AppColors } from '../AppColors';

interface InfoCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function InfoCard({ children, style }: InfoCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.backgroundDefault,
    borderRadius: 12,
    padding: 16,
  },
});
