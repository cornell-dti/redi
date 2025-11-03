import { getNudgeStatus, sendNudge } from '@/app/api/nudgesApi';
import { getProfileByNetid } from '@/app/api/profileApi';
import { createReport } from '@/app/api/reportsApi';
import { AppColors } from '@/app/components/AppColors';
import ProfileView from '@/app/components/profile/ProfileView';
import AppInput from '@/app/components/ui/AppInput';
import AppText from '@/app/components/ui/AppText';
import Button from '@/app/components/ui/Button';
import ListItem from '@/app/components/ui/ListItem';
import Sheet from '@/app/components/ui/Sheet';
import { useToast } from '@/app/contexts/ToastContext';
import { NudgeStatusResponse, ProfileResponse, ReportReason } from '@/types';
import auth from '@react-native-firebase/auth';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Ban, Check, Flag, MoreVertical } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { blockUser, getBlockedUsers, unblockUser } from '../api/blockingApi';
import IconButton from '../components/ui/IconButton';
import ListItemWrapper from '../components/ui/ListItemWrapper';

/**
 * View Profile Page
 * Shows another user's profile by their netid
 */
type SheetView = 'menu' | 'report' | 'block';

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'spam', label: 'Spam' },
  { value: 'fake_profile', label: 'Fake Profile' },
  { value: 'other', label: 'Other' },
];

