import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { AppColors } from '../AppColors';
import AppText from './AppText';

interface CountdownTimerProps {
  targetDate: Date;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeRemaining(targetDate: Date): TimeRemaining {
  const now = new Date();
  const difference = targetDate.getTime() - now.getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  timeUnitGroup: {
    alignItems: 'center',
    gap: 4,
  },
  flipDigitWrapper: {
    position: 'relative',
  },
  flipCard: {
    backgroundColor: AppColors.foregroundDefault,
    borderRadius: 12,
    minWidth: 80,
    height: 100,
    position: 'relative',
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  flipCardNumberContainerTop: {
    position: 'absolute',
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
    height: 100,
    width: '100%',
  },
  flipCardNumberContainerBottom: {
    position: 'absolute',
    top: -50,
    justifyContent: 'center',
    alignItems: 'center',
    height: 100,
    width: '100%',
  },
  flipCardTopStatic: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: AppColors.foregroundDefault,
    overflow: 'hidden',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    opacity: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  flipCardBottomStatic: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: AppColors.foregroundDefault,
    overflow: 'hidden',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  flipCardTopAnimated: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: AppColors.foregroundDefault,
    overflow: 'hidden',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    transformOrigin: 'bottom',
  },
  flipCardFullAnimated: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: AppColors.foregroundDefault,
    borderRadius: 12,
    transformOrigin: 'center',
    zIndex: 5,
  },
  flipCardNumberContainerFull: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 100,
    width: '100%',
  },
  flipCardNegativeSpace: {
    position: 'absolute',
    top: '43%',
    backgroundColor: '#ECECEC',
    left: -4,
    width: 8,
    height: 16,
    zIndex: 100,
    elevation: 20,
  },
  flipCardNegativeSpaceRight: {
    position: 'absolute',
    top: '43%',
    backgroundColor: '#ECECEC',
    right: -4,
    width: 8,
    height: 16,
    zIndex: 100,
    elevation: 20,
  },
  flipCardDivider: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
  },
  colonWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 28,
  },
});

// Component for a single flip digit showing full value with flip animation
function FlipDigit({ value }: { value: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  const flipAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (value !== displayValue) {
      // Start flip animation immediately when value changes
      Animated.timing(flipAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        // After animation, reset and update display value
        flipAnimation.setValue(0);
        setDisplayValue(value);
      });
    }
  }, [value, displayValue, flipAnimation]);

  // Interpolate rotation for full flip (0deg to -180deg)
  const flipRotation = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-180deg'],
  });

  // Top half reveals new number as flip progresses (first half of animation)
  const topStaticOpacity = flipAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 1],
  });

  // Bottom half stays visible (showing old value until displayValue updates)
  const bottomStaticOpacity = 1;

  // Interpolate scale for more exaggerated flip
  const flipScaleY = flipAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.2, 1],
  });

  // Add brightness to flipping card for visibility
  const flipBrightness = flipAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1, 1],
  });

  // Hide text on back of flipping card (after 90 degrees)
  const flipTextOpacity = flipAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.6, 0],
  });

  return (
    <View style={styles.flipCard}>
      {/* Top Half - Static (shows new value, revealed as animation progresses) */}
      <Animated.View
        style={[styles.flipCardTopStatic, { opacity: topStaticOpacity }]}
      >
        <View style={styles.flipCardNumberContainerTop}>
          <AppText variant="title" color="inverse">
            {value}
          </AppText>
        </View>
      </Animated.View>

      {/* Bottom Half - Static (shows new value, hidden until flip completes) */}
      <Animated.View
        style={[styles.flipCardBottomStatic, { opacity: bottomStaticOpacity }]}
      >
        <View style={styles.flipCardNumberContainerBottom}>
          <AppText variant="title" color="inverse">
            {displayValue}
          </AppText>
        </View>
      </Animated.View>

      {/* Animated Full Card - Flips down from middle (shows old value) */}
      <Animated.View
        style={[
          styles.flipCardFullAnimated,
          {
            transform: [
              { perspective: 600 },
              { rotateX: flipRotation },
              { scaleY: flipScaleY },
            ],
            opacity: flipBrightness,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.flipCardNumberContainerFull,
            {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              opacity: flipTextOpacity,
            },
          ]}
        >
          <AppText variant="title" color="inverse">
            {displayValue}
          </AppText>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// Component for a time unit group
function TimeUnitGroup({ value, label }: { value: number; label: string }) {
  const displayValue = String(value).padStart(2, '0');

  return (
    <View style={styles.timeUnitGroup}>
      <View style={styles.flipDigitWrapper}>
        <FlipDigit value={displayValue} />
        {/* Negative space elements - positioned absolutely on top */}
        <View style={styles.flipCardNegativeSpace} />
        <View style={styles.flipCardNegativeSpaceRight} />
      </View>
      <AppText color="dimmer">{label}</AppText>
    </View>
  );
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(
    calculateTimeRemaining(targetDate)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(targetDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <View style={styles.container}>
      <TimeUnitGroup value={timeRemaining.days} label="day" />

      <View style={styles.colonWrapper}>
        <AppText variant="title">:</AppText>
      </View>

      <TimeUnitGroup value={timeRemaining.hours} label="hours" />

      <View style={styles.colonWrapper}>
        <AppText variant="title">:</AppText>
      </View>

      <TimeUnitGroup value={timeRemaining.minutes} label="mins" />

      <View style={styles.colonWrapper}>
        <AppText variant="title">:</AppText>
      </View>

      <TimeUnitGroup value={timeRemaining.seconds} label="secs" />
    </View>
  );
}
