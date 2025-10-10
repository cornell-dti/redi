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
  description?: string;
  left?: ReactNode;
  right?: ReactNode;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function ListItem({
  title,
  description,
  left,
  right,
  selected = false,
  onPress,
  style,
}: ListItemProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = React.useState(false);

  const handlePressIn = () => {
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

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: AppColors.backgroundDimmest }}
        style={({ pressed }) => [
          styles.container,
          selected && styles.selected,
          // keep original pressed styling logic; rely on pressed OR local isPressed
          (pressed || isPressed) &&
            (selected ? styles.selectedPressed : styles.pressed),
          style,
        ]}
        accessibilityRole="button"
      >
        {left ? <View style={styles.left}>{left}</View> : null}

        <View style={styles.content}>
          <AppText variant="body" color={selected ? 'inverse' : 'default'}>
            {title}
          </AppText>
          {description ? <AppText color="dimmer">{description}</AppText> : null}
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
    borderRadius: 8,
  },
  selected: {
    backgroundColor: AppColors.accentDefault,
  },
  pressed: {
    backgroundColor: AppColors.backgroundDimmest,
  },
  selectedPressed: {
    backgroundColor: AppColors.accentDefault,
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
