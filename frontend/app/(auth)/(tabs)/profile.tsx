import AppButton from '@/app/components/AppButton';
import { Ionicons } from '@expo/vector-icons';
import {
  Bell,
  Camera,
  ChevronRight,
  Edit,
  Eye,
  Heart,
  HelpCircle,
  LogOut,
  MessageCircle,
  Shield,
} from 'lucide-react-native';
import React from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOutUser } from '../../api/authService';
import { AppColors } from '../../components/AppColors';
import Header from '../../components/ui/Header';
import InfoCard from '../../components/ui/InfoCard';
import InfoRow from '../../components/ui/InfoRow';

// Mock user profile data
const mockUserProfile = {
  name: 'Arsh',
  age: 32,
  school: 'College of Arts and Sciences',
  major: ['Computer Science', 'Psychology'],
  year: 2026,
  bio: "Love exploring Ithaca's gorges, trying new restaurants on the Commons, and weekend hiking trips. Always up for a good board game night or discovering new music!",
  images: [
    'https://media.licdn.com/dms/image/v2/D4E03AQEppsomLWUZgA/profile-displayphoto-scale_200_200/B4EZkMKRSMIUAA-/0/1756845653823?e=2147483647&v=beta&t=oANMmUogYztIXt7p1pB11qv-Qwh0IHYmFMZIdl9CFZE',
    'https://media.licdn.com/dms/image/v2/D4E03AQEppsomLWUZgA/profile-displayphoto-scale_200_200/B4EZkMKRSMIUAA-/0/1756845653823?e=2147483647&v=beta&t=oANMmUogYztIXt7p1pB11qv-Qwh0IHYmFMZIdl9CFZE',
    'https://media.licdn.com/dms/image/v2/D4E03AQEppsomLWUZgA/profile-displayphoto-scale_200_200/B4EZkMKRSMIUAA-/0/1756845653823?e=2147483647&v=beta&t=oANMmUogYztIXt7p1pB11qv-Qwh0IHYmFMZIdl9CFZE',
  ],
  instagram: '@arshoninsta',
  snapchat: 'arshnap',
  interests: ['Hiking', 'Photography', 'Board Games', 'Business', 'Travel'],
};

const profileStats = [
  { label: 'Profile Views', value: '127', icon: 'eye' },
  { label: 'Matches', value: '23', icon: 'heart' },
  { label: 'Messages', value: '8', icon: 'message-circle' },
];

const IconComponent = ({
  name,
  size,
  color,
}: {
  name: string;
  size: number;
  color: string;
}) => {
  switch (name) {
    case 'eye':
      return <Eye size={size} color={color} />;
    case 'heart':
      return <Heart size={size} color={color} />;
    case 'message-circle':
      return <MessageCircle size={size} color={color} />;
    default:
      return null;
  }
};

export default function ProfileScreen() {
  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOutUser();
          } catch {
            Alert.alert('Error', 'Failed to sign out');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Image
        source={{
          uri: 'https://media.licdn.com/dms/image/v2/D4E03AQEppsomLWUZgA/profile-displayphoto-scale_200_200/B4EZkMKRSMIUAA-/0/1756845653823?e=2147483647&v=beta&t=oANMmUogYztIXt7p1pB11qv-Qwh0IHYmFMZIdl9CFZE',
        }}
        style={{
          width: 124,
          height: 124,
          borderRadius: 100,
          alignSelf: 'center',
        }}
      />
      <Header
        title={mockUserProfile.name}
        right={
          <View style={styles.headerButtons}>
            <TouchableOpacity>
              <Edit size={24} color={AppColors.foregroundDimmer} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSignOut}>
              <LogOut size={24} color={AppColors.foregroundDimmer} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <AppButton
          title={'Preview Profile'}
          onPress={() => {}}
          variant="primary"
          size="small"
          fullWidth={false}
        />
        <View style={styles.statsContainer}>
          {profileStats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <IconComponent
                name={stat.icon}
                size={24}
                color={AppColors.accentDefault}
              />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <View style={styles.imageGrid}>
            {mockUserProfile.images.map((image, index) => (
              <TouchableOpacity key={index} style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.image} />
                {index === 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Main</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.addImage}>
              <Camera size={32} color={AppColors.foregroundDimmer} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Info</Text>
          <InfoCard>
            <InfoRow
              label="Name & Age"
              value={`${mockUserProfile.name}, ${mockUserProfile.age}`}
            />
            <InfoRow label="School" value={mockUserProfile.school} />
            <InfoRow label="Major" value={mockUserProfile.major.join(', ')} />
            <InfoRow label="Graduation Year" value={mockUserProfile.year} />
          </InfoCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <InfoCard>
            <Text>{mockUserProfile.bio}</Text>
          </InfoCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Media</Text>
          <InfoCard>
            <View style={styles.socialRow}>
              <Ionicons
                name="logo-instagram"
                size={24}
                color={AppColors.negativeDefault}
              />
              <Text style={styles.socialText}>{mockUserProfile.instagram}</Text>
            </View>
            <View style={styles.socialRow}>
              <Ionicons
                name="logo-snapchat"
                size={24}
                color={AppColors.negativeDimmer}
              />
              <Text style={styles.socialText}>{mockUserProfile.snapchat}</Text>
            </View>
          </InfoCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.interestsContainer}>
            {mockUserProfile.interests.map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text>{interest}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <InfoCard>
            <TouchableOpacity style={styles.settingRow}>
              <Bell size={24} color={AppColors.foregroundDimmer} />
              <Text style={styles.settingText}>Notifications</Text>
              <ChevronRight size={24} color={AppColors.foregroundDimmer} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingRow}>
              <Shield size={24} color={AppColors.foregroundDimmer} />
              <Text style={styles.settingText}>Privacy & Safety</Text>
              <ChevronRight size={24} color={AppColors.foregroundDimmer} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingRow}>
              <HelpCircle size={24} color={AppColors.foregroundDimmer} />
              <Text style={styles.settingText}>Help & Support</Text>
              <ChevronRight size={24} color={AppColors.foregroundDimmer} />
            </TouchableOpacity>
          </InfoCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDimmer,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    color: AppColors.foregroundDefault,
  },
  statLabel: {
    fontSize: 12,
    color: AppColors.foregroundDimmer,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: AppColors.foregroundDefault,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageContainer: {
    position: 'relative',
    width: '31%',
    aspectRatio: 0.75,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: AppColors.accentDefault,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: AppColors.backgroundDefault,
    fontSize: 10,
    fontWeight: '600',
  },
  addImage: {
    width: '31%',
    aspectRatio: 0.75,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: AppColors.backgroundDimmer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  socialText: {
    fontSize: 16,
    fontWeight: '500',
    color: AppColors.foregroundDefault,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: AppColors.backgroundDefault,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: AppColors.backgroundDimmer,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.backgroundDimmer,
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
    color: AppColors.foregroundDefault,
  },
});
