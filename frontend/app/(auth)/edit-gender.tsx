import { Gender } from '@/types';
import { GENDER_OPTIONS } from '@/types/onboarding';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser } from '../api/authService';
import { updateProfile } from '../api/profileApi';
import { AppColors } from '../components/AppColors';
import AppText from '../components/ui/AppText';
import EditingHeader from '../components/ui/EditingHeader';
import FooterSpacer from '../components/ui/FooterSpacer';
import ListItem from '../components/ui/ListItem';
import ListItemWrapper from '../components/ui/ListItemWrapper';
import Toggle from '../components/ui/Toggle';
import UnsavedChangesSheet from '../components/ui/UnsavedChangesSheet';
import { useProfile } from '../contexts/ProfileContext';
import { useThemeAware } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';

export default function EditGenderPage() {
  useThemeAware();
  const { showToast } = useToast();
  const { profile, refreshProfile, updateProfileData } = useProfile();
  const [saving, setSaving] = useState(false);
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null);
  const [originalGender, setOriginalGender] = useState<Gender | null>(null);
  const [showOnProfile, setShowOnProfile] = useState(true);
  const [originalShowOnProfile, setOriginalShowOnProfile] = useState(true);
  const [showUnsavedChangesSheet, setShowUnsavedChangesSheet] = useState(false);

  useEffect(() => {
    if (profile) {
      setSelectedGender(profile.gender);
      setOriginalGender(profile.gender);
      const showGenderValue = profile.showGenderOnProfile ?? true;
      setShowOnProfile(showGenderValue);
      setOriginalShowOnProfile(showGenderValue);
    }
  }, [profile]);

  const handleSave = async () => {
    const user = getCurrentUser();
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!selectedGender) {
      Alert.alert('Required', 'Please select a gender');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        gender: selectedGender,
        showGenderOnProfile: showOnProfile,
      });

      // Update context with new values
      updateProfileData({
        gender: selectedGender,
        showGenderOnProfile: showOnProfile,
      });

      setOriginalGender(selectedGender);
      setOriginalShowOnProfile(showOnProfile);

      // Refresh profile from server in background
      refreshProfile();

      showToast({
        icon: <Check size={20} color={AppColors.backgroundDefault} />,
        label: 'Gender updated',
      });

      router.back();
    } catch (error) {
      console.error('Failed to update gender:', error);
      Alert.alert('Error', 'Failed to update gender');
    } finally {
      setSaving(false);
    }
  };

  const hasUnsavedChanges = () => {
    return (
      selectedGender !== originalGender ||
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
        title="Edit Gender"
        onSave={handleSave}
        onBack={handleBack}
        isSaving={saving}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <ListItemWrapper>
          {GENDER_OPTIONS.map((gender) => (
            <ListItem
              key={gender.value}
              title={gender.label}
              selected={selectedGender === gender.value}
              onPress={() => setSelectedGender(gender.value)}
              right={
                selectedGender === gender.value ? (
                  <Check size={24} color={AppColors.accentDefault} />
                ) : null
              }
            />
          ))}
        </ListItemWrapper>

        <ListItemWrapper>
          <View style={styles.toggleContainer}>
            <View style={styles.toggleLabel}>
              <AppText variant="body">Show on profile</AppText>
            </View>
            <Toggle value={showOnProfile} onValueChange={setShowOnProfile} />
          </View>
        </ListItemWrapper>

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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: AppColors.backgroundDimmer,
    borderRadius: 6,
    marginTop: 24,
  },
  toggleLabel: {
    flex: 1,
  },
});
