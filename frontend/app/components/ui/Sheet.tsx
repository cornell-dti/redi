import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AppColors } from '../AppColors';
import AppText from './AppText';

type SheetProps = {
  visible: boolean;
  onDismiss: () => void;
  height?: number | string;
  children?: React.ReactNode;
  title?: string;
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function Sheet({
  visible,
  onDismiss,
  height,
  children,
  title,
}: SheetProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const isAnimatingRef = useRef(false);

  // Helper function to handle dismiss with animation
  const handleDismiss = () => {
    if (isAnimatingRef.current) return; // Prevent multiple simultaneous dismiss animations

    isAnimatingRef.current = true;
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      isAnimatingRef.current = false;
      if (finished) {
        onDismiss();
      }
    });
  };

  useEffect(() => {
    if (visible) {
      // Reset animated values to starting position
      translateY.setValue(SCREEN_HEIGHT);
      overlayOpacity.setValue(0);
      isAnimatingRef.current = false;

      // Haptic pattern synced with sheet bounce animation
      // Initial impact when sheet starts sliding in
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Lighter tap to match the bounce settle (~200ms matches spring timing)
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 200);

      // Use a spring for a subtle bounce on open
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          // bounciness gives a small overshoot/bounce; keep it subtle
          bounciness: 6,
          speed: 12,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, overlayOpacity]);

  const pan = useRef(new Animated.Value(0)).current;
  const lastPanY = useRef(0);

  // PanResponder only for the drag handle area
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
      onPanResponderGrant: () => {
        pan.setOffset(lastPanY.current);
        pan.setValue(0);
      },
      onPanResponderMove: (_, gesture) => {
        const dy = Math.max(gesture.dy, 0); // only drag down
        pan.setValue(dy);
      },
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        lastPanY.current = 0;
        const shouldDismiss = gesture.dy > 100 || gesture.vy > 0.8;
        if (shouldDismiss) {
          pan.setValue(0);
          handleDismiss();
        } else {
          Animated.timing(pan, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const combinedTranslate = Animated.add(translateY, pan);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <View style={styles.container} pointerEvents={visible ? 'auto' : 'none'}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss}>
          <Animated.View
            style={[styles.overlay, { opacity: overlayOpacity }]}
          />
        </Pressable>

        <Animated.View
          style={
            [
              styles.sheet,
              height && height !== 'auto' && { height },
              { transform: [{ translateY: combinedTranslate }] },
            ] as any
          }
        >
          <View
            {...panResponder.panHandlers}
            style={styles.dragHandleContainer}
          >
            <View style={styles.dragHandle} />
          </View>
          <View style={styles.titleContainer}>
            {title && <AppText variant="subtitle">{title}</AppText>}
          </View>
          <ScrollView
            style={[
              height && height !== 'auto'
                ? styles.scrollContent
                : styles.scrollContentAuto,
            ]}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
    backgroundColor: AppColors.foregroundDefault,
  },
  sheet: {
    backgroundColor: AppColors.backgroundDefault,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 48,
    borderBottomRightRadius: 48,
    padding: 16,
    paddingTop: 8,
    overflow: 'scroll',
    margin: 8,
    maxHeight: 800,
  },
  dragHandleContainer: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dragHandle: {
    width: 64,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e0e0e0',
  },
  titleContainer: {
    marginBottom: 8,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentAuto: {
    maxHeight: 600,
  },
  content: {
    paddingBottom: 24,
  },
});
