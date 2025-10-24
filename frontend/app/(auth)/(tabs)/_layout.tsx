import FilledBellIcon from '@/app/components/icons/FilledBellIcon';
import FilledChatIcon from '@/app/components/icons/FilledChatIcon';
import FilledHeartIcon from '@/app/components/icons/FilledHeartIcon';
import FilledProfileIcon from '@/app/components/icons/FilledProfileIcon';
import { useNotifications } from '@/app/hooks/useNotifications';
import { Tabs } from 'expo-router';
import { Bell, Heart, MessageCircle, User } from 'lucide-react-native';
import { useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import { AppColors } from '../../components/AppColors';

const AnimatedTabButton = (props: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    Animated.timing(scaleAnim, {
      toValue: 0.93,
      duration: 100,
      useNativeDriver: true,
    }).start();
    // Call the original onPressIn if it exists
    props.onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
    // Call the original onPressOut if it exists
    props.onPressOut?.(e);
  };

  const handlePress = (e: any) => {
    console.log('AnimatedTabButton: handlePress called', {
      hasOnPress: !!props.onPress,
      accessibilityLabel: props.accessibilityLabel,
    });
    // CRITICAL: Call the original onPress handler for navigation
    props.onPress?.(e);
  };

  return (
    <Pressable
      {...props}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transform: [{ scale: scaleAnim }],
        }}
      >
        {props.children}
      </Animated.View>
    </Pressable>
  );
};

export default function TabLayout() {
  const { unreadCount } = useNotifications();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AppColors.backgroundDefault,
        tabBarInactiveTintColor: AppColors.foregroundDimmer,
        tabBarStyle: {
          backgroundColor: AppColors.foregroundDefault,
          paddingTop: 16,
          paddingBottom: 16,
          height: 100,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          marginTop: 6,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Matches',
          tabBarIcon: ({ color, size, focused }) =>
            focused ? (
              <FilledHeartIcon size={size} color={color} />
            ) : (
              <Heart size={size} color={color} />
            ),
          tabBarButton: (props) => <AnimatedTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size, focused }) =>
            focused ? (
              <FilledChatIcon size={size} color={color} />
            ) : (
              <MessageCircle size={size} color={color} />
            ),
          tabBarButton: (props) => <AnimatedTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size, focused }) =>
            focused ? (
              <FilledBellIcon size={size} color={color} />
            ) : (
              <Bell size={size} color={color} />
            ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: AppColors.negativeDefault,
            color: AppColors.backgroundDefault,
          },
          tabBarButton: (props) => <AnimatedTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) =>
            focused ? (
              <FilledProfileIcon size={size} color={color} />
            ) : (
              <User size={size} color={color} />
            ),
          tabBarButton: (props) => <AnimatedTabButton {...props} />,
        }}
        listeners={{
          tabPress: (e) => {
            console.log('Profile tab pressed');
          },
        }}
      />
    </Tabs>
  );
}
