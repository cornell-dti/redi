import * as Haptics from 'expo-haptics';
import { LucideIcon } from 'lucide-react-native';
import React, { useRef } from 'react';
import { Animated, TouchableOpacity, ViewStyle } from 'react-native';
import { AppColors } from '../AppColors';

interface IconButtonProps {
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'negative' | 'transparent';
  disabled?: boolean;
  size?: number | 'small' | 'default';
  style?: ViewStyle;
  icon?: LucideIcon;
  noRound?: boolean;
}

export default function IconButton({
  onPress,
  variant = 'primary',
  disabled = false,
  size = 'default',
  style,
  icon,
  children,
  noRound,
}: React.PropsWithChildren<IconButtonProps>) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = React.useState(false);

  const handlePressIn = () => {
    // Add strong haptic feedback for primary and negative variants
    if (variant === 'primary' || variant === 'negative') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

  const resolvedSize =
    size === 'small' ? 32 : typeof size === 'number' ? size : 48;

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: noRound ? 4 : 128,
      height: resolvedSize,
      width: resolvedSize,
    };

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
      case 'transparent':
        return {
          ...baseStyle,
          backgroundColor: isPressed
            ? AppColors.backgroundDimmer
            : AppColors.backgroundDefault,
        };
      default:
        return baseStyle;
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

  const iconSize = resolvedSize * 0.5; // scale icon relative to button

  // If an `icon` prop is provided, prefer it; otherwise expect children to be a LucideIcon component
  const IconComp = icon ?? (children as unknown as LucideIcon | undefined);

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
        {IconComp &&
          React.createElement(IconComp as LucideIcon, {
            size: iconSize,
            color: getIconColor(),
          })}
      </TouchableOpacity>
    </Animated.View>
  );
}
