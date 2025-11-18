/**
 * Notification Permissions Service
 * Handles requesting and managing push notification permissions
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { registerPushToken, removePushToken } from '../api/pushTokenApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PERMISSION_ASKED_KEY = '@notification_permission_asked';
const TOKEN_REGISTERED_KEY = '@notification_token_registered';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request push notification permissions from the user
 * @returns Promise resolving to boolean indicating if permission was granted
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    // Check if we've already asked for permissions
    const hasAsked = await AsyncStorage.getItem(PERMISSION_ASKED_KEY);

    // Get current permission status
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    // If not determined yet and we haven't asked, request permissions
    if (existingStatus !== 'granted' && !hasAsked) {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;

      // Mark that we've asked
      await AsyncStorage.setItem(PERMISSION_ASKED_KEY, 'true');
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Get the Expo push token and register it with the backend
 * @returns Promise resolving to boolean indicating success
 */
export async function registerForPushNotifications(): Promise<boolean> {
  try {
    // Check if we've already registered a token
    const tokenRegistered = await AsyncStorage.getItem(TOKEN_REGISTERED_KEY);

    // Request permissions
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('Notification permissions not granted, skipping token registration');
      return false;
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'a8a89a20-069d-46de-9994-8e37117865b4', // REDI Expo project ID
    });

    const pushToken = tokenData.data;
    console.log('Expo push token:', pushToken);

    // Register token with backend if not already registered or if it's different
    if (!tokenRegistered || tokenRegistered !== pushToken) {
      await registerPushToken(pushToken);
      await AsyncStorage.setItem(TOKEN_REGISTERED_KEY, pushToken);
      console.log('✅ Push token registered with backend');
    }

    return true;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return false;
  }
}

/**
 * Unregister push notifications (e.g., on logout)
 * @returns Promise resolving to boolean indicating success
 */
export async function unregisterPushNotifications(): Promise<boolean> {
  try {
    await removePushToken();
    await AsyncStorage.removeItem(TOKEN_REGISTERED_KEY);
    console.log('✅ Push token unregistered');
    return true;
  } catch (error) {
    console.error('Error unregistering push notifications:', error);
    return false;
  }
}

/**
 * Check if notification permissions have been granted
 * @returns Promise resolving to boolean
 */
export async function hasNotificationPermissions(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return false;
  }
}

/**
 * Open device settings to allow user to enable notifications
 */
export async function openNotificationSettings(): Promise<void> {
  try {
    // iOS only - Android doesn't support this
    if (Platform.OS === 'ios') {
      await Notifications.openSettingsAsync();
    }
  } catch (error) {
    console.error('Error opening notification settings:', error);
  }
}

/**
 * Set up notification received listener
 * @param callback - Function to call when notification is received
 * @returns Subscription that can be removed
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Set up notification response listener (when user taps notification)
 * @param callback - Function to call when notification is tapped
 * @returns Subscription that can be removed
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
