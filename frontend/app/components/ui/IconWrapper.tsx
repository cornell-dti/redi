import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { AppColors } from '../AppColors';

interface IconWrapperProps {
  children: React.ReactNode;
  // on white backgrounds (eg: AppColors.backgroundDefault), use 'gray' variant
  // on gray backgrounds (eg: AppColors.backgroundDimmer or AppColors.backgroundDimmest), use 'white' variant
  variant?: 'white' | 'gray';
  style?: StyleProp<ViewStyle>;
  badge?: boolean;
}

export default function IconWrapper({
  children,
  variant = 'white',
  badge = false,
  style,
}: IconWrapperProps) {
  const backgroundColor =
    variant === 'gray'
      ? AppColors.backgroundDimmer
      : AppColors.backgroundDefault;

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      {children}
      {badge && <View style={styles.badge} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: AppColors.accentDefault,
  },
});
