import AppText from '@/app/components/ui/AppText';
import { router } from 'expo-router';
import { Search } from 'lucide-react-native';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser } from '../../api/authService';
import { AppColors } from '../../components/AppColors';
import ChatItem from '../../components/ui/ChatItem';
import Header from '../../components/ui/Header';
import { useThemeAware } from '../../contexts/ThemeContext';
import { useConversations } from '../../hooks/useConversations';

// Mock chat data
const mockChats = [
  {
    id: '1',
    userId: 'mock-user-1',
    name: 'Emma',
    lastMessage: 'Hey! Want to grab coffee at CTB this weekend?',
    timestamp: '2m ago',
    unread: true,
    image:
      'https://media.licdn.com/dms/image/v2/D5603AQFxIrsKx3XV3g/profile-displayphoto-shrink_200_200/B56ZdXeERIHUAg-/0/1749519189434?e=2147483647&v=beta&t=MscfLHknj7AGAwDGZoRcVzT03zerW4P1jUR2mZ3QMKU',
    online: true,
  },
  {
    id: '2',
    userId: 'mock-user-2',
    name: 'Sarah',
    lastMessage: 'Thanks for the study session! Good luck on the exam ',
    timestamp: '1h ago',
    unread: false,
    image:
      'https://media.licdn.com/dms/image/v2/D5603AQFxIrsKx3XV3g/profile-displayphoto-shrink_200_200/B56ZdXeERIHUAg-/0/1749519189434?e=2147483647&v=beta&t=MscfLHknj7AGAwDGZoRcVzT03zerW4P1jUR2mZ3QMKU',
    online: false,
  },
  {
    id: '3',
    userId: 'mock-user-3',
    name: 'Jessica',
    lastMessage: 'The farmers market was so fun! We should go again',
    timestamp: '3h ago',
    unread: false,
    image:
      'https://media.licdn.com/dms/image/v2/D5603AQFxIrsKx3XV3g/profile-displayphoto-shrink_200_200/B56ZdXeERIHUAg-/0/1749519189434?e=2147483647&v=beta&t=MscfLHknj7AGAwDGZoRcVzT03zerW4P1jUR2mZ3QMKU',
    online: true,
  },
  {
    id: '4',
    userId: 'mock-user-4',
    name: 'Alex',
    lastMessage: 'Are you free for lunch tomorrow?',
    timestamp: '1d ago',
    unread: true,
    image:
      'https://media.licdn.com/dms/image/v2/D5603AQFxIrsKx3XV3g/profile-displayphoto-shrink_200_200/B56ZdXeERIHUAg-/0/1749519189434?e=2147483647&v=beta&t=MscfLHknj7AGAwDGZoRcVzT03zerW4P1jUR2mZ3QMKU',
    online: false,
  },
];

export default function ChatScreen() {
  useThemeAware(); // Force re-render when theme changes
  const { conversations, loading, error } = useConversations();
  const currentUser = getCurrentUser();

  // Transform Firestore conversations to UI format
  const chatData = useMemo(() => {
    if (!currentUser) {
    }
    if (!currentUser) return mockChats;

    console.log(currentUser.uid);
    return conversations.map((conv) => {
      // Get the other participant's info
      const otherUserId = conv.participantIds.find(
        (id) => id !== currentUser.uid
      );
      const otherUser = otherUserId ? conv.participants[otherUserId] : null;

      // Format timestamp
      let timestamp = 'Just now';
      if (conv.lastMessage?.timestamp) {
        const messageDate =
          conv.lastMessage.timestamp.toDate?.() ||
          new Date(conv.lastMessage.timestamp);
        const now = new Date();
        const diffMs = now.getTime() - messageDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) timestamp = 'Just now';
        else if (diffMins < 60) timestamp = `${diffMins}m ago`;
        else if (diffHours < 24) timestamp = `${diffHours}h ago`;
        else timestamp = `${diffDays}d ago`;
      }

      return {
        id: conv.id,
        userId: otherUserId || '',
        name: otherUser?.name || 'Unknown',
        lastMessage: conv.lastMessage?.text || 'Start a conversation',
        timestamp,
        unread: false, // TODO: implement unread logic
        image: otherUser?.image || 'https://via.placeholder.com/150',
        online: false, // TODO: implement online status
      };
    });
  }, [conversations, currentUser]);

  const displayData = chatData;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Messages"
          right={
            <TouchableOpacity>
              <Search size={24} color={AppColors.foregroundDimmer} />
            </TouchableOpacity>
          }
        />
        <View
          style={[
            styles.container,
            { justifyContent: 'center', alignItems: 'center' },
          ]}
        >
          <ActivityIndicator size="large" color={AppColors.accentDefault} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Header
        title="Messages"
        right={
          <TouchableOpacity>
            <Search size={24} color={AppColors.foregroundDimmer} />
          </TouchableOpacity>
        }
      />

      {displayData.filter((chat) => chat.online).length > 0 && (
        <View style={styles.activeMatches}>
          <AppText
            variant="subtitle"
            style={{ marginBottom: 12, paddingHorizontal: 20 }}
          >
            Active Matches
          </AppText>
          <FlatList
            data={displayData.filter((chat) => chat.online)}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeMatchesList}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.activeMatchItem}>
                <View style={styles.activeAvatarContainer}>
                  <Image
                    source={{ uri: item.image }}
                    style={styles.activeAvatar}
                  />
                  <View style={styles.activeOnline} />
                </View>
                <AppText variant="bodySmall">{item.name}</AppText>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <View style={styles.chats}>
        <FlatList
          data={displayData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatItem
              name={item.name}
              lastMessage={item.lastMessage}
              timestamp={item.timestamp}
              unread={item.unread}
              image={item.image}
              online={item.online}
              onPress={() =>
                router.push(
                  `/chat-detail?conversationId=${item.id}&userId=${item.userId}&name=${item.name}`
                )
              }
            />
          )}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDimmer,
  },
  activeMatches: {
    backgroundColor: AppColors.backgroundDefault,
    paddingVertical: 16,
  },
  activeMatchesList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  activeMatchItem: {
    alignItems: 'center',
  },
  activeAvatarContainer: {
    position: 'relative',
    marginBottom: 6,
  },
  activeAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  activeOnline: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: AppColors.accentDefault,
    borderWidth: 2,
    borderColor: AppColors.backgroundDefault,
  },
  chats: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
  },
  separator: {
    height: 1,
    backgroundColor: AppColors.backgroundDimmer,
    marginLeft: 82,
  },
});
