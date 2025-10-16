import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
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
  height = 400,
  children,
  title,
}: SheetProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
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
    } else {
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
        // nothing else for now
      });
    }
  }, [visible, translateY, overlayOpacity]);

  const pan = useRef(new Animated.Value(0)).current;
  const lastPanY = useRef(0);

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
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            pan.setValue(0);
            onDismiss();
          });
          Animated.timing(overlayOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
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
      onRequestClose={onDismiss}
    >
      <View style={styles.container} pointerEvents={visible ? 'auto' : 'none'}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            // Animate the sheet down and fade the overlay, then notify parent
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
            ]).start(() => {
              onDismiss();
            });
          }}
        >
          <Animated.View
            style={[styles.overlay, { opacity: overlayOpacity }]}
          />
        </Pressable>

        <Animated.View
          style={
            [
              styles.sheet,
              { height, transform: [{ translateY: combinedTranslate }] },
            ] as any
          }
        >
          <View
            {...panResponder.panHandlers}
            style={styles.dragHandleContainer}
          >
            <View style={styles.dragHandle} />
          </View>
          <View>{title && <AppText variant="subtitle">{title}</AppText>}</View>
          <View style={styles.content}>{children}</View>
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
  content: {
    flex: 1,
    marginTop: 24,
  },
});
