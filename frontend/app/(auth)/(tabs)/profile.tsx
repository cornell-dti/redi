import OnboardingVideo from '@/app/components/onboarding/OnboardingVideo';
import AppText from '@/app/components/ui/AppText';
import Button from '@/app/components/ui/Button';
import EmptyState from '@/app/components/ui/EmptyState';
import FooterSpacer from '@/app/components/ui/FooterSpacer';
import ListItem from '@/app/components/ui/ListItem';
import ListItemWrapper from '@/app/components/ui/ListItemWrapper';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import Pressable from '@/app/components/ui/Pressable';
import Sheet from '@/app/components/ui/Sheet';
import SignOutSheet from '@/app/components/ui/SignOutSheet';
import { ProfileResponse } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import {
  ChevronRight,
  ClipboardList,
  ExternalLink,
  Eye,
  Heart,
  Lock,
  LogOut,
  MailIcon,
  Palette,
  Pencil,
  Play,
  SettingsIcon,
  ShieldCheck,
  Star,
  StarIcon,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser, signOutUser } from '../../api/authService';
import { getCurrentUserProfile } from '../../api/profileApi';
import { AppColors } from '../../components/AppColors';
import { useThemeAware } from '../../contexts/ThemeContext';

// Mock fallback data for fields not in API
const mockFallbackData = {
  images: [
    'https://media.licdn.com/dms/image/v2/D4E03AQEppsomLWUZgA/profile-displayphoto-scale_200_200/B4EZkMKRSMIUAA-/0/1756845653823?e=2147483647&v=beta&t=oANMmUogYztIXt7p1pB11qv-Qwh0IHYmFMZIdl9CFZE',
  ],
};

