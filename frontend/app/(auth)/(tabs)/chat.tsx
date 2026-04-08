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

export default function ChatScreen() {
  useThemeAware(); // Force re-render when theme changes
  const { conversations, loading } = useConversations();
  const currentUser = getCurrentUser();
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [animationTrigger, setAnimationTrigger] = useState(0);
  const [freshProfiles, setFreshProfiles] = useState<
    Record<string, { firstName: string; pictures: string[]; netid: string }>
  >({});

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
    if (!currentUser) return [];

    console.log(currentUser.uid);
    return conversations.map((conv) => {
      // Get the other participant's info
      const otherUserId = conv.participantIds.find(
        (id) => id !== currentUser.uid
      );
      const otherUser = otherUserId ? conv.participants[otherUserId] : null;

      // Get fresh profile data if available, otherwise use cached data
      const freshProfile = otherUserId ? freshProfiles[otherUserId] : null;

      // Use fresh profile picture (pictures[0]) if available, otherwise fall back to cached image
      // If no image available, use placeholder
      const profileImage =
        freshProfile?.pictures?.[0] ||
        otherUser?.image ||
        'https://via.placeholder.com/150';

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
        name: otherUser?.deleted
          ? 'Deleted User'
          : freshProfile?.firstName || otherUser?.name || 'Unknown',
        lastMessage: conv.lastMessage?.text || 'Start a conversation',
        timestamp,
        image: profileImage,
      };
    });
  }, [conversations, currentUser, freshProfiles]);

  const displayData = useMemo(() => {
    return chatData.filter((chat) => {
      return chat.netid && !blockedUsers.has(chat.netid);
    });
  }, [chatData, blockedUsers]);

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
          <ListItemWrapper applyToNestedChild>
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
