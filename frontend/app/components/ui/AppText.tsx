import React from 'react';
import { Text, TextProps } from 'react-native';
import { AppColors } from '../AppColors';
import { AppTypography } from '../AppTypography';

interface AppTextProps extends TextProps {
  variant?: 'title' | 'subtitle' | 'body' | 'bodySmall';
  color?: 'default' | 'dimmer' | 'negative' | 'inverse' | 'accent';
  indented?: boolean;
}

export default function AppText({
  variant = 'body',
  color = 'default',
  indented = false,
  style,
  ...props
}: AppTextProps) {
  const resolvedColor =
    color === 'inverse'
      ? AppColors.backgroundDefault
      : color === 'negative'
        ? AppColors.negativeDefault
        : color === 'dimmer'
          ? AppColors.foregroundDimmer
          : color === 'accent'
            ? AppColors.accentDefault
            : AppColors.foregroundDefault;

  return (
    <Text
      style={[
        AppTypography[variant],
        { color: resolvedColor },
        indented && { marginLeft: 16 },
        style,
      ]}
      {...props}
    />
  );
}
