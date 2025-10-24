import { Bell, BellOff, User } from 'lucide-react-native';
import React from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
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
  onNudge?: () => Promise<void>;
  onViewProfile?: () => void;
  nudgeSent?: boolean;
  nudgeDisabled?: boolean;
}

export default function WeeklyMatchCard({
  name,
  age,
  year,
  major,
  image,
  onNudge,
  onViewProfile,
  nudgeSent = false,
  nudgeDisabled = false,
}: WeeklyMatchCardProps) {
  const [isSheetVisible, setSheetVisible] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);

  const handleNudgeConfirm = async () => {
    if (!onNudge) return;

    try {
      setIsSending(true);
      await onNudge();
      setSheetVisible(false);
      Alert.alert('Nudge sent!', `You've nudged ${name}. If they nudge you back, you'll both get a notification!`);
    } catch (error: any) {
      setSheetVisible(false);
      const errorMessage = error?.message || 'Failed to send nudge';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSending(false);
    }
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
            title={nudgeSent ? 'Nudged' : 'Nudge'}
            onPress={() => setSheetVisible(true)}
            variant="primary"
            iconLeft={nudgeSent ? BellOff : Bell}
            fullWidth
            disabled={nudgeSent || nudgeDisabled}
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
      <Sheet visible={isSheetVisible} onDismiss={() => !isSending && setSheetVisible(false)}>
        <View style={styles.sheetContent}>
          <AppText>Are you sure you want to nudge {name}?</AppText>
          <AppText variant="bodySmall" color="dimmer">
            {nudgeSent
              ? "You've already nudged this person."
              : "They won't know you nudged them unless they nudge you back. If both of you nudge each other, you'll both get a notification!"}
          </AppText>

          <View style={styles.buttonRow}>
            {!nudgeSent && (
              <Button
                title={isSending ? "Sending..." : "Nudge"}
                onPress={handleNudgeConfirm}
                iconLeft={Bell}
                fullWidth
                disabled={isSending}
              />
            )}
            <Button
              title={nudgeSent ? "Close" : "Never mind"}
              onPress={() => setSheetVisible(false)}
              variant="secondary"
              fullWidth
              disabled={isSending}
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