export default function ViewProfileScreen() {
  const { showToast } = useToast();
  const { netid, promptId } = useLocalSearchParams<{
    netid: string;
    promptId?: string;
  }>();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [sheetView, setSheetView] = useState<SheetView>('menu');
  const [reportReason, setReportReason] = useState<ReportReason>(
    'inappropriate_content'
  );
  const [reportText, setReportText] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [nudgeStatus, setNudgeStatus] = useState<NudgeStatusResponse | null>(
    null
  );
  const [isNudging, setIsNudging] = useState(false);

  const user = auth().currentUser;
  const currentNetid = user?.email?.split('@')[0] || '';
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  useEffect(() => {
    if (netid) {
      fetchProfile();
      checkIfBlocked();
      if (promptId) {
        fetchNudgeStatus();
      }
    } else {
      setError('No user specified');
      setLoading(false);
    }
  }, [netid, promptId]);

  const checkIfBlocked = async () => {
    if (!netid || !currentNetid) return;

    try {
      const response = await getBlockedUsers(currentNetid);
      setIsBlocked(response.blockedUsers.includes(netid));
    } catch (error) {
      console.error('Error checking blocked status:', error);
    }
  };

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

  const fetchNudgeStatus = async () => {
    if (!netid || !promptId) return;

    try {
      const status = await getNudgeStatus(promptId, netid);
      setNudgeStatus(status);
    } catch (error) {
      console.error('Error fetching nudge status:', error);
      // Don't set nudgeStatus on error - just leave it null
    }
  };

  const handleNudge = async () => {
    if (!netid || !promptId || isNudging) return;

    try {
      setIsNudging(true);
      await sendNudge(netid, promptId);

      // Refresh nudge status after sending
      await fetchNudgeStatus();

      showToast({
        icon: <Check size={20} color={AppColors.backgroundDefault} />,
        label: `Nudged ${profile?.firstName}!`,
      });
    } catch (error: any) {
      console.error('Error sending nudge:', error);
      showToast({
        icon: <Ban size={20} color={AppColors.backgroundDefault} />,
        label: error.message || 'Failed to send nudge. Please try again.',
      });
    } finally {
      setIsNudging(false);
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
            icon={ArrowLeft}
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
        showNudgeButton={!!promptId}
        onNudge={handleNudge}
        nudgeSent={nudgeStatus?.sent || false}
        nudgeDisabled={nudgeStatus?.mutual || isNudging}
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
              : isBlocked
                ? 'Unblock user'
                : 'Block user'
        }
      >
        {sheetView === 'menu' && (
          <ListItemWrapper>
            <ListItem
              title="Report"
              left={<Flag size={20} color={AppColors.negativeDefault} />}
              onPress={() => setSheetView('report')}
              destructive
            />
            <ListItem
              title={isBlocked ? 'Unblock' : 'Block'}
              left={<Ban size={20} color={AppColors.negativeDefault} />}
              onPress={() => setSheetView('block')}
              destructive
            />
          </ListItemWrapper>
        )}

        {sheetView === 'report' && (
          <View style={styles.sheetContent}>
            <AppText>
              Help us understand what&apos;s wrong with this profile. Your
              report is anonymous.
            </AppText>

            {/* Reason selector */}
            <View style={styles.reasonSelector}>
              <AppText indented color="dimmer">
                Reason:
              </AppText>
              <ListItemWrapper>
                {REPORT_REASONS.map((reason) => (
                  <ListItem
                    selected={reportReason === reason.value}
                    key={reason.value}
                    title={reason.label}
                    onPress={() => setReportReason(reason.value)}
                    right={
                      reportReason === reason.value ? (
                        <Check size={20} color={AppColors.accentDefault} />
                      ) : null
                    }
                  />
                ))}
              </ListItemWrapper>
            </View>

            <AppInput
              label="Describe the issue (10-1000 characters)"
              placeholder="Please add some details..."
              value={reportText}
              onChangeText={setReportText}
              multiline
              numberOfLines={4}
              style={{ height: 128 }}
            />
            <View style={styles.buttonRow}>
              <Button
                title={isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                onPress={async () => {
                  if (!netid) return;

                  try {
                    setIsSubmittingReport(true);
                    await createReport({
                      reportedNetid: netid,
                      reason: reportReason,
                      description: reportText.trim(),
                    });

                    showToast({
                      icon: (
                        <Check size={20} color={AppColors.backgroundDefault} />
                      ),
                      label: 'Report submitted',
                    });

                    setShowOptionsSheet(false);
                    setTimeout(() => {
                      setSheetView('menu');
                      setReportText('');
                      setReportReason('inappropriate_content');
                    }, 300);
                  } catch (err: any) {
                    console.error('Error submitting report:', err);
                    showToast({
                      icon: (
                        <Flag size={20} color={AppColors.backgroundDefault} />
                      ),
                      label:
                        err.message ||
                        'Failed to submit report. Please try again.',
                    });
                  } finally {
                    setIsSubmittingReport(false);
                  }
                }}
                variant="negative"
                disabled={
                  !reportText.trim() ||
                  reportText.trim().length < 10 ||
                  isSubmittingReport
                }
                iconLeft={Flag}
              />
              <Button
                title="Cancel"
                onPress={() => {
                  setSheetView('menu');
                  setReportText('');
                  setReportReason('inappropriate_content');
                }}
                variant="secondary"
                disabled={isSubmittingReport}
              />
            </View>
          </View>
        )}

        {sheetView === 'block' && (
          <View style={styles.sheetContent}>
            <AppText>
              {isBlocked
                ? `Unblock ${profile?.firstName}? They will be able to see your profile and match with you again.`
                : `${profile?.firstName} will no longer be able to see your profile or match with you. This action can be undone in settings.`}
            </AppText>

            <View style={styles.buttonRow}>
              <Button
                title={
                  blocking
                    ? isBlocked
                      ? 'Unblocking...'
                      : 'Blocking...'
                    : isBlocked
                      ? 'Unblock User'
                      : 'Block User'
                }
                onPress={async () => {
                  if (!netid) return;

                  try {
                    setBlocking(true);

                    if (isBlocked) {
                      await unblockUser(netid);
                      setIsBlocked(false);
                      showToast({
                        icon: (
                          <Check
                            size={20}
                            color={AppColors.backgroundDefault}
                          />
                        ),
                        label: `Unblocked ${profile?.firstName}`,
                      });
                    } else {
                      await blockUser(netid);
                      setIsBlocked(true);
                      showToast({
                        icon: (
                          <Check
                            size={20}
                            color={AppColors.backgroundDefault}
                          />
                        ),
                        label: `Blocked ${profile?.firstName}`,
                      });
                    }

                    setShowOptionsSheet(false);
                    setTimeout(() => setSheetView('menu'), 300);
                  } catch (error: any) {
                    showToast({
                      icon: (
                        <Ban size={20} color={AppColors.backgroundDefault} />
                      ),
                      label:
                        error.message ||
                        `Failed to ${isBlocked ? 'unblock' : 'block'} user`,
                    });
                  } finally {
                    setBlocking(false);
                  }
                }}
                variant="negative"
                iconLeft={Ban}
                disabled={blocking}
              />
              <Button
                title="Cancel"
                onPress={() => setSheetView('menu')}
                variant="secondary"
                disabled={blocking}
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
  reasonSelector: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.foregroundDefault,
  },
  radioSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: AppColors.accentDefault,
    borderWidth: 2,
    borderColor: AppColors.accentDefault,
  },
  radioUnselected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: AppColors.foregroundDimmer,
  },
});
