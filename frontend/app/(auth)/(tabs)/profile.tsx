import AppText from '@/app/components/ui/AppText';
import Button from '@/app/components/ui/Button';
import { ProfileResponse } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import {
  Bell,
  Camera,
  ChevronRight,
  Edit,
  Eye,
  Github,
  Globe,
  Heart,
  HelpCircle,
  Instagram,
  Linkedin,
  LogOut,
  MessageCircle,
  Shield,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser, signOutUser } from '../../api/authService';
import { getCurrentUserProfile } from '../../api/profileApi';
import { AppColors } from '../../components/AppColors';
import Header from '../../components/ui/Header';
import InfoCard from '../../components/ui/InfoCard';
import InfoRow from '../../components/ui/InfoRow';

// Mock fallback data for fields not in API
const mockFallbackData = {
  age: 22, // Not in ProfileResponse
  images: [
    'https://media.licdn.com/dms/image/v2/D4E03AQEppsomLWUZgA/profile-displayphoto-scale_200_200/B4EZkMKRSMIUAA-/0/1756845653823?e=2147483647&v=beta&t=oANMmUogYztIXt7p1pB11qv-Qwh0IHYmFMZIdl9CFZE',
    'https://media.licdn.com/dms/image/v2/D4E03AQEppsomLWUZgA/profile-displayphoto-scale_200_200/B4EZkMKRSMIUAA-/0/1756845653823?e=2147483647&v=beta&t=oANMmUogYztIXt7p1pB11qv-Qwh0IHYmFMZIdl9CFZE',
    'https://media.licdn.com/dms/image/v2/D4E03AQEppsomLWUZgA/profile-displayphoto-scale_200_200/B4EZkMKRSMIUAA-/0/1756845653823?e=2147483647&v=beta&t=oANMmUogYztIXt7p1pB11qv-Qwh0IHYmFMZIdl9CFZE',
  ],
  interests: ['Hiking', 'Photography', 'Board Games', 'Business', 'Travel'], // Not in current schema
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
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const user = getCurrentUser();

    if (!user?.uid) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const profileData = await getCurrentUserProfile(user.uid);

      if (profileData) {
        console.log('Full Profile Data:', JSON.stringify(profileData, null, 2));
        console.log('LinkedIn:', profileData.linkedIn);
        console.log('Instagram:', profileData.instagram);
        console.log('Snapchat:', profileData.snapchat);
        console.log('GitHub:', profileData.github);
        console.log('Website:', profileData.website);
        setProfile(profileData);
        setError(null);
      } else {
        setError('Profile not found. Please complete your profile.');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const openURL = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', `Cannot open URL: ${url}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open link');
      console.error('Error opening URL:', error);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('Starting sign out process...');

            // Clear any stored data first
            await AsyncStorage.clear();
            console.log('AsyncStorage cleared');

            // Sign out from Firebase
            await signOutUser();
            console.log('Sign out successful');

            // Navigate to the root index page
            // Use dismiss to go back to root, then replace
            console.log('Navigating to root...');
            router.dismissAll();
            router.replace('/');
          } catch (error) {
            console.error('Sign out error:', error);
            Alert.alert(
              'Error',
              'Failed to sign out: ' +
                (error instanceof Error ? error.message : 'Unknown error')
            );
          }
        },
      },
    ]);
  };

  // Get display data - use profile data if available, otherwise fallback
  const displayName = profile?.firstName || 'User';
  const displayImages =
    profile?.pictures && profile.pictures.length > 0
      ? profile.pictures
      : mockFallbackData.images;
  const displayBio = profile?.bio || 'No bio yet';
  const displaySchool = profile?.school || 'School not set';
  const displayMajor =
    profile?.major && profile.major.length > 0
      ? profile.major.join(', ')
      : 'Major not set';
  const displayYear = profile?.year?.toString() || 'Year not set';
  const displayInstagram = profile?.instagram || null;
  const displaySnapchat = profile?.snapchat || null;
  const displayLinkedIn = profile?.linkedIn || null;
  const displayGithub = profile?.github || null;
  const displayWebsite = profile?.website || null;
  const displayClubs = profile?.clubs || [];
  const displayInterests =
    profile?.interests && profile.interests.length > 0
      ? profile.interests
      : mockFallbackData.interests;
  const displayEthnicity =
    profile?.ethnicity && profile.ethnicity.length > 0
      ? profile.ethnicity.join(', ')
      : null;

  // Show loading spinner while fetching
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={AppColors.accentDefault} />
        <AppText style={styles.loadingText}>Loading profile...</AppText>
      </SafeAreaView>
    );
  }

  // Show error message if failed to load
  if (error && !profile) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <TouchableOpacity onPress={handleSignOut}>
          <LogOut size={24} color={AppColors.foregroundDimmer} />
        </TouchableOpacity>
        <AppText style={styles.errorText}>{error}</AppText>
        <Button
          title="Go to Auth"
          onPress={() => router.replace('/home' as any)}
        />
        <Button
          title="Retry"
          onPress={fetchProfile}
          variant="primary"
          fullWidth={false}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Image
        source={{ uri: displayImages[0] }}
        style={{
          width: 124,
          height: 124,
          borderRadius: 100,
          alignSelf: 'center',
        }}
      />
      <Header
        title={displayName}
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
        <Button
          title={'Preview Profile'}
          onPress={() => {}}
          variant="primary"
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
          <AppText style={styles.sectionTitle}>Photos</AppText>
          <View style={styles.imageGrid}>
            {displayImages.map((image, index) => (
              <TouchableOpacity key={index} style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.image} />
                {index === 0 && (
                  <View style={styles.badge}>
                    <AppText style={styles.badgeText}>Main</AppText>
                  </View>
                )}
              </TouchableOpacity>
            ))}
            {displayImages.length < 5 && (
              <TouchableOpacity style={styles.addImage}>
                <Camera size={32} color={AppColors.foregroundDimmer} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Basic Info</AppText>
          <InfoCard>
            <InfoRow
              label="Name & Age"
              value={`${displayName}, ${mockFallbackData.age}`}
            />
            <InfoRow label="School" value={displaySchool} />
            <InfoRow label="Major" value={displayMajor} />
            <InfoRow label="Graduation Year" value={displayYear} />
            {displayEthnicity && profile?.showEthnicityOnProfile && (
              <InfoRow label="Ethnicity" value={displayEthnicity} />
            )}
          </InfoCard>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>About Me</AppText>
          <InfoCard>
            <AppText>{displayBio}</AppText>
          </InfoCard>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Social Media</AppText>
          <InfoCard>
            {displayLinkedIn ? (
              <TouchableOpacity
                style={styles.socialRow}
                onPress={() => openURL(displayLinkedIn)}
              >
                <Linkedin size={24} color={AppColors.accentDefault} />
                <AppText style={styles.socialText}>
                  {displayLinkedIn
                    .replace('https://', '')
                    .replace('http://', '')}
                </AppText>
                <ChevronRight size={20} color={AppColors.foregroundDimmer} />
              </TouchableOpacity>
            ) : null}
            {displayInstagram ? (
              <TouchableOpacity
                style={styles.socialRow}
                onPress={() => openURL(displayInstagram)}
              >
                <Instagram size={24} color={AppColors.negativeDefault} />
                <AppText style={styles.socialText}>
                  {displayInstagram.replace('https://instagram.com/', '@')}
                </AppText>
                <ChevronRight size={20} color={AppColors.foregroundDimmer} />
              </TouchableOpacity>
            ) : null}
            {displaySnapchat ? (
              <TouchableOpacity
                style={styles.socialRow}
                onPress={() => openURL(displaySnapchat)}
              >
                <Camera size={24} color={AppColors.negativeDimmer} />
                <AppText style={styles.socialText}>
                  {displaySnapchat.replace('https://snapchat.com/add/', '@')}
                </AppText>
                <ChevronRight size={20} color={AppColors.foregroundDimmer} />
              </TouchableOpacity>
            ) : null}
            {displayGithub ? (
              <TouchableOpacity
                style={styles.socialRow}
                onPress={() => openURL(displayGithub)}
              >
                <Github size={24} color={AppColors.foregroundDefault} />
                <AppText style={styles.socialText}>
                  {displayGithub.replace('https://github.com/', '@')}
                </AppText>
                <ChevronRight size={20} color={AppColors.foregroundDimmer} />
              </TouchableOpacity>
            ) : null}
            {displayWebsite ? (
              <TouchableOpacity
                style={styles.socialRow}
                onPress={() => openURL(displayWebsite)}
              >
                <Globe size={24} color={AppColors.accentDefault} />
                <AppText style={styles.socialText} numberOfLines={1}>
                  {displayWebsite
                    .replace('https://', '')
                    .replace('http://', '')}
                </AppText>
                <ChevronRight size={20} color={AppColors.foregroundDimmer} />
              </TouchableOpacity>
            ) : null}
            {!displayLinkedIn &&
              !displayInstagram &&
              !displaySnapchat &&
              !displayGithub &&
              !displayWebsite && (
                <AppText style={styles.noDataText}>
                  No social media added
                </AppText>
              )}
          </InfoCard>
        </View>

        {displayClubs.length > 0 && (
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Clubs & Organizations</AppText>
            <InfoCard>
              {displayClubs.map((club, index) => (
                <View key={index} style={styles.clubRow}>
                  <AppText style={styles.clubText}>• {club}</AppText>
                </View>
              ))}
            </InfoCard>
          </View>
        )}

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Interests</AppText>
          <View style={styles.interestsContainer}>
            {displayInterests.map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <AppText>{interest}</AppText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Settings</AppText>
          <InfoCard>
            <TouchableOpacity style={styles.settingRow}>
              <Bell size={24} color={AppColors.foregroundDimmer} />
              <AppText style={styles.settingText}>Notifications</AppText>
              <ChevronRight size={24} color={AppColors.foregroundDimmer} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingRow}>
              <Shield size={24} color={AppColors.foregroundDimmer} />
              <AppText style={styles.settingText}>Privacy & Safety</AppText>
              <ChevronRight size={24} color={AppColors.foregroundDimmer} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingRow}>
              <HelpCircle size={24} color={AppColors.foregroundDimmer} />
              <AppText style={styles.settingText}>Help & Support</AppText>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: AppColors.foregroundDimmer,
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: AppColors.negativeDefault,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
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
  noDataText: {
    fontSize: 14,
    color: AppColors.foregroundDimmer,
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  clubRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.backgroundDimmer,
  },
  clubText: {
    fontSize: 16,
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
