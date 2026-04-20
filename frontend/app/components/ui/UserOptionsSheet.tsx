import { blockUser, getBlockedUsers, unblockUser } from '@/app/api/blockingApi';
import { createReport } from '@/app/api/reportsApi';
import { AppColors } from '@/app/components/AppColors';
import { ReportReason } from '@/types';
import auth from '@react-native-firebase/auth';
import { Ban, Check, Flag } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useToast } from '../../contexts/ToastContext';
import AppInput from './AppInput';
import AppText from './AppText';
import Button from './Button';
import ListItem from './ListItem';
import ListItemWrapper from './ListItemWrapper';
import Sheet from './Sheet';

type SheetView = 'menu' | 'report' | 'block';

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'spam', label: 'Spam' },
  { value: 'fake_profile', label: 'Fake Profile' },
  { value: 'other', label: 'Other' },
];

interface UserOptionsSheetProps {
  visible: boolean;
  onDismiss: () => void;
  netid: string;
  firstName: string;
}

export default function UserOptionsSheet({
  visible,
  onDismiss,
  netid,
  firstName,
}: UserOptionsSheetProps) {
  const { showToast } = useToast();
  const [sheetView, setSheetView] = useState<SheetView>('menu');
  const [reportReason, setReportReason] = useState<ReportReason>('inappropriate_content');
  const [reportText, setReportText] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const currentNetid = auth().currentUser?.email?.split('@')[0] || '';

  useEffect(() => {
    if (visible && netid && currentNetid) {
      getBlockedUsers(currentNetid)
        .then((res) => setIsBlocked(res.blockedUsers.includes(netid)))
        .catch(() => {});
    }
  }, [visible, netid, currentNetid]);

  const handleDismiss = () => {
    onDismiss();
    setTimeout(() => {
      setSheetView('menu');
      setReportText('');
      setReportReason('inappropriate_content');
    }, 300);
  };

  const handleSubmitReport = async () => {
    if (!netid) return;
    try {
      setIsSubmittingReport(true);
      await createReport({
        reportedNetid: netid,
        reason: reportReason,
        description: reportText.trim(),
      });
      showToast({
        icon: <Check size={20} color={AppColors.backgroundDefault} />,
        label: 'Report submitted',
      });
      handleDismiss();
    } catch (err: any) {
      showToast({
        icon: <Flag size={20} color={AppColors.backgroundDefault} />,
        label: err.message || 'Failed to submit report. Please try again.',
      });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!netid) return;
    try {
      setBlocking(true);
      if (isBlocked) {
        await unblockUser(netid);
        setIsBlocked(false);
        showToast({
          icon: <Check size={20} color={AppColors.backgroundDefault} />,
          label: `Unblocked ${firstName}`,
        });
      } else {
        await blockUser(netid);
        setIsBlocked(true);
        showToast({
          icon: <Check size={20} color={AppColors.backgroundDefault} />,
          label: `Blocked ${firstName}`,
        });
      }
      handleDismiss();
    } catch (error: any) {
      showToast({
        icon: <Ban size={20} color={AppColors.backgroundDefault} />,
        label: error.message || `Failed to ${isBlocked ? 'unblock' : 'block'} user`,
      });
    } finally {
      setBlocking(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      onDismiss={handleDismiss}
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
        <View style={{ gap: 16 }}>
          <AppInput
            label="Describe the issue (10-1000 characters)"
            placeholder="Please add some details..."
            value={reportText}
            onChangeText={setReportText}
            multiline
            numberOfLines={4}
            style={{ height: 128 }}
          />
          <View style={{ gap: 8 }}>
            <ListItemWrapper>
              {REPORT_REASONS.map((reason) => (
                <ListItem
                  selected={reportReason === reason.value}
                  key={reason.value}
                  title={reason.label}
                  onPress={() => setReportReason(reason.value)}
                  right={
                    reportReason === reason.value
                      ? <Check size={20} color={AppColors.accentDefault} />
                      : null
                  }
                />
              ))}
            </ListItemWrapper>
          </View>
          <View style={{ gap: 12 }}>
            <Button
              title={isSubmittingReport ? 'Submitting...' : 'Submit Report'}
              onPress={handleSubmitReport}
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
        <View style={{ gap: 16 }}>
          <AppText>
            {isBlocked
              ? `Unblock ${firstName}? They will be able to see your profile and match with you again.`
              : `${firstName} will no longer be able to see your profile or match with you. This action can be undone in settings.`}
          </AppText>
          <View style={{ gap: 12 }}>
            <Button
              title={
                blocking
                  ? isBlocked ? 'Unblocking...' : 'Blocking...'
                  : isBlocked ? 'Unblock User' : 'Block User'
              }
              onPress={handleBlockToggle}
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
  );
}
