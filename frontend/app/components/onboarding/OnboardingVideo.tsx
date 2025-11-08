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
  { time: 0.0, style: 'medium' }, // 3
  { time: 1.0, style: 'medium' }, // 2
  { time: 2.0, style: 'medium' }, // 1
  { time: 3.27, style: 'soft' }, // AWKWARD
  { time: 4.1, style: 'soft' }, // TIRING
  { time: 4.23, style: 'soft' }, // SCARY
  { time: 5.06, style: 'soft' }, // SHALLOW
  { time: 6.04, style: 'heavy' }, // intro...REDI
  // ---
  { time: 6.25, style: 'medium' }, // Cornell's
  { time: 7.07, style: 'medium' }, // dating
  { time: 7.17, style: 'medium' }, // app
  // --
  { time: 8.08, style: 'soft' }, // CURATED
  { time: 8.21, style: 'soft' }, // MATCHES
  { time: 9.05, style: 'soft' }, // ANONYMOUS
  { time: 9.16, style: 'soft' }, // NUDGING
  { time: 9.29, style: 'soft' }, // CORNELL
  { time: 10.13, style: 'soft' }, // EXCLUSIVE
  // --
  { time: 10.25, style: 'medium' }, // 3
  { time: 11.05, style: 'medium' }, // matches
  { time: 11.14, style: 'soft' }, // every
  { time: 11.25, style: 'soft' }, // week
  // --
  { time: 12.07, style: 'soft' }, // chats
  { time: 12.16, style: 'soft' }, // open
  { time: 12.24, style: 'soft' }, // when
  { time: 13.01, style: 'soft' }, // you
  { time: 13.08, style: 'soft' }, // both
  { time: 13.15, style: 'heavy' }, // nudge
  // --
  { time: 14.07, style: 'soft' }, // meet your next match
  { time: 15.0, style: 'soft' }, // next frame
  { time: 15.23, style: 'soft' }, // next frame
  { time: 16.15, style: 'soft' }, // next frame
  // --
  { time: 16.15, style: 'medium' }, // are
  { time: 16.22, style: 'medium' }, // you
  { time: 16.29, style: 'heavy' }, // redi
  { time: 17.07, style: 'soft' }, // ?
  { time: 19.08, style: 'soft' }, // logo
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
