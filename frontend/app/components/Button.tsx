import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { AppColors } from './AppColors';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  icon?: string;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  icon,
  fullWidth = false,
  style,
  textStyle,
}: AppButtonProps) {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      paddingHorizontal: size === 'small' ? 16 : size === 'large' ? 24 : 20,
      paddingVertical: size === 'small' ? 8 : size === 'large' ? 16 : 12,
      gap: 8,
    };

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    if (disabled) {
      baseStyle.opacity = 0.5;
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: AppColors.accentDefault,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: AppColors.backgroundDimmer,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: AppColors.backgroundDefault,
          borderWidth: 1,
          borderColor: AppColors.accentDefault,
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
      fontWeight: '600',
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseTextStyle,
          color: AppColors.backgroundDefault,
        };
      case 'secondary':
        return {
          ...baseTextStyle,
          color: AppColors.foregroundDefault,
        };
      case 'outline':
        return {
          ...baseTextStyle,
          color: AppColors.accentDefault,
        };
      default:
        return baseTextStyle;
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'primary':
        return AppColors.backgroundDefault;
      case 'secondary':
        return AppColors.foregroundDefault;
      case 'outline':
        return AppColors.accentDefault;
      default:
        return AppColors.foregroundDefault;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {icon && (
        <MaterialIcons
          name={icon as any}
          size={size === 'small' ? 16 : size === 'large' ? 20 : 18}
          color={getIconColor()}
        />
      )}
      <Text style={[getTextStyle(), textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}
