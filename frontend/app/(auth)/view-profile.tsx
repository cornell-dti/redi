import { getProfileByNetid } from '@/app/api/profileApi';
import { AppColors } from '@/app/components/AppColors';
import ProfileView from '@/app/components/profile/ProfileView';
import AppInput from '@/app/components/ui/AppInput';
import AppText from '@/app/components/ui/AppText';
import Button from '@/app/components/ui/Button';
import ListItem from '@/app/components/ui/ListItem';
import Sheet from '@/app/components/ui/Sheet';
import { ProfileResponse } from '@/types';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AlertTriangle,
  Ban,
  ChevronLeft,
  Flag,
  MoreVertical,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import IconButton from '../components/ui/IconButton';
import ListItemWrapper from '../components/ui/ListItemWrapper';

/**
 * View Profile Page
 * Shows another user's profile by their netid
 */
type SheetView = 'menu' | 'report' | 'block';

export default function ViewProfileScreen() {
  const { netid } = useLocalSearchParams<{ netid: string }>();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [sheetView, setSheetView] = useState<SheetView>('menu');
  const [reportText, setReportText] = useState('');

  useEffect(() => {
    if (netid) {
      fetchProfile();
    } else {
      setError('No user specified');
      setLoading(false);
    }
  }, [netid]);

  const fetchProfile = async () => {
    if (!netid) return;

    try {
      setLoading(true);
      const profileData = await getProfileByNetid(netid);

      if (profileData) {
        setProfile(profileData);
        setError(null);
      } else {
        setError('Profile not found.');
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

      <View style={styles.content}>
        <View style={styles.header}>
          <IconButton
            icon={ChevronLeft}
            onPress={() => router.back()}
            variant="secondary"
          />

          <IconButton
            icon={MoreVertical}
            onPress={() => setShowOptionsSheet(true)}
            variant="secondary"
          />
        </View>
      </View>

      {/* Profile view */}
      <ProfileView
        profile={profile}
        showNudgeButton={true}
        onNudge={() => console.log('Nudge user:', netid)}
      />

      {/* More Options Sheet */}
      <Sheet
        visible={showOptionsSheet}
        onDismiss={() => {
          setShowOptionsSheet(false);
          // Reset to menu view when closing
          setTimeout(() => setSheetView('menu'), 300);
        }}
        title={
          sheetView === 'menu'
            ? 'More options'
            : sheetView === 'report'
              ? 'Report user'
              : 'Block user'
        }
      >
        {sheetView === 'menu' && (
          <ListItemWrapper>
            <ListItem
              title="Report"
              left={
                <AlertTriangle size={20} color={AppColors.negativeDefault} />
              }
              onPress={() => setSheetView('report')}
              destructive
            />
            <ListItem
              title="Block"
              left={<Ban size={20} color={AppColors.negativeDefault} />}
              onPress={() => setSheetView('block')}
              destructive
            />
          </ListItemWrapper>
        )}

        {sheetView === 'report' && (
          <View style={styles.sheetContent}>
            <AppText>
              Help us understand what's wrong with this profile. Your report is
              anonymous.
            </AppText>
            <AppInput
              placeholder="Describe the issue..."
              value={reportText}
              onChangeText={setReportText}
              multiline
              numberOfLines={4}
              style={{ minHeight: 128 }}
            />
            <View style={styles.buttonRow}>
              <Button
                title="Submit Report"
                onPress={() => {
                  console.log('Report submitted:', reportText);
                  setShowOptionsSheet(false);
                  setTimeout(() => {
                    setSheetView('menu');
                    setReportText('');
                  }, 300);
                }}
                variant="negative"
                disabled={!reportText.trim()}
                iconLeft={Flag}
              />
              <Button
                title="Cancel"
                onPress={() => {
                  setSheetView('menu');
                  setReportText('');
                }}
                variant="secondary"
              />
            </View>
          </View>
        )}

        {sheetView === 'block' && (
          <View style={styles.sheetContent}>
            <AppText>
              {profile?.firstName} will no longer be able to see your profile or
              match with you. This action can be undone in settings.
            </AppText>

            <View style={styles.buttonRow}>
              <Button
                title="Block User"
                onPress={() => {
                  console.log('User blocked:', netid);
                  setShowOptionsSheet(false);
                  setTimeout(() => setSheetView('menu'), 300);
                }}
                variant="negative"
                iconLeft={Ban}
              />
              <Button
                title="Cancel"
                onPress={() => setSheetView('menu')}
                variant="secondary"
              />
            </View>
          </View>
        )}
      </Sheet>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: 16,
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
  optionsContainer: {
    gap: 8,
  },
  sheetContent: {
    gap: 16,
    flex: 1,
  },
  buttonRow: {
    display: 'flex',
    gap: 12,
  },
});
