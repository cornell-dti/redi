import { Bell, User } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { AppColors } from '../AppColors';
import AppText from './AppText';
import Button from './Button';

interface WeeklyMatchCardProps {
  name: string;
  age: number;
  year: string;
  major: string;
  image: string;
  onNudge?: () => void;
  onViewProfile?: () => void;
}

export default function WeeklyMatchCard({
  name,
  age,
  year,
  major,
  image,
  onNudge,
  onViewProfile,
}: WeeklyMatchCardProps) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: image }} style={styles.image} />
      <View style={styles.info}>
        <AppText variant="title" style={styles.name}>
          {name}, {age}
        </AppText>
        <AppText variant="body" color="dimmer" style={styles.details}>
          {year}
        </AppText>
        <AppText variant="body" color="dimmer" style={styles.details}>
          {major}
        </AppText>

        <View style={styles.buttonContainer}>
          <Button
            title="Nudge"
            onPress={onNudge || (() => {})}
            variant="secondary"
            iconLeft={Bell}
            style={styles.button}
          />
          <Button
            title="View Profile"
            onPress={onViewProfile || (() => {})}
            variant="primary"
            iconLeft={User}
            style={styles.button}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.backgroundDefault,
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  image: {
    width: '100%',
    height: 400,
  },
  info: {
    padding: 20,
    gap: 4,
  },
  name: {
    marginBottom: 4,
  },
  details: {
    marginBottom: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
  },
});
