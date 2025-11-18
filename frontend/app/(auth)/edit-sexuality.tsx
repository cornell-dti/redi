import { SEXUAL_ORIENTATION_OPTIONS } from '@/types/onboarding';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser } from '../api/authService';
import { getCurrentUserProfile, updateProfile } from '../api/profileApi';
import { AppColors } from '../components/AppColors';
import AppText from '../components/ui/AppText';
import Checkbox from '../components/ui/Checkbox';
import EditingHeader from '../components/ui/EditingHeader';
import FooterSpacer from '../components/ui/FooterSpacer';
import ListItem from '../components/ui/ListItem';
import ListItemWrapper from '../components/ui/ListItemWrapper';
import UnsavedChangesSheet from '../components/ui/UnsavedChangesSheet';
import { useThemeAware } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';

export default function EditSexualityPage() {
  useThemeAware();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedOrientation, setSelectedOrientation] = useState<string | null>(
    null
  );
  const [originalOrientation, setOriginalOrientation] = useState<string | null>(
    null
  );
  const [showOnProfile, setShowOnProfile] = useState(true);
  const [originalShowOnProfile, setOriginalShowOnProfile] = useState(true);
  const [showUnsavedChangesSheet, setShowUnsavedChangesSheet] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const user = getCurrentUser();
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const profileData = await getCurrentUserProfile();

      if (profileData) {
        // Get the first orientation if it exists, or null
        const orientation = profileData.sexualOrientation?.[0] || null;
        setSelectedOrientation(orientation);
        setOriginalOrientation(orientation);
        const showOrientationValue =
          profileData.showSexualOrientationOnProfile ?? true;
        setShowOnProfile(showOrientationValue);
        setOriginalShowOnProfile(showOrientationValue);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const user = getCurrentUser();
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!selectedOrientation) {
      Alert.alert('Required', 'Please select a sexual orientation');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        sexualOrientation: [selectedOrientation],
        showSexualOrientationOnProfile: showOnProfile,
      });

      setOriginalOrientation(selectedOrientation);
      setOriginalShowOnProfile(showOnProfile);

      showToast({
        icon: <Check size={20} color={AppColors.backgroundDefault} />,
        label: 'Sexual orientation updated',
      });

      router.back();
    } catch (error) {
      console.error('Failed to update sexual orientation:', error);
      Alert.alert('Error', 'Failed to update sexual orientation');
    } finally {
      setSaving(false);
    }
  };

  const hasUnsavedChanges = () => {
    return (
      selectedOrientation !== originalOrientation ||
      showOnProfile !== originalShowOnProfile
    );
  };

  const handleBack = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedChangesSheet(true);
    } else {
      router.back();
    }
  };

  const handleSaveAndExit = async () => {
    await handleSave();
  };

  const handleDiscardChanges = () => {
    setShowUnsavedChangesSheet(false);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <EditingHeader
        title="Edit Sexuality"
        onSave={handleSave}
        onBack={handleBack}
        isSaving={saving}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <ListItemWrapper>
          {SEXUAL_ORIENTATION_OPTIONS.map((orientation) => (
            <ListItem
              key={orientation}
              title={orientation}
              selected={selectedOrientation === orientation}
              onPress={() => setSelectedOrientation(orientation)}
              right={
                selectedOrientation === orientation ? (
                  <Check size={24} color={AppColors.accentDefault} />
                ) : null
              }
            />
          ))}
        </ListItemWrapper>

        <View style={styles.checkboxSection}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setShowOnProfile(!showOnProfile)}
          >
            <Checkbox
              value={showOnProfile}
              onValueChange={setShowOnProfile}
              color={showOnProfile ? AppColors.accentDefault : undefined}
            />
            <AppText variant="body" style={styles.checkboxLabel}>
              Show on my profile
            </AppText>
          </TouchableOpacity>
        </View>

        <FooterSpacer />
      </ScrollView>

      {/* Unsaved Changes Sheet */}
      <UnsavedChangesSheet
        visible={showUnsavedChangesSheet}
        onSave={handleSaveAndExit}
        onDiscard={handleDiscardChanges}
        onDismiss={() => setShowUnsavedChangesSheet(false)}
      />
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
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  checkboxSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  checkboxRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxLabel: {
    textAlign: 'center',
  },
});
