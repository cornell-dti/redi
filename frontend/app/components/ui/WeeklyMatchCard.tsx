import { Bell, User } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { AppColors } from '../AppColors';
import AppText from './AppText';
import Button from './Button';
import Sheet from './Sheet';

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
  const [isSheetVisible, setSheetVisible] = React.useState(false);

  const handleNudge = () => {
    setSheetVisible(true);
    if (onNudge) onNudge();
  };

  return (
    <View style={styles.card}>
      <View style={styles.overlay} />
      <Image source={{ uri: image }} style={styles.image} />
      <View style={styles.info}>
        <View style={styles.text}>
          <AppText variant="title" style={styles.name} color="inverse">
            {name},
          </AppText>
          <AppText variant="body" color="inverse" style={styles.details}>
            {age}, {year}, {major}
          </AppText>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Nudge"
            onPress={handleNudge}
            variant="primary"
            iconLeft={Bell}
            fullWidth
          />
          <Button
            title="View Profile"
            onPress={onViewProfile || (() => {})}
            variant="secondary"
            iconLeft={User}
            fullWidth
          />
        </View>
      </View>
      <Sheet visible={isSheetVisible} onDismiss={() => setSheetVisible(false)}>
        <View style={styles.sheetContent}>
          <AppText>Are you sure you want to nudge {name}?</AppText>

          <View style={styles.buttonRow}>
            <Button
              title="Nudge"
              onPress={() => {
                setSheetVisible(false);
                if (onNudge) onNudge();
              }}
              iconLeft={Bell}
              fullWidth
            />
            <Button
              title="Never mind"
              onPress={() => setSheetVisible(false)}
              variant="secondary"
              fullWidth
            />
          </View>
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.backgroundDefault,
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 600,
  },
  info: {
    padding: 16,
    bottom: 0,
    left: 0,
    position: 'absolute',
    zIndex: 5,
    gap: 16,
  },
  name: {
    marginBottom: 4,
  },
  details: {
    marginBottom: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    width: '55%',
  },
  text: {
    gap: 4,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // subtle dark tint as fallback; for a smooth gradient replace this View with a LinearGradient component
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    padding: 16,
    zIndex: 2,
  },
  sheetContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  buttonRow: {
    display: 'flex',
    gap: 12,
  },
});
