import { useThemeAware } from '@/app/contexts/ThemeContext';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import { useHaptics } from '../../contexts/HapticsContext';
import { useMotion } from '../../contexts/MotionContext';
import { AppColors } from '../AppColors';
import AppText from './AppText';

interface ToastProps {
  icon?: React.ReactNode;
  label: string;
  visible: boolean;
  duration?: number; // milliseconds
  onHide?: () => void;
}

const Toast: React.FC<ToastProps> = ({
  icon,
  label,
  visible,
  duration = 2500,
  onHide,
}) => {
  useThemeAware();
  const { animationEnabled } = useMotion();
  const { hapticsEnabled } = useHaptics();

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(
    new Animated.Value(!animationEnabled ? 6 : 40)
  ).current;
  const panY = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<number | null>(null);

  const dismissToast = () => {
    // Clear auto-hide timer if it exists
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: !animationEnabled ? 6 : 40,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      panY.setValue(0); // Reset pan value
      onHide?.();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
      onPanResponderMove: (_, gesture) => {
        // Only allow swiping down (positive dy)
        if (gesture.dy > 0) {
          panY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        // Dismiss if swiped down more than 50px or with high velocity
        if (gesture.dy > 50 || gesture.vy > 0.5) {
          dismissToast();
        } else {
          // Snap back to original position
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      // Reset pan value when showing
      panY.setValue(0);

      // Reset translateY to correct starting position based on current animationEnabled
      translateY.setValue(!animationEnabled ? 6 : 40);

      // Tic-tac haptic pattern: two light taps (only if enabled)
      if (hapticsEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 100);
      }

      // Fade in with animation support
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: !animationEnabled ? 150 : 250,
          useNativeDriver: true,
        }),
        !animationEnabled
          ? Animated.timing(translateY, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            })
          : Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
            }),
      ]).start();

      // Auto-hide after duration
      timerRef.current = setTimeout(() => {
        dismissToast();
      }, duration);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }
  }, [visible, animationEnabled, hapticsEnabled]);

  if (!visible) return null;

  const combinedTranslateY = Animated.add(translateY, panY);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        {
          backgroundColor: AppColors.accentDefault,
          opacity,
          transform: [{ translateY: combinedTranslateY }],
        },
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <AppText color="inverse">{label}</AppText>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    borderRadius: 32,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  icon: {
    marginRight: 8,
  },
});

export default Toast;
