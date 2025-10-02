import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppColors } from '../AppColors';

interface NotificationItemProps {
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  image?: string | null;
  icon: string;
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
    <TouchableOpacity style={[styles.container, !read && styles.unread]} onPress={onPress}>
      <View style={styles.left}>
        {image ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.image} />
            <View style={[styles.iconBadge, { backgroundColor: iconColor + '15' }]}>
              <MaterialIcons name={icon as any} size={16} color={iconColor} />
            </View>
          </View>
        ) : (
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
            <MaterialIcons name={icon as any} size={20} color={iconColor} />
          </View>
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, !read && styles.unreadTitle]}>{title}</Text>
          <Text style={styles.timestamp}>{timestamp}</Text>
        </View>
        <Text style={styles.message}>{message}</Text>
        {!read && <View style={styles.unreadDot} />}
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
  title: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
    color: AppColors.foregroundDefault,
  },
  unreadTitle: {
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: AppColors.foregroundDimmer,
  },
  message: {
    fontSize: 14,
    color: AppColors.foregroundDefault,
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    right: -8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.accentDefault,
  },
});
