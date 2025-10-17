import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppColors } from '../AppColors';
import AppText from './AppText';

interface NotificationItemProps {
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  image?: string | null;
  icon: LucideIcon;
  onPress?: () => void;
}

export default function NotificationItem({
  type,
  title,
  message,
  timestamp,
  read,
  image,
  icon,
  onPress,
}: NotificationItemProps) {
  const iconColor = AppColors.accentDefault;

  return (
    <TouchableOpacity
      style={[styles.container, !read && styles.unread]}
      onPress={onPress}
    >
      <View style={styles.left}>
        {image ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.image} />
            <View
              style={[styles.iconBadge, { backgroundColor: iconColor + '15' }]}
            >
              {React.createElement(icon, { size: 16, color: iconColor })}
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: iconColor + '15' },
            ]}
          >
            {React.createElement(icon, { size: 20, color: iconColor })}
          </View>
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <AppText
            variant="subtitle"
            style={{ fontWeight: !read ? '600' : '500' }}
          >
            {title}
          </AppText>
          <AppText variant="bodySmall" color="dimmer">
            {timestamp}
          </AppText>
        </View>
        <AppText variant="body">{message}</AppText>
        {!read && (
          <View
            style={[
              styles.unreadDot,
              { backgroundColor: AppColors.accentDefault },
            ]}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'flex-start',
  },
  unread: {
    backgroundColor: AppColors.negativeDimmer,
  },
  left: {
    marginRight: 12,
    marginTop: 2,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  iconBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    right: -8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
