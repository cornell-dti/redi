import AsyncStorage from '@react-native-async-storage/async-storage';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { X } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Dimensions, Modal, StyleSheet, View } from 'react-native';
import IconButton from '../ui/IconButton';

const ONBOARDING_VIDEO_SHOWN_KEY = '@onboarding_video_shown';

// Haptic timeline - customize these timestamps to match your video!
// Format: { time: seconds, style: 'light' | 'medium' | 'heavy' | 'soft' | 'rigid' }
type HapticStyle = 'light' | 'medium' | 'heavy' | 'soft' | 'rigid';

const HAPTIC_TIMELINE: { time: number; style: HapticStyle }[] = [
  { time: 0.01, style: 'rigid' }, // Very start
  { time: 0.99, style: 'rigid' }, // First major beat
  { time: 1.99, style: 'rigid' }, // Second major beat

  // MIDDLE (3-13s): 17 NEW soft background beats 🆕
  { time: 3.0, style: 'soft' },
  { time: 3.608, style: 'soft' },
  { time: 4.216, style: 'soft' },
  // ... continues every 0.608 seconds (99 BPM)
  { time: 12.728, style: 'soft' },

  // Finale section (14-20s) - Intense beats
  { time: 13.15, style: 'rigid' }, // NUDGE
  { time: 13.77, style: 'medium' }, // Build-up
  { time: 14.12, style: 'heavy' }, // STRONGEST beat in entire audio
  { time: 14.66, style: 'medium' },
  { time: 15.58, style: 'medium' },
  { time: 16.11, style: 'heavy' }, // Major beat
  { time: 16.47, style: 'medium' },
  { time: 17.01, style: 'heavy' }, // Major beat
  { time: 17.56, style: 'medium' },
  { time: 18.46, style: 'heavy' }, // Major beat
  { time: 18.73, style: 'medium' },
  { time: 19.01, style: 'medium' },
  { time: 19.37, style: 'medium' },
  { time: 19.9, style: 'medium' }, // Final beat
];

interface OnboardingVideoProps {
  visible: boolean;
  onFinish: () => void;
}

export default function OnboardingVideo({
  visible,
  onFinish,
}: OnboardingVideoProps) {
  const videoRef = useRef<Video>(null);
  const triggeredHapticsRef = useRef<Set<number>>(new Set());

  // Reset triggered haptics when video becomes visible (for replay scenarios)
  useEffect(() => {
    if (visible) {
      triggeredHapticsRef.current.clear();
    }
  }, [visible]);

  const triggerHapticForTime = (currentTime: number) => {
    HAPTIC_TIMELINE.forEach((haptic, index) => {
      // Tighter tolerance for precise timing: 150ms window (reduced from 500ms)
      // This ensures fast sequences like 4.1, 4.23 (130ms apart) trigger correctly
      const tolerance = 0.15; // 150ms window

      if (
        currentTime >= haptic.time &&
        currentTime < haptic.time + tolerance &&
        !triggeredHapticsRef.current.has(index)
      ) {
        // Mark as triggered
        triggeredHapticsRef.current.add(index);

        // Trigger the haptic immediately
        switch (haptic.style) {
          case 'light':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          case 'medium':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
          case 'heavy':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            break;
          case 'soft':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
            break;
          case 'rigid':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
            break;
        }
      }
    });
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      // Trigger haptics based on current playback position
      if (status.isPlaying && status.positionMillis) {
        const currentTimeSeconds = status.positionMillis / 1000;
        triggerHapticForTime(currentTimeSeconds);
      }

      // Video finished playing
      if (status.didJustFinish) {
        // Reset triggered haptics for next playback
        triggeredHapticsRef.current.clear();
        onFinish();
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        <Video
          ref={videoRef}
          source={require('../../../assets/videos/onboarding.mov')}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isMuted={false}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          progressUpdateIntervalMillis={100} // Check every 100ms for precise timing
        />
        <View style={styles.closeButtonContainer}>
          <IconButton
            icon={X}
            onPress={onFinish}
            variant="secondary"
            style={styles.closeButton}
          />
        </View>
      </View>
    </Modal>
  );
}

/**
 * Check if the onboarding video has been shown before
 */
export async function hasShownOnboardingVideo(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_VIDEO_SHOWN_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking onboarding video status:', error);
    return false;
  }
}

/**
 * Mark the onboarding video as shown
 */
export async function markOnboardingVideoAsShown(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_VIDEO_SHOWN_KEY, 'true');
  } catch (error) {
    console.error('Error marking onboarding video as shown:', error);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
  },
  closeButton: {
    opacity: 0.5,
  },
});
