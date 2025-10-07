import React from 'react';
import { Text, TextProps } from 'react-native';
import { AppColors } from '../AppColors';
import { AppTypography } from '../AppTypography';

interface AppTextProps extends TextProps {
  variant?: 'title' | 'subtitle' | 'body' | 'bodySmall';
  color?: 'default' | 'dimmer' | 'negative';
}

export default function AppText({
  variant = 'body',
  color = 'default',
  style,
  ...props
}: AppTextProps) {
  const resolvedColor =
    color === 'negative'
      ? AppColors.negativeDefault
      : color === 'dimmer'
        ? AppColors.foregroundDimmer
        : AppColors.foregroundDefault;

  return (
    <Text
      style={[AppTypography[variant], { color: resolvedColor }, style]}
      {...props}
    />
  );
}
