import { Gender } from '@/types';
import { GENDER_OPTIONS } from '@/types/onboarding';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser } from '../api/authService';
import { getCurrentUserProfile, updateProfile } from '../api/profileApi';
import { AppColors } from '../components/AppColors';
import EditingHeader from '../components/ui/EditingHeader';
import ListItem from '../components/ui/ListItem';
import ListItemWrapper from '../components/ui/ListItemWrapper';
import { useThemeAware } from '../contexts/ThemeContext';

export default function EditGenderPage() {
  useThemeAware();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null);
  const [originalGender, setOriginalGender] = useState<Gender | null>(null);

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
      const profileData = await getCurrentUserProfile(user.uid);

      if (profileData) {
        setSelectedGender(profileData.gender);
        setOriginalGender(profileData.gender);
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

    if (!selectedGender) {
      Alert.alert('Required', 'Please select a gender');
      return;
    }

    setSaving(true);
    try {
      await updateProfile(user.uid, {
        gender: selectedGender,
      });

      setOriginalGender(selectedGender);
      Alert.alert('Success', 'Gender updated successfully');
      router.back();
    } catch (error) {
      console.error('Failed to update gender:', error);
      Alert.alert('Error', 'Failed to update gender');
    } finally {
      setSaving(false);
    }
  };

  const hasUnsavedChanges = () => {
    return selectedGender !== originalGender;
  };

  const handleBack = () => {
    if (hasUnsavedChanges()) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to discard them?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
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
      </ScrollView>
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
});
