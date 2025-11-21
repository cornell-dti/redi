import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useMotion } from '../../contexts/MotionContext';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { AppColors } from '../AppColors';
import AppText from './AppText';

type SheetProps = {
  visible: boolean;
  onDismiss: () => void;
  height?: number | string;
  children?: React.ReactNode;
  title?: string;
  bottomRound?: boolean;
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function Sheet({
  visible,
  onDismiss,
  height,
  children,
  title,
  bottomRound = true,
}: SheetProps) {
  const { animationEnabled } = useMotion();
  const haptic = useHapticFeedback();
  const translateY = useRef(
    new Animated.Value(!animationEnabled ? 8 : SCREEN_HEIGHT)
  ).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const isAnimatingRef = useRef(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Helper function to handle dismiss with animation
  const handleDismiss = () => {
    if (isAnimatingRef.current) return; // Prevent multiple simultaneous dismiss animations

    isAnimatingRef.current = true;
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: !animationEnabled ? 8 : SCREEN_HEIGHT,
        duration: !animationEnabled ? 150 : 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: !animationEnabled ? 150 : 250,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      isAnimatingRef.current = false;
      if (finished) {
        onDismiss();
      }
    });
  };

  // Keyboard listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      // Reset animated values to starting position
      translateY.setValue(!animationEnabled ? 8 : SCREEN_HEIGHT);
      overlayOpacity.setValue(0);
      isAnimatingRef.current = false;

      // Haptic pattern synced with sheet bounce animation
      // Initial impact when sheet starts sliding in
      haptic.medium();

      // Lighter tap to match the bounce settle (~200ms matches spring timing)
      setTimeout(() => {
        haptic.light();
      }, 200);

      // Use animation or spring based on preference
      Animated.parallel([
        !animationEnabled
          ? Animated.timing(translateY, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            })
          : Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              // bounciness gives a small overshoot/bounce; keep it subtle
              bounciness: 6,
              speed: 12,
            }),
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: !animationEnabled ? 150 : 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset keyboard height when sheet closes
      setKeyboardHeight(0);
    }
  }, [visible, translateY, overlayOpacity, animationEnabled, haptic]);

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

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Animated.View
            style={
              [
                styles.sheet,
                height && height !== 'auto' && { height },
                {
                  borderBottomLeftRadius: bottomRound ? 48 : 24,
                  borderBottomRightRadius: bottomRound ? 48 : 24,
                  transform: [{ translateY: combinedTranslate }],
                  marginBottom: keyboardHeight + 16,
                },
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
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          </Animated.View>
        </TouchableWithoutFeedback>
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
