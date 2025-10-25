import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
      <View style={styles.timeBlockWrapper}>
        <View style={styles.timeBlock}>
          <AppText variant="title">
            {String(timeRemaining.days).padStart(2, '0')}
          </AppText>
        </View>
        <AppText color="dimmer">days</AppText>
      </View>

      <AppText style={styles.colon} variant="title">
        :
      </AppText>

      <View style={styles.timeBlockWrapper}>
        <View style={styles.timeBlock}>
          <AppText variant="title">
            {String(timeRemaining.hours).padStart(2, '0')}
          </AppText>
        </View>
        <AppText color="dimmer">hours</AppText>
      </View>

      <AppText style={styles.colon} variant="title">
        :
      </AppText>

      <View style={styles.timeBlockWrapper}>
        <View style={styles.timeBlock}>
          <AppText variant="title">
            {String(timeRemaining.minutes).padStart(2, '0')}
          </AppText>
        </View>
        <AppText color="dimmer">mins</AppText>
      </View>

      <AppText style={styles.colon} variant="title">
        :
      </AppText>

      <View style={styles.timeBlockWrapper}>
        <View style={styles.timeBlock}>
          <AppText variant="title">
            {String(timeRemaining.seconds).padStart(2, '0')}
          </AppText>
        </View>
        <AppText color="dimmer">secs</AppText>
      </View>
    </View>
  );
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  timeBlockWrapper: {
    alignItems: 'center',
    gap: 4,
  },
  timeBlock: {
    backgroundColor: AppColors.backgroundDimmer,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 32,
    width: 80,
    alignItems: 'center',
  },
  colon: {
    position: 'relative',
    top: -16,
  },
});
