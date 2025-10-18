import AppInput from '@/app/components/ui/AppInput';
import AppText from '@/app/components/ui/AppText';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser } from '../api/authService';
import { getCurrentUserProfile } from '../api/profileApi';
import { AppColors } from '../components/AppColors';
import EditingHeader from '../components/ui/EditingHeader';
import { useThemeAware } from '../contexts/ThemeContext';

export default function EditHometownPage() {
  useThemeAware();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hometown, setHometown] = useState('');
  const [originalHometown, setOriginalHometown] = useState('');

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
        const hometownValue = profileData.hometown || '';
        setHometown(hometownValue);
        setOriginalHometown(hometownValue);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!hometown.trim()) {
      Alert.alert('Required', 'Please enter your hometown');
      return;
    }

    setSaving(true);
    try {
      // TODO: Implement save to backend
      // await updateProfile({ hometown: hometown.trim() });

      setOriginalHometown(hometown);
      Alert.alert('Success', 'Hometown updated successfully');
      router.back();
    } catch (error) {
      console.error('Failed to update hometown:', error);
      Alert.alert('Error', 'Failed to update hometown');
    } finally {
      setSaving(false);
    }
  };

  const hasUnsavedChanges = () => {
    return hometown.trim() !== originalHometown.trim();
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
        title="Edit Hometown"
        onSave={handleSave}
        onBack={handleBack}
        isSaving={saving}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sentence}>
            <AppText>I'm from </AppText>
            <AppInput
              placeholder="e.g., New York, NY"
              value={hometown}
              onChangeText={setHometown}
              autoCapitalize="words"
            />
            <AppText>.</AppText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  sentence: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
