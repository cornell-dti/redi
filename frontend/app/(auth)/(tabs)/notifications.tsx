import AppText from '@/app/components/ui/AppText';
import Button from '@/app/components/ui/Button';
import {
  BarChart3,
  Heart,
  LucideIcon,
  MessageCircle,
  TrendingUp,
  X,
} from 'lucide-react-native';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '../../components/AppColors';
import ListItemWrapper from '../../components/ui/ListItemWrapper';
import NotificationItem from '../../components/ui/NotificationItem';
import { useThemeAware } from '../../contexts/ThemeContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  image: string | null;
  icon: LucideIcon;
}

// Mock notification data
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'match',
    title: 'New Match!',
    message: 'You and Abrar liked each other',
    timestamp: '2m ago',
    read: false,
    image:
      'https://media.licdn.com/dms/image/v2/D5603AQFxIrsKx3XV3g/profile-displayphoto-shrink_200_200/B56ZdXeERIHUAg-/0/1749519189434?e=2147483647&v=beta&t=MscfLHknj7AGAwDGZoRcVzT03zerW4P1jUR2mZ3QMKU',
    icon: Heart,
  },
  {
    id: '2',
    type: 'message',
    title: 'New Message',
    message: 'Cleemmie sent you a message',
    timestamp: '15m ago',
    read: false,
    image:
      'https://media.licdn.com/dms/image/v2/D4E03AQHIyGmXArUgLQ/profile-displayphoto-shrink_200_200/B4EZSMgrNeGwAY-/0/1737524163741?e=2147483647&v=beta&t=nb1U9gqxgOz9Jzf0bAnUY5wk5R9v_nn9AsgdhYbbpbk',
    icon: MessageCircle,
  },
  {
    id: '3',
    type: 'like',
    title: 'Someone liked you!',
    message: 'Arshie Barsh admires your profile',
    timestamp: '1h ago',
    read: true,
    image:
      'https://media.licdn.com/dms/image/v2/D4E03AQEppsomLWUZgA/profile-displayphoto-scale_200_200/B4EZkMKRSMIUAA-/0/1756845653823?e=2147483647&v=beta&t=oANMmUogYztIXt7p1pB11qv-Qwh0IHYmFMZIdl9CFZE',
    icon: Heart,
  },
  {
    id: '4',
    type: 'profile',
    title: 'Profile Boost',
    message: 'Your profile was shown to 50 more people today',
    timestamp: '3h ago',
    read: true,
    image: null,
    icon: TrendingUp,
  },
  {
    id: '5',
    type: 'system',
    title: 'Weekly Summary',
    message: 'You had 12 profile views this week',
    timestamp: '1d ago',
    read: true,
    image: null,
    icon: BarChart3,
  },
];

export default function NotificationsScreen() {
  useThemeAware(); // Force re-render when theme changes
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.top}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{
            rowGap: 24,
          }}
        >
          <AppText variant="title">Notifications</AppText>

          <ListItemWrapper style={styles.list}>
            {mockNotifications.map((item) => (
              <NotificationItem
                key={item.id}
                type={item.type}
                title={item.title}
                message={item.message}
                timestamp={item.timestamp}
                read={item.read}
                image={item.image}
                icon={item.icon}
              />
            ))}
          </ListItemWrapper>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            iconLeft={X}
            variant="secondary"
            title="Clear all"
            onPress={() => {}}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
    justifyContent: 'space-between',
  },
  scrollView: {
    padding: 16,
    height: '90%',
  },
  list: {
    backgroundColor: AppColors.backgroundDefault,
  },
  separator: {
    height: 1,
    backgroundColor: AppColors.backgroundDimmer,
    marginLeft: 76,
  },
  footer: {
    padding: 16,
  },
  top: {
    gap: 24,
  },
});
