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
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

// Mock notification data
const mockNotifications = [
  {
    id: '1',
    type: 'match',
    title: 'New Match!',
    message: 'You and Emma liked each other',
    timestamp: '2m ago',
    read: false,
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
    icon: 'favorite',
  },
  {
    id: '2',
    type: 'message',
    title: 'New Message',
    message: 'Sarah sent you a message',
    timestamp: '15m ago',
    read: false,
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    icon: 'message',
  },
  {
    id: '3',
    type: 'like',
    title: 'Someone liked you!',
    message: 'You have a new admirer',
    timestamp: '1h ago',
    read: true,
    image: null,
    icon: 'favorite-border',
  },
  {
    id: '4',
    type: 'profile',
    title: 'Profile Boost',
    message: 'Your profile was shown to 50 more people today',
    timestamp: '3h ago',
    read: true,
    image: null,
    icon: 'trending-up',
  },
  {
    id: '5',
    type: 'system',
    title: 'Weekly Summary',
    message: 'You had 12 profile views this week',
    timestamp: '1d ago',
    read: true,
    image: null,
    icon: 'analytics',
  },
];

export default function NotificationsScreen() {
  const getNotificationIcon = (type: string, iconName: string) => {
    const iconColor = type === 'match' ? '#FF6B6B' :
                     type === 'message' ? '#2196F3' :
                     type === 'like' ? '#FF6B6B' :
                     type === 'profile' ? '#4CAF50' : '#666';

    return (
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
        <MaterialIcons name={iconName as any} size={20} color={iconColor} />
      </View>
    );
  };

  const renderNotificationItem = ({ item }: { item: typeof mockNotifications[0] }) => (
    <TouchableOpacity style={[styles.notificationItem, !item.read && styles.unreadItem]}>
      <View style={styles.notificationLeft}>
        {item.image ? (
          <View style={styles.imageIconContainer}>
            <Image source={{ uri: item.image }} style={styles.notificationImage} />
            <View style={styles.overlayIcon}>
              {getNotificationIcon(item.type, item.icon)}
            </View>
          </View>
        ) : (
          getNotificationIcon(item.type, item.icon)
        )}
      </View>

      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]}>
            {item.title}
          </Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        {!item.read && <View style={styles.unreadIndicator} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.markAllButton}>
          <Ionicons name="checkmark-done-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity style={[styles.filterTab, styles.activeTab]}>
          <Text style={[styles.filterText, styles.activeFilterText]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterTab}>
          <Text style={styles.filterText}>Matches</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterTab}>
          <Text style={styles.filterText}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterTab}>
          <Text style={styles.filterText}>Likes</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <FlatList
        data={mockNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationItem}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContainer}
      />

      {/* Empty State (shown when filtered) */}
      {/* <View style={styles.emptyState}>
        <MaterialIcons name="notifications-none" size={64} color="#CCC" />
        <Text style={styles.emptyTitle}>No notifications yet</Text>
        <Text style={styles.emptyMessage}>
          When you get matches and messages, they'll appear here
        </Text>
      </View> */}
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
  markAllButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  activeTab: {
    backgroundColor: '#FF6B6B',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeFilterText: {
    color: 'white',
  },
  listContainer: {
    backgroundColor: 'white',
  },
  notificationItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'flex-start',
  },
  unreadItem: {
    backgroundColor: '#FFF9F9',
  },
  notificationLeft: {
    marginRight: 12,
    marginTop: 2,
  },
  imageIconContainer: {
    position: 'relative',
  },
  notificationImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  overlayIcon: {
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
    position: 'relative',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 8,
    right: -8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
  },
  separator: {
    height: 1,
    backgroundColor: '#E1E1E1',
    marginLeft: 76,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
});