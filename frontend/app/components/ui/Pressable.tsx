import React, { useRef } from 'react';
import {
  Animated,
  PressableProps,
  Pressable as RNPressable,
} from 'react-native';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';

interface AnimatedPressableProps extends PressableProps {
  children: React.ReactNode;
  scaleTo?: number;
}

export default function Pressable({
  children,
  scaleTo = 0.97,
  onPressIn,
  onPressOut,
  ...props
}: AnimatedPressableProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const haptic = useHapticFeedback();

  const handlePressIn = (event: any) => {
    haptic.light();
    Animated.spring(scaleAnim, {
      toValue: scaleTo,
      useNativeDriver: true,
    }).start();
    onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    onPressOut?.(event);
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <RNPressable
        {...props}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {children}
      </RNPressable>
    </Animated.View>
  );
}
