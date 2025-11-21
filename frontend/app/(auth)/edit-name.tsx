import AppInput from '@/app/components/ui/AppInput';
import AppText from '@/app/components/ui/AppText';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
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
import { getCurrentUserProfile, updateProfile } from '../api/profileApi';
import { AppColors } from '../components/AppColors';
import EditingHeader from '../components/ui/EditingHeader';
import FooterSpacer from '../components/ui/FooterSpacer';
import UnsavedChangesSheet from '../components/ui/UnsavedChangesSheet';
import { useThemeAware } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';

export default function EditNamePage() {
  useThemeAware();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [originalFirstName, setOriginalFirstName] = useState('');
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
        const firstNameValue = profileData.firstName || '';
        setFirstName(firstNameValue);
        setOriginalFirstName(firstNameValue);
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

    if (!firstName.trim()) {
      Alert.alert('Required', 'Please enter your first name');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
      });

      setOriginalFirstName(firstName);

      showToast({
        icon: <Check size={20} color={AppColors.backgroundDefault} />,
        label: 'Name updated',
      });

      router.back();
    } catch (error) {
      console.error('Failed to update name:', error);
      Alert.alert('Error', 'Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  const hasUnsavedChanges = () => {
    return firstName.trim() !== originalFirstName.trim();
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
    <SafeAreaView style={[styles.container, { backgroundColor: AppColors.backgroundDefault }]}>
      <StatusBar barStyle="dark-content" />

      <EditingHeader
        title="Edit Name"
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
            <AppText>My name is </AppText>
            <AppInput
              placeholder="Ezra"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              style={{ width: 200 }}
            />
            <AppText>.</AppText>
          </View>

          <FooterSpacer />
        </ScrollView>
      </KeyboardAvoidingView>

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
