import React from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { useMotion } from '../../contexts/MotionContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { AppColors } from '../AppColors';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export default function Toggle({ value, onValueChange }: ToggleProps) {
  const { currentTheme } = useTheme();
  const { animationEnabled } = useMotion();
  const haptic = useHapticFeedback();
  const baseTranslateX = React.useRef(new Animated.Value(value ? 24 : 0))
    .current;
  const scaleX = React.useRef(new Animated.Value(1)).current;
  const colorAnim = React.useRef(new Animated.Value(value ? 1 : 0)).current;
  const [isPressed, setIsPressed] = React.useState(false);

  const handleToggle = () => {
    haptic.medium();
    onValueChange(!value);
  };

  React.useEffect(() => {
    if (!animationEnabled) {
      baseTranslateX.setValue(value ? 24 : 0);
    } else {
      Animated.spring(baseTranslateX, {
        toValue: value ? 24 : 0,
        useNativeDriver: true,
        friction: 6,
      }).start();
    }
  }, [value, baseTranslateX, animationEnabled]);

  React.useEffect(() => {
    // Only animate press distortion when animations are enabled
    if (!animationEnabled) {
      scaleX.setValue(1);
    } else {
      Animated.spring(scaleX, {
        toValue: isPressed ? 1.3 : 1,
        useNativeDriver: true,
        friction: 5,
      }).start();
    }
  }, [isPressed, scaleX, animationEnabled]);

  React.useEffect(() => {
    // Smooth color transition
    Animated.timing(colorAnim, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false, // color animations don't support native driver
    }).start();
  }, [value, colorAnim]);

  // Calculate press offset for directional stretch
  // When OFF (left): stretch right (positive offset)
  // When ON (right): stretch left (negative offset)
  const pressOffset = scaleX.interpolate({
    inputRange: [1, 1.3],
    outputRange: [0, value ? -4.2 : 4.2],
  });

  const combinedTranslateX = Animated.add(baseTranslateX, pressOffset);

  // Interpolate background color for smooth transition
  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [AppColors.backgroundDimmest, currentTheme.accentDefault],
  });

  return (
    <Pressable
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onPress={handleToggle}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.container,
            { backgroundColor },
            pressed && styles.pressed,
          ]}
        >
          <Animated.View
            style={[
              styles.thumb,
              {
                transform: [{ translateX: combinedTranslateX }, { scaleX }],
              },
            ]}
          />
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.backgroundDimmest,
    padding: 2,
    justifyContent: 'center',
  },
  thumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.backgroundDefault,
  },
  pressed: {
    opacity: 0.8,
  },
});
