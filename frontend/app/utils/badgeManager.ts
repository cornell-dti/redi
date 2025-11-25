/**
 * Badge Manager Utility
 *
 * Manages the app icon badge count based on unread notifications
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Set the app badge count
 * @param count - Number of unread notifications
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    // Badge management is only available on iOS and some Android versions
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await Notifications.setBadgeCountAsync(count);
      console.log(`✅ Badge count set to: ${count}`);
    }
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
}

/**
 * Clear the app badge
 */
export async function clearBadge(): Promise<void> {
  try {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await Notifications.setBadgeCountAsync(0);
      console.log('✅ Badge cleared');
    }
  } catch (error) {
    console.error('Error clearing badge:', error);
  }
}

/**
 * Increment the badge count by 1
 */
export async function incrementBadge(): Promise<void> {
  try {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      const currentBadgeCount =
        await Notifications.getBadgeCountAsync();
      await Notifications.setBadgeCountAsync(currentBadgeCount + 1);
      console.log(`✅ Badge incremented to: ${currentBadgeCount + 1}`);
    }
  } catch (error) {
    console.error('Error incrementing badge:', error);
  }
}

/**
 * Decrement the badge count by 1 (minimum 0)
 */
export async function decrementBadge(): Promise<void> {
  try {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      const currentBadgeCount =
        await Notifications.getBadgeCountAsync();
      const newCount = Math.max(0, currentBadgeCount - 1);
      await Notifications.setBadgeCountAsync(newCount);
      console.log(`✅ Badge decremented to: ${newCount}`);
    }
  } catch (error) {
    console.error('Error decrementing badge:', error);
  }
}
