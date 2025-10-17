import AppText from '@/app/components/ui/AppText';
import { router } from 'expo-router';
import { Edit, Search } from 'lucide-react-native';
import React from 'react';
import {
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '../../components/AppColors';
import { useThemeAware } from '../../contexts/ThemeContext';
import ChatItem from '../../components/ui/ChatItem';
import Header from '../../components/ui/Header';

// Mock chat data
const mockChats = [
  {
    id: '1',
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

      <View style={styles.activeMatches}>
        <AppText
          variant="subtitle"
          style={{ marginBottom: 12, paddingHorizontal: 20 }}
        >
          Active Matches
        </AppText>
        <FlatList
          data={mockChats.filter((chat) => chat.online)}
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

      <View style={styles.chats}>
        <FlatList
          data={mockChats}
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
                  `/screens/chat-detail?userId=${item.id}&name=${item.name}`
                )
              }
            />
          )}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>

      <TouchableOpacity style={styles.fab}>
        <Edit size={24} color={AppColors.backgroundDefault} />
      </TouchableOpacity>
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
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.accentDefault,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
