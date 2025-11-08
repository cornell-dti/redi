import ListItemWrapper from '@/app/components/ui/ListItemWrapper';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser } from '../../api/authService';
import { getBlockedUsers } from '../../api/blockingApi';
import { getBatchProfiles } from '../../api/profileApi';
import { AppColors } from '../../components/AppColors';
import ChatItem from '../../components/ui/ChatItem';
import EmptyState from '../../components/ui/EmptyState';
import Header from '../../components/ui/Header';
import { useThemeAware } from '../../contexts/ThemeContext';
import { useConversations } from '../../hooks/useConversations';

// Mock chat data
const mockChats = [
  {
    id: '1',
    userId: 'mock-user-1',
    netid: 'mock-netid-1',
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
    netid: 'mock-netid-2',
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
    netid: 'mock-netid-3',
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
    netid: 'mock-netid-4',
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
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [animationTrigger, setAnimationTrigger] = useState(0);
  const [freshProfiles, setFreshProfiles] = useState<Record<string, { firstName: string; pictures: string[]; netid: string }>>({});

  // Fetch blocked users list when screen is focused
  useFocusEffect(
    useCallback(() => {
      const fetchBlockedUsers = async () => {
        if (!currentUser?.email) return;

        const currentNetid = currentUser.email.split('@')[0];
        try {
          const response = await getBlockedUsers(currentNetid);
          setBlockedUsers(new Set(response.blockedUsers));
        } catch (error) {
          console.error('Error fetching blocked users:', error);
        }
      };

      fetchBlockedUsers();
      // Trigger animation every time screen is focused
      setAnimationTrigger((prev) => prev + 1);
    }, [currentUser])
  );

  // Fetch fresh profile data for all conversation participants
  useEffect(() => {
    const fetchFreshProfiles = async () => {
      if (!currentUser || conversations.length === 0) return;

      try {
        // Extract all participant UIDs (excluding current user)
        const participantUids = conversations
          .flatMap((conv) => conv.participantIds)
          .filter((uid) => uid !== currentUser.uid)
          .filter((uid, index, self) => self.indexOf(uid) === index); // Remove duplicates

        if (participantUids.length === 0) return;

        // Fetch fresh profile data
        const profiles = await getBatchProfiles(participantUids);
        setFreshProfiles(profiles);
      } catch (error) {
        console.error('Error fetching fresh profiles:', error);
        // Don't set fresh profiles on error - will fall back to cached data
      }
    };

    fetchFreshProfiles();
  }, [conversations, currentUser]);

  // Transform Firestore conversations to UI format
  const chatData = useMemo(() => {
    if (!currentUser) {
    }
    if (!currentUser) return mockChats;

    console.log(currentUser.uid);
    return conversations
      .map((conv) => {
        // Get the other participant's info
        const otherUserId = conv.participantIds.find(
          (id) => id !== currentUser.uid
        );
        const otherUser = otherUserId ? conv.participants[otherUserId] : null;

        // Get fresh profile data if available, otherwise use cached data
        const freshProfile = otherUserId ? freshProfiles[otherUserId] : null;

        // Use fresh profile picture (pictures[0]) if available, otherwise fall back to cached image
        // If no image available, use placeholder
        const profileImage = freshProfile?.pictures?.[0] || otherUser?.image || 'https://via.placeholder.com/150';

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
          netid: freshProfile?.netid || otherUser?.netid || '',
          name: otherUser?.deleted ? 'Deleted User' : (freshProfile?.firstName || otherUser?.name || 'Unknown'),
          lastMessage: conv.lastMessage?.text || 'Start a conversation',
          timestamp,
          image: profileImage,
        };
      });
  }, [conversations, currentUser, freshProfiles]);

  const displayData = chatData;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Messages" />
        <View
          style={[
            styles.container,
            { justifyContent: 'center', alignItems: 'center' },
          ]}
        >
          <LoadingSpinner />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Header title="Messages" />

      <View style={styles.chats}>
        {displayData.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            label="No conversations yet"
            triggerAnimation={animationTrigger}
          />
        ) : (
          <ListItemWrapper>
            {displayData.map((item) => (
              <ChatItem
                key={item.id}
                name={item.name}
                lastMessage={item.lastMessage}
                image={item.image}
                onPress={() =>
                  router.push(
                    `/chat-detail?conversationId=${item.id}&userId=${item.userId}&name=${item.name}&netid=${item.netid}`
                  )
                }
              />
            ))}
          </ListItemWrapper>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
  },
  activeMatches: {
    backgroundColor: AppColors.backgroundDefault,
    paddingVertical: 16,
  },
  activeMatchesList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  chats: {
    flex: 1,
    padding: 16,
  },
});
