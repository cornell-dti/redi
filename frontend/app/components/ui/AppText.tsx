import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { AppTypography } from '../AppTypography';
import { AppColors } from '../AppColors';

interface AppTextProps extends TextProps {
  variant?: 'title' | 'subtitle' | 'body' | 'bodySmall';
  color?: string;
}

export default function AppText({
  variant = 'body',
  color = AppColors.foregroundDefault,
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      style={[
        AppTypography[variant],
        { color },
        style,
      ]}
      {...props}
    />
  );
}