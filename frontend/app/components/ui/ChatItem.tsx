import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppColors } from '../AppColors';
import AppText from './AppText';

interface ChatItemProps {
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  image: string;
  online: boolean;
  onPress?: () => void;
}

export default function ChatItem({
  name,
  lastMessage,
  timestamp,
  unread,
  image,
  online,
  onPress,
}: ChatItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.avatarContainer}>
        <Image source={{ uri: image }} style={styles.avatar} />
        {online && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <AppText variant="subtitle">{name}</AppText>
          <AppText variant="bodySmall" color="dimmer">
            {timestamp}
          </AppText>
        </View>
        <View style={styles.messageContainer}>
          <AppText
            variant="body"
            style={[styles.lastMessage, unread && { fontWeight: '500' }]}
            numberOfLines={1}
          >
            {lastMessage}
          </AppText>
          {unread && <View style={styles.unreadDot} />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: AppColors.accentDefault,
    borderWidth: 2,
    borderColor: AppColors.backgroundDefault,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.accentDefault,
    marginLeft: 8,
  },
});
