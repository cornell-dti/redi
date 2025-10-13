import React, { useRef } from 'react';
import {
  Animated,
  Pressable as RNPressable,
  PressableProps,
} from 'react-native';

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

  const handlePressIn = (event: any) => {
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
