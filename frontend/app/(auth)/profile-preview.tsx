import { getCurrentUser } from '@/app/api/authService';
import { getCurrentUserProfile } from '@/app/api/profileApi';
import { AppColors } from '@/app/components/AppColors';
import ProfileView from '@/app/components/profile/ProfileView';
import AppText from '@/app/components/ui/AppText';
import Button from '@/app/components/ui/Button';
import { ProfileResponse } from '@/types';
import { router } from 'expo-router';
import { ChevronLeft, PencilIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Profile Preview Page
 * Shows how your profile appears to other users
 */
export default function ProfilePreviewScreen() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={AppColors.accentDefault} />
        <AppText style={styles.loadingText}>Loading profile...</AppText>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <StatusBar barStyle="dark-content" />
        <AppText style={styles.errorText}>
          {error || 'Failed to load profile'}
        </AppText>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          variant="secondary"
          fullWidth={false}
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

  // Main content
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header with back button */}
      <View style={styles.header}>
        <Button
          title="Exit preview"
          iconLeft={ChevronLeft}
          onPress={() => router.back()}
          variant="secondary"
        />

        <Button
          title="Edit profile"
          iconLeft={PencilIcon}
          onPress={() => router.push('/edit-profile' as any)}
          variant="secondary"
        />
      </View>

      {/* Profile view */}
      <ProfileView profile={profile} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  header: {
    display: 'flex',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40, // Same as back button to center the title
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
});
