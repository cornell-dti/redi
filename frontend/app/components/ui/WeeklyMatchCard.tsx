import { Bell, Check, User } from 'lucide-react-native';
import React from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import { AppColors } from '../AppColors';
import AppText from './AppText';
import Button from './Button';
import Pressable from './Pressable';
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
      Alert.alert(
        'Connection request sent!',
        `You've sent a request to ${name}. If they connect back, you'll both get a notification!`
      );
    } catch (error: any) {
      setSheetVisible(false);
      const errorMessage = error?.message || 'Failed to send request';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Pressable
      onPress={onViewProfile || (() => {})}
      style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
    >
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
              title={nudgeSent ? 'Connected' : 'Connect'}
              onPress={() => setSheetVisible(true)}
              variant="primary"
              iconLeft={nudgeSent ? Check : Bell}
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
        <Sheet
          visible={isSheetVisible}
          onDismiss={() => !isSending && setSheetVisible(false)}
          title="Send Connection Request"
        >
          <View style={styles.sheetContent}>
            {!nudgeSent && (
              <AppText>Are you sure you want to connect with {name}?</AppText>
            )}

            <AppText>
              {nudgeSent
                ? `You've already sent a request to ${name}.`
                : "They won't know you sent a request unless they connect back. If both of you connect, you'll both get a notification and can start chatting!"}
            </AppText>

            <View style={styles.buttonRow}>
              {!nudgeSent && (
                <Button
                  title={isSending ? 'Sending...' : 'Connect'}
                  onPress={handleNudgeConfirm}
                  iconLeft={Bell}
                  fullWidth
                  disabled={isSending}
                  soundEffect={require('@/assets/sounds/nudge.mp3')}
                />
              )}
              <Button
                title={nudgeSent ? 'Close' : 'Never mind'}
                onPress={() => setSheetVisible(false)}
                variant="secondary"
                fullWidth
                disabled={isSending}
              />
            </View>
          </View>
        </Sheet>
      </View>
    </Pressable>
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
    flex: 1,
    width: '100%',
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
    flex: 1,
    // width: '50%',
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
