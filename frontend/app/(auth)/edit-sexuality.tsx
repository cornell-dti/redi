import { SEXUAL_ORIENTATION_OPTIONS } from '@/types/onboarding';
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

export default function EditSexualityPage() {
  useThemeAware();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedOrientation, setSelectedOrientation] = useState<string | null>(
    null
  );
  const [originalOrientation, setOriginalOrientation] = useState<string | null>(
    null
  );

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
      });

      setOriginalOrientation(selectedOrientation);
      Alert.alert('Success', 'Sexual orientation updated successfully');
      router.back();
    } catch (error) {
      console.error('Failed to update sexual orientation:', error);
      Alert.alert('Error', 'Failed to update sexual orientation');
    } finally {
      setSaving(false);
    }
  };

  const hasUnsavedChanges = () => {
    return selectedOrientation !== originalOrientation;
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
      </ScrollView>
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
});
