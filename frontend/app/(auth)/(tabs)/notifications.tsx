import AppText from '@/app/components/ui/AppText';
import Button from '@/app/components/ui/Button';
import { useNotifications } from '@/app/contexts/NotificationsContext';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Bell, Heart, LucideIcon, MessageCircle, X } from 'lucide-react-native';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '../../components/AppColors';
import ListItemWrapper from '../../components/ui/ListItemWrapper';
import NotificationItem from '../../components/ui/NotificationItem';
import { useThemeAware } from '../../contexts/ThemeContext';

// Helper to get icon for notification type
const getNotificationIcon = (type: string): LucideIcon => {
  switch (type) {
    case 'mutual_nudge':
      return Heart;
    case 'new_message':
      return MessageCircle;
    default:
      return Bell;
  }
};

// Helper to format timestamp as relative time
const formatRelativeTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
};

export default function NotificationsScreen() {
  useThemeAware(); // Force re-render when theme changes
  const router = useRouter();
  const { notifications, loading, error, markAsRead, markAllAsRead, setActive } =
    useNotifications();

  // Activate/deactivate real-time listener based on screen focus
  // This saves resources when the user isn't viewing notifications
  useFocusEffect(
    useCallback(() => {
      console.log('🔔 Notifications screen focused - activating listener');
      setActive?.(true); // Activate listener

      return () => {
        console.log('📭 Notifications screen unfocused - pausing listener');
        setActive?.(false); // Pause listener to save resources
      };
    }, [setActive])
  );

  const handleNotificationPress = async (
    notificationId: string,
    type: string,
    metadata: any
  ) => {
    try {
      await markAsRead(notificationId);

      if (type === 'mutual_nudge') {
        if (metadata.conversationId) {
          let chatUrl = `/chat-detail?conversationId=${metadata.conversationId}`;

          if (metadata.matchFirebaseUid) {
            chatUrl += `&userId=${metadata.matchFirebaseUid}`;
          }
          if (metadata.matchName) {
            chatUrl += `&name=${encodeURIComponent(metadata.matchName)}`;
          }

          router.push(chatUrl as any);
        } else {
          router.push('/(auth)/(tabs)/' as any);
        }
      } else if (type === 'new_message' && metadata.conversationId) {
        // We have not yet implemented new message notifications so the type will never be new message
        let chatUrl = `/chat-detail?conversationId=${metadata.conversationId}`;

        if (metadata.senderFirebaseUid) {
          chatUrl += `&userId=${metadata.senderFirebaseUid}`;
        }
        if (metadata.senderName) {
          chatUrl += `&name=${encodeURIComponent(metadata.senderName)}`;
        }

        router.push(chatUrl as any);
      }
    } catch (err) {
      console.error('Error handling notification press:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (err) {
      console.error('Error marking all as read:', err);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.top}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{
            rowGap: 24,
          }}
        >
          <AppText variant="title">Notifications</AppText>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={AppColors.accentDefault} />
              <AppText variant="body" color="dimmer" style={{ marginTop: 8 }}>
                Loading notifications...
              </AppText>
            </View>
          )}

          {error && (
            <View style={styles.emptyState}>
              <AppText variant="body" color="dimmer">
                {error}
              </AppText>
            </View>
          )}

          {!loading && !error && notifications.length === 0 && (
            <View style={styles.emptyState}>
              <AppText variant="body" color="dimmer">
                No notifications yet
              </AppText>
            </View>
          )}

          {!loading && !error && notifications.length > 0 && (
            <ListItemWrapper style={styles.list}>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  type={notification.type}
                  title={notification.title}
                  message={notification.message}
                  timestamp={formatRelativeTime(notification.createdAt)}
                  read={notification.read}
                  image={null}
                  icon={getNotificationIcon(notification.type)}
                  onPress={() =>
                    handleNotificationPress(
                      notification.id,
                      notification.type,
                      notification.metadata
                    )
                  }
                />
              ))}
            </ListItemWrapper>
          )}
        </ScrollView>

        {!loading && notifications.length > 0 && (
          <View style={styles.footer}>
            <Button
              iconLeft={X}
              variant="secondary"
              title="Mark all as read"
              onPress={handleMarkAllAsRead}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
    justifyContent: 'space-between',
  },
  scrollView: {
    padding: 16,
    height: '90%',
  },
  list: {
    backgroundColor: AppColors.backgroundDefault,
  },
  separator: {
    height: 1,
    backgroundColor: AppColors.backgroundDimmer,
    marginLeft: 76,
  },
  footer: {
    padding: 16,
  },
  top: {
    gap: 24,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
