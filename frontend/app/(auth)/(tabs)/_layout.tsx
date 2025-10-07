import { Tabs } from 'expo-router';
import { Bell, Heart, MessageCircle, User } from 'lucide-react-native';
import { useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import { AppColors } from '../../components/AppColors';

const AnimatedTabButton = (props: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.93,
      duration: 100,
      useNativeDriver: true,
    }).start();
    props.onPressIn?.();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
    props.onPressOut?.();
  };

  return (
    <Pressable {...props} onPressIn={handlePressIn} onPressOut={handlePressOut}>
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
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AppColors.backgroundDefault,
        tabBarInactiveTintColor: AppColors.foregroundDimmer,
        tabBarStyle: {
          backgroundColor: AppColors.accentDefault,
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
          tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />,
          tabBarButton: (props) => <AnimatedTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={size} color={color} />
          ),
          tabBarButton: (props) => <AnimatedTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
          tabBarBadge: 3,
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
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          tabBarButton: (props) => <AnimatedTabButton {...props} />,
        }}
      />
    </Tabs>
  );
}
