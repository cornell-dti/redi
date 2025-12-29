import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X } from 'lucide-react-native';
import { AppColors } from '../AppColors';
import AppText from './AppText';
import { useThemeAware } from '@/app/contexts/ThemeContext';

const STORAGE_KEY = '@match_pause_banner_dismissed_date';
const TARGET_DATE = new Date('2026-01-20');

interface MatchPauseBannerProps {
  onDismiss?: () => void;
}

const MatchPauseBanner: React.FC<MatchPauseBannerProps> = ({ onDismiss }) => {
  const [visible, setVisible] = useState(false);
  useThemeAware(); // Force re-render when theme changes

  useEffect(() => {
    checkBannerVisibility();
  }, []);

  const checkBannerVisibility = async () => {
    // Get today's date normalized to midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if we're past the target date
    if (today >= TARGET_DATE) {
      setVisible(false);
      return;
    }

    // Get today's date as YYYY-MM-DD string
    const todayStr = today.toISOString().split('T')[0];

    // Check if banner was dismissed today
    try {
      const dismissedDateStr = await AsyncStorage.getItem(STORAGE_KEY);

      if (dismissedDateStr === todayStr) {
        // Dismissed today, keep hidden
        setVisible(false);
      } else {
        // Not dismissed today (or new day), show banner
        setVisible(true);
      }
    } catch (error) {
      console.error('Error checking banner dismissal state:', error);
      // On error, show banner to be safe
      setVisible(true);
    }
  };

  const handleDismiss = async () => {
    // Get today's date as YYYY-MM-DD string
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    try {
      // Store today's date
      await AsyncStorage.setItem(STORAGE_KEY, todayStr);

      // Hide banner
      setVisible(false);

      // Call optional callback
      if (onDismiss) {
        onDismiss();
      }
    } catch (error) {
      console.error('Error saving banner dismissal state:', error);
    }
  };

  // Don't render if not visible
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.banner,
          {
            backgroundColor: AppColors.accentAlpha,
            borderColor: AppColors.accentDefault,
          },
        ]}
      >
        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Dismiss banner"
        >
          <X size={20} color={AppColors.foregroundDimmer} />
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          {/* Primary message */}
          <AppText variant="body" style={styles.primaryText}>
            Matches on pause until Spring semester starts on January 20th, 2026
          </AppText>

          {/* Secondary message */}
          <AppText variant="bodySmall" color="dimmer" style={styles.secondaryText}>
            In the meantime, update your profile to make the best first impression!
          </AppText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  banner: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    padding: 4,
  },
  content: {
    paddingRight: 24, // Space for close button
  },
  primaryText: {
    fontWeight: '600',
    marginBottom: 6,
  },
  secondaryText: {
    marginBottom: 0,
  },
});

export default MatchPauseBanner;
