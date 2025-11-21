import * as Haptics from 'expo-haptics';
import { useHaptics } from '../contexts/HapticsContext';

/**
 * Hook that provides haptic feedback functions that automatically respect
 * the user's haptics preference setting.
 *
 * @returns Object with haptic trigger functions (light, medium, heavy, soft, rigid)
 *
 * @example
 * const haptic = useHapticFeedback();
 * haptic.medium(); // Only triggers if user has haptics enabled
 */
export function useHapticFeedback() {
  const { hapticsEnabled } = useHaptics();

  return {
    /**
     * Trigger a light impact haptic feedback
     */
    light: () => {
      if (hapticsEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },

    /**
     * Trigger a medium impact haptic feedback
     */
    medium: () => {
      if (hapticsEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    },

    /**
     * Trigger a heavy impact haptic feedback
     */
    heavy: () => {
      if (hapticsEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    },

    /**
     * Trigger a soft impact haptic feedback
     */
    soft: () => {
      if (hapticsEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      }
    },

    /**
     * Trigger a rigid impact haptic feedback
     */
    rigid: () => {
      if (hapticsEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
      }
    },
  };
}
