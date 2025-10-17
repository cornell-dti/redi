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
      <View style={styles.timeBlock}>
        <AppText variant="title" style={styles.timeText}>
          {String(timeRemaining.days).padStart(2, '0')}
        </AppText>
      </View>
      <AppText variant="title" style={styles.separator}>
        :
      </AppText>
      <View style={styles.timeBlock}>
        <AppText variant="title" style={styles.timeText}>
          {String(timeRemaining.hours).padStart(2, '0')}
        </AppText>
      </View>
      <AppText variant="title" style={styles.separator}>
        :
      </AppText>
      <View style={styles.timeBlock}>
        <AppText variant="title" style={styles.timeText}>
          {String(timeRemaining.minutes).padStart(2, '0')}
        </AppText>
      </View>
      <AppText variant="title" style={styles.separator}>
        :
      </AppText>
      <View style={styles.timeBlock}>
        <AppText variant="title" style={styles.timeText}>
          {String(timeRemaining.seconds).padStart(2, '0')}
        </AppText>
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
  timeBlock: {
    backgroundColor: AppColors.backgroundDimmer,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 48,
    alignItems: 'center',
  },
});
