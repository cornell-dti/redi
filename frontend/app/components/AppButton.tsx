import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle
} from 'react-native';

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
          backgroundColor: '#FF8DBD',
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: '#F0F0F0',
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: '#FF8DBD',
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
          color: 'white',
        };
      case 'secondary':
        return {
          ...baseTextStyle,
          color: '#333',
        };
      case 'outline':
        return {
          ...baseTextStyle,
          color: '#FF8DBD',
        };
      default:
        return baseTextStyle;
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'primary':
        return 'white';
      case 'secondary':
        return '#333';
      case 'outline':
        return '#FFF8DBD';
      default:
        return '#333';
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