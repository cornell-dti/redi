import AsyncStorage from '@react-native-async-storage/async-storage';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import { X } from 'lucide-react-native';
import React, { useRef } from 'react';
import { Dimensions, Modal, StyleSheet, View } from 'react-native';
import IconButton from '../ui/IconButton';

const ONBOARDING_VIDEO_SHOWN_KEY = '@onboarding_video_shown';

interface OnboardingVideoProps {
  visible: boolean;
  onFinish: () => void;
}

export default function OnboardingVideo({
  visible,
  onFinish,
}: OnboardingVideoProps) {
  const videoRef = useRef<Video>(null);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.didJustFinish) {
      // Video finished playing
      onFinish();
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
          source={require('../../../assets/videos/onboarding.mp4')}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isMuted={false}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
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
