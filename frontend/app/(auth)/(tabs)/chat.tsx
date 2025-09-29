import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

// Mock chat data
const mockChats = [
  {
    id: '1',
    name: 'Emma',
    lastMessage: 'Hey! Want to grab coffee at CTB this weekend?',
    timestamp: '2m ago',
    unread: true,
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
    online: true,
  },
  {
    id: '2',
    name: 'Sarah',
    lastMessage: 'Thanks for the study session! Good luck on the exam 📚',
    timestamp: '1h ago',
    unread: false,
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    online: false,
  },
  {
    id: '3',
    name: 'Jessica',
    lastMessage: 'The farmers market was so fun! We should go again',
    timestamp: '3h ago',
    unread: false,
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    online: true,
  },
  {
    id: '4',
    name: 'Alex',
    lastMessage: 'Are you free for lunch tomorrow?',
    timestamp: '1d ago',
    unread: true,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    online: false,
  },
];

export default function ChatScreen() {
  const renderChatItem = ({ item }: { item: typeof mockChats[0] }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => {
        // Navigate to individual chat screen
        router.push(`/screens/chat-detail?userId=${item.id}&name=${item.name}`);
      }}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.image }} style={styles.avatar} />
        {item.online && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{item.name}</Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>
        <View style={styles.messageContainer}>
          <Text
            style={[
              styles.lastMessage,
              item.unread && styles.unreadMessage,
            ]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unread && <View style={styles.unreadDot} />}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.searchButton}>
          <MaterialIcons name="search" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Active Matches (Horizontal Scroll) */}
      <View style={styles.activeMatchesContainer}>
        <Text style={styles.sectionTitle}>Active Matches</Text>
        <FlatList
          data={mockChats.filter(chat => chat.online)}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activeMatchesList}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.activeMatchItem}>
              <View style={styles.activeMatchAvatarContainer}>
                <Image source={{ uri: item.image }} style={styles.activeMatchAvatar} />
                <View style={styles.activeOnlineIndicator} />
              </View>
              <Text style={styles.activeMatchName}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Chats List */}
      <View style={styles.chatsContainer}>
        <FlatList
          data={mockChats}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>

      {/* New Chat Button */}
      <TouchableOpacity style={styles.newChatButton}>
        <MaterialIcons name="edit" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  searchButton: {
    padding: 8,
  },
  activeMatchesContainer: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 20,
    marginBottom: 12,
  },
  activeMatchesList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  activeMatchItem: {
    alignItems: 'center',
  },
  activeMatchAvatarContainer: {
    position: 'relative',
    marginBottom: 6,
  },
  activeMatchAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  activeOnlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
  },
  activeMatchName: {
    fontSize: 12,
    color: '#666',
    maxWidth: 60,
  },
  chatsContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  chatItem: {
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
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  unreadMessage: {
    color: '#333',
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
    marginLeft: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#E1E1E1',
    marginLeft: 82,
  },
  newChatButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});