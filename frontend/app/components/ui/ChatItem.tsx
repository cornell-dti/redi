import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { AppColors } from '../AppColors';
import AppText from './AppText';
import ListItem from './ListItem';

interface ChatItemProps {
  name: string;
  lastMessage: string;
  image: string;
  onPress?: () => void;
}

export default function ChatItem({
  name,
  lastMessage,
  image,
  onPress,
}: ChatItemProps) {
  // Check if image is a valid URL (not placeholder)
  const hasValidImage = image && !image.includes('placeholder');

  return (
    <ListItem
      left={
        hasValidImage ? (
          <Image source={{ uri: image }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <AppText style={styles.avatarFallbackText}>
              {name.charAt(0).toUpperCase()}
            </AppText>
          </View>
        )
      }
      title={name}
      description={lastMessage}
      onPress={onPress}
    ></ListItem>
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
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: AppColors.backgroundDimmest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    fontSize: 20,
    fontWeight: '600',
    color: AppColors.foregroundDefault,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
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
    marginLeft: 8,
  },
});
