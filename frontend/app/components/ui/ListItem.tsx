import * as Haptics from 'expo-haptics';
import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { AppColors } from '../AppColors';
import AppText from './AppText';

type ReactNode = React.ReactNode;

interface ListItemProps {
  title: string;
  description?: string | ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  destructive?: boolean;
  disabled?: boolean;
}

export default function ListItem({
  title,
  description,
  left,
  right,
  selected = false,
  onPress,
  style,
  destructive,
  disabled = false,
}: ListItemProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = React.useState(false);

  const handlePressIn = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={disabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: AppColors.backgroundDimmest }}
        style={({ pressed }) => [
          styles.container,
          selected && { backgroundColor: AppColors.accentAlpha },

          // 🔹 pressed or isPressed logic
          (pressed || isPressed) &&
            (selected
              ? { backgroundColor: AppColors.accentAlpha }
              : destructive
                ? { backgroundColor: AppColors.negativeDimmest } // 🔸 if destructive & pressed
                : styles.pressed),

          description ? { height: 'auto' } : { height: 54 },
          disabled && { opacity: 0.4 },
          style,
        ]}
        accessibilityRole="button"
        disabled={disabled}
      >
        {left ? <View style={styles.left}>{left}</View> : null}

        <View style={styles.content}>
          <AppText
            variant="body"
            color={destructive ? 'negative' : selected ? 'accent' : 'default'}
            style={description ? { fontWeight: 'semibold' } : undefined}
          >
            {title}
          </AppText>
          {description ? (
            typeof description === 'string' ? (
              <AppText color="dimmer">{description}</AppText>
            ) : (
              description
            )
          ) : null}
        </View>

        {right ? <View style={styles.right}>{right}</View> : null}
      </Pressable>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: AppColors.backgroundDimmer,
    borderRadius: 6,
  },
  pressed: {
    backgroundColor: AppColors.backgroundDimmest,
  },
  left: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  description: {
    marginTop: 0,
  },
});
