import { LucideIcon } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { AppColors } from '../AppColors';
import AppText from './AppText';

interface EmptyStateProps {
  icon: LucideIcon;
  label: string;
  children?: React.ReactNode;
  triggerAnimation?: number;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  label,
  children,
  triggerAnimation,
}) => {
  const scaleAnim1 = useRef(new Animated.Value(0)).current;
  const scaleAnim2 = useRef(new Animated.Value(0)).current;
  const scaleAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset animations to initial state
    scaleAnim1.setValue(0);
    scaleAnim2.setValue(0);
    scaleAnim3.setValue(0);

    const createBounceAnimation = (
      animValue: Animated.Value,
      delay: number
    ) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.spring(animValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 5,
        }),
        Animated.spring(animValue, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 7,
        }),
      ]);
    };

    Animated.parallel([
      createBounceAnimation(scaleAnim1, 0),
      createBounceAnimation(scaleAnim2, 80),
      createBounceAnimation(scaleAnim3, 160),
    ]).start();
  }, [triggerAnimation]);

  const translateY1 = scaleAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });
  const scale1 = scaleAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const translateY2 = scaleAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });
  const scale2 = scaleAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const translateY3 = scaleAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });
  const scale3 = scaleAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  return (
    <View style={styles.container}>
      <View style={styles.iconRow}>
        <Animated.View
          style={{
            transform: [{ translateY: translateY1 }, { scale: scale1 }],
          }}
        >
          <Icon size={24} color={AppColors.foregroundDimmer} />
        </Animated.View>
        <Animated.View
          style={{
            transform: [{ translateY: translateY2 }, { scale: scale2 }],
          }}
        >
          <Icon size={32} color={AppColors.foregroundDimmer} />
        </Animated.View>
        <Animated.View
          style={{
            transform: [{ translateY: translateY3 }, { scale: scale3 }],
          }}
        >
          <Icon size={24} color={AppColors.foregroundDimmer} />
        </Animated.View>
      </View>
      <AppText variant="body" color="dimmer" centered style={styles.label}>
        {label}
      </AppText>
      {children && children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    gap: 24,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: { maxWidth: 300 },
});

export default EmptyState;
