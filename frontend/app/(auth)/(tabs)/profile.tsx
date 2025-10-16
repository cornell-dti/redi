import AppText from '@/app/components/ui/AppText';
import Button from '@/app/components/ui/Button';
import ListItem from '@/app/components/ui/ListItem';
import ListItemWrapper from '@/app/components/ui/ListItemWrapper';
import Sheet from '@/app/components/ui/Sheet';
import { ProfileResponse } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import {
  ChevronRight,
  ClipboardList,
  ExternalLink,
  Eye,
  Heart,
  Lock,
  LogOut,
  MailIcon,
  Pencil,
  SettingsIcon,
  ShieldCheck,
  StarIcon,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser, signOutUser } from '../../api/authService';
import { getCurrentUserProfile } from '../../api/profileApi';
import { AppColors } from '../../components/AppColors';

// Mock fallback data for fields not in API
const mockFallbackData = {
  images: [
    'https://media.licdn.com/dms/image/v2/D4E03AQEppsomLWUZgA/profile-displayphoto-scale_200_200/B4EZkMKRSMIUAA-/0/1756845653823?e=2147483647&v=beta&t=oANMmUogYztIXt7p1pB11qv-Qwh0IHYmFMZIdl9CFZE',
  ],
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSignOutSheet, setShowSignOutSheet] = useState(false);

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

  const confirmSignOut = async () => {
    try {
      console.log('Starting sign out process...');

      // Clear any stored data first
      await AsyncStorage.clear();
      console.log('AsyncStorage cleared');

      // Sign out from Firebase
      await signOutUser();
      console.log('Sign out successful');
      setShowSignOutSheet(false);
      router.replace('/home' as any);
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert(
        'Error',
        'Failed to sign out: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  };

  // Get display data - use profile data if available, otherwise fallback
  const displayName = profile?.firstName || 'User';
  const displayImages =
    profile?.pictures && profile.pictures.length > 0
      ? profile.pictures
      : mockFallbackData.images;

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
      <View style={styles.profileTop}>
        <Image source={{ uri: displayImages[0] }} style={styles.profilePic} />

        <View style={styles.nameContainer}>
          <AppText variant="title">{displayName}</AppText>
          <AppText variant="body" color="dimmer">
            Member since XXX
          </AppText>
        </View>
      </View>

      <View style={styles.sectionsWrapper}>
        <View style={styles.buttonRow}>
          <Button
            iconLeft={Pencil}
            title="Edit Profile"
            onPress={() => router.push('/edit-profile' as any)}
            fullWidth
          />

          <Button
            iconLeft={Eye}
            variant="secondary"
            title="Preview profile"
            onPress={() => {}}
            fullWidth
          />
        </View>

        <ListItemWrapper>
          <ListItem
            onPress={() => router.push('/preferences' as any)}
            title="Dating preferences"
            left={<Heart />}
            right={<ChevronRight />}
          />

          <ListItem
            onPress={() => router.push('/account-settings' as any)}
            title="Account settings"
            left={<SettingsIcon />}
            right={<ChevronRight />}
          />

          <ListItem
            onPress={() => router.push('/safety' as any)}
            title="Safety"
            left={<Lock />}
            right={<ChevronRight />}
          />
        </ListItemWrapper>

        <ListItemWrapper>
          <ListItem
            onPress={() => router.push('/terms-and-conditions' as any)}
            title="Terms & Conditions"
            left={<ClipboardList />}
            right={<ChevronRight />}
          />

          <ListItem
            onPress={() => router.push('/privacy-policy' as any)}
            title="Privacy Policy"
            left={<ShieldCheck />}
            right={<ChevronRight />}
          />

          <ListItem
            onPress={() => {}}
            title="Leave a rating"
            left={<StarIcon />}
            right={<ExternalLink />}
          />

          <ListItem
            onPress={() => router.push('/contact' as any)}
            title="Contact the team"
            left={<MailIcon />}
            right={<ChevronRight />}
          />
        </ListItemWrapper>

        <ListItemWrapper>
          <ListItem
            onPress={() => setShowSignOutSheet(true)}
            title="Sign Out"
            left={<LogOut color={AppColors.negativeDefault} />}
            right={<ChevronRight color={AppColors.negativeDefault} />}
            destructive
          />
        </ListItemWrapper>
      </View>

      <Sheet
        visible={showSignOutSheet}
        onDismiss={() => setShowSignOutSheet(false)}
        title="Sign Out"
        height={300}
      >
        <View style={styles.sheetContent}>
          <AppText>Are you sure you want to sign out?</AppText>
          <ListItemWrapper>
            <Button
              title="Sign Out"
              onPress={confirmSignOut}
              variant="negative"
              iconLeft={LogOut}
              noRound
              fullWidth
            />
            <Button
              title="Never mind"
              onPress={() => setShowSignOutSheet(false)}
              variant="secondary"
              noRound
              fullWidth
            />
          </ListItemWrapper>
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: 24,
    padding: 16,
    backgroundColor: AppColors.backgroundDefault,
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
  scrollView: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    flex: 1,
  },
  sectionsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  profileTop: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profilePic: {
    width: 128,
    height: 128,
    borderRadius: 64,
  },
  nameContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  buttonRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 16,
    maxWidth: '55%',
  },
  sheetContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  sheetText: {
    fontSize: 16,
    textAlign: 'center',
    color: AppColors.foregroundDefault,
  },
  sheetButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
});
