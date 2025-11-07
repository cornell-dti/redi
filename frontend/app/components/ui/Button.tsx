import * as Haptics from 'expo-haptics';
import { LucideIcon } from 'lucide-react-native';
import React, { useRef } from 'react';
import {
  Animated,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { AppColors } from '../AppColors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'negative';
  disabled?: boolean;
  iconLeft?: LucideIcon;
  iconRight?: LucideIcon;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  noRound?: boolean;
  dropdown?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  iconLeft,
  iconRight,
  fullWidth = false,
  style,
  textStyle,
  noRound = false,
  dropdown = false,
}: ButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = React.useState(false);

  const handlePressIn = () => {
    // Add strong haptic feedback for primary and negative variants
    if (variant === 'primary' || variant === 'negative') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: dropdown ? 'space-between' : 'center',
      borderRadius: noRound ? 6 : dropdown ? 12 : 128,
      paddingHorizontal: dropdown ? 12 : 24,
      paddingVertical: 12,
      height: 48,
      gap: 6,
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
          backgroundColor: isPressed
            ? AppColors.accentDimmer
            : AppColors.accentDefault,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: isPressed
            ? AppColors.backgroundDimmest
            : AppColors.backgroundDimmer,
        };
      case 'negative':
        return {
          ...baseStyle,
          backgroundColor: isPressed
            ? AppColors.negativeDimmer
            : AppColors.negativeDimmest,
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontSize: 16,
      fontWeight: '400',
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
      case 'negative':
        return {
          ...baseTextStyle,
          color: AppColors.negativeDefault,
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
      case 'negative':
        return AppColors.negativeDefault;
      default:
        return AppColors.foregroundDefault;
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[getButtonStyle(), style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
      >
        {iconLeft &&
          React.createElement(iconLeft, {
            size: 20,
            color: getIconColor(),
          })}
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        {iconRight &&
          React.createElement(iconRight, {
            size: 20,
            color: getIconColor(),
          })}
      </TouchableOpacity>
    </Animated.View>
  );
}