export default function ProfileScreen() {
  const [animationTrigger, setAnimationTrigger] = useState(0);

  useThemeAware(); // Force re-render when theme changes
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSignOutSheet, setShowSignOutSheet] = useState(false);
  const [showRatingSheet, setShowRatingSheet] = useState(false);
  const [showOnboardingVideo, setShowOnboardingVideo] = useState(false);

  const fetchProfile = useCallback(async () => {
    const user = getCurrentUser();

    if (!user?.uid) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const profileData = await getCurrentUserProfile();

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
  }, []);

  // Fetch profile data when screen is focused (including returning from edit screen)
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      setAnimationTrigger((prev) => prev + 1);
    }, [fetchProfile])
  );

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

  // Format member since date
  const getMemberSinceText = (): string => {
    const user = getCurrentUser();

    // Try to use createdAt from profile first
    if (profile && 'createdAt' in profile && profile.createdAt) {
      const date = new Date(profile.createdAt);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    // Fall back to Firebase user creation time
    if (user?.metadata?.creationTime) {
      const date = new Date(user.metadata.creationTime);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    return 'Recently';
  };

  // Show loading spinner while fetching
  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: AppColors.backgroundDefault },
        ]}
      >
        <LoadingSpinner />
        <AppText style={styles.loadingText}>Loading profile...</AppText>
      </SafeAreaView>
    );
  }

  // Show error message if failed to load
  if (error && !profile) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: AppColors.backgroundDefault },
        ]}
      >
        <AppText style={styles.errorText}>{error}</AppText>
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
    <View
      style={[
        styles.container,
        { backgroundColor: AppColors.backgroundDefault },
      ]}
    >
      <StatusBar barStyle="dark-content" />

      <ScrollView style={styles.scrollView}>
        <View style={styles.profileTop}>
          <Pressable onPress={() => router.push('/edit-profile' as any)}>
            <Image
              source={{ uri: displayImages[0] }}
              style={styles.profilePic}
            />
          </Pressable>

          <View style={styles.nameContainer}>
            <AppText variant="title">{displayName}</AppText>
            <AppText variant="body" color="dimmer">
              Member since {getMemberSinceText()}
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
              title="Preview Profile"
              onPress={() => router.push('/profile-preview' as any)}
              fullWidth
            />
          </View>

          <ListItemWrapper>
            <ListItem
              onPress={() => router.push('/preferences' as any)}
              title="Dating Preferences"
              right={
                <ChevronRight color={AppColors.foregroundDimmer} size={20} />
              }
              left={<Heart color={AppColors.foregroundDefault} size={20} />}
            />

            <ListItem
              onPress={() => router.push('/appearance' as any)}
              title="Appearance"
              right={
                <ChevronRight color={AppColors.foregroundDimmer} size={20} />
              }
              left={<Palette color={AppColors.foregroundDefault} size={20} />}
            />

            <ListItem
              onPress={() => router.push('/account-settings' as any)}
              title="Account Settings"
              right={
                <ChevronRight color={AppColors.foregroundDimmer} size={20} />
              }
              left={
                <SettingsIcon color={AppColors.foregroundDefault} size={20} />
              }
            />

            <ListItem
              onPress={() => router.push('/safety' as any)}
              title="Safety"
              right={
                <ChevronRight color={AppColors.foregroundDimmer} size={20} />
              }
              left={<Lock color={AppColors.foregroundDefault} size={20} />}
            />
          </ListItemWrapper>

          <ListItemWrapper>
            <ListItem
              onPress={() => setShowOnboardingVideo(true)}
              title="Show Onboarding Video"
              right={
                <ChevronRight color={AppColors.foregroundDimmer} size={20} />
              }
              left={<Play color={AppColors.foregroundDefault} size={20} />}
            />

            <ListItem
              onPress={() => router.push('/terms-and-conditions' as any)}
              title="Terms & Conditions"
              right={
                <ChevronRight color={AppColors.foregroundDimmer} size={20} />
              }
              left={
                <ClipboardList color={AppColors.foregroundDefault} size={20} />
              }
            />

            <ListItem
              onPress={() => router.push('/privacy-policy' as any)}
              title="Privacy Policy"
              right={
                <ChevronRight color={AppColors.foregroundDimmer} size={20} />
              }
              left={
                <ShieldCheck color={AppColors.foregroundDefault} size={20} />
              }
            />

            <ListItem
              onPress={() => setShowRatingSheet(true)}
              title="Leave a Rating"
              right={
                <ExternalLink color={AppColors.foregroundDefault} size={20} />
              }
              left={<StarIcon color={AppColors.foregroundDefault} size={20} />}
            />

            <ListItem
              onPress={() => router.push('/contact' as any)}
              title="Contact the Team"
              right={
                <ChevronRight color={AppColors.foregroundDimmer} size={20} />
              }
              left={<MailIcon color={AppColors.foregroundDefault} size={20} />}
            />
          </ListItemWrapper>

          <ListItemWrapper>
            <ListItem
              onPress={() => setShowSignOutSheet(true)}
              title="Sign Out"
              right={
                <ChevronRight color={AppColors.negativeDefault} size={20} />
              }
              left={<LogOut color={AppColors.negativeDefault} size={20} />}
              destructive
            />
          </ListItemWrapper>
        </View>

        <FooterSpacer height={32} />
      </ScrollView>

      <SignOutSheet
        visible={showSignOutSheet}
        onDismiss={() => setShowSignOutSheet(false)}
        onConfirm={confirmSignOut}
      />

      {/* Leave a Rating Sheet */}
      <Sheet
        visible={showRatingSheet}
        onDismiss={() => setShowRatingSheet(false)}
        title="Leave a Rating"
      >
        <View style={styles.sheetContent}>
          <EmptyState
            icon={Star}
            label="Coming soon..."
            triggerAnimation={animationTrigger}
          />
          <Button
            title="Dismiss"
            onPress={() => setShowRatingSheet(false)}
            variant="secondary"
            fullWidth
          />
        </View>
      </Sheet>

      {/* Onboarding Video */}
      <OnboardingVideo
        visible={showOnboardingVideo}
        onFinish={() => setShowOnboardingVideo(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: 24,
    paddingTop: 64,
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
    padding: 16,
  },
  sectionsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    paddingBottom: 64,
  },
  profileTop: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
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
    paddingVertical: 48,
    borderRadius: 24,
  },
  sheetButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
});
