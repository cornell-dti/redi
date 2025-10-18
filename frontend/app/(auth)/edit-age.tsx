import AppText from '@/app/components/ui/AppText';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser } from '../api/authService';
import { getCurrentUserProfile, updateProfile } from '../api/profileApi';
import { AppColors } from '../components/AppColors';
import AppInput from '../components/ui/AppInput';
import EditingHeader from '../components/ui/EditingHeader';
import { useThemeAware } from '../contexts/ThemeContext';
import { calculateAge } from '../utils/profileUtils';

export default function EditAgePage() {
  useThemeAware();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [birthdate, setBirthdate] = useState<Date>(new Date());
  const [originalBirthdate, setOriginalBirthdate] = useState<Date>(new Date());
  const [age, setAge] = useState<string>('');

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
        const birthdateDate = new Date(profileData.birthdate);
        setBirthdate(birthdateDate);
        setOriginalBirthdate(birthdateDate);
        const currentAge = calculateAge(profileData.birthdate);
        setAge(currentAge.toString());
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAgeChange = (text: string) => {
    setAge(text);
    const ageNum = parseInt(text, 10);
    if (!isNaN(ageNum) && ageNum > 0) {
      // Calculate birthdate from age (assuming birthday hasn't happened yet this year)
      const today = new Date();
      const birthYear = today.getFullYear() - ageNum;
      const newBirthdate = new Date(birthYear, today.getMonth(), today.getDate());
      setBirthdate(newBirthdate);
    }
  };

  const handleSave = async () => {
    const user = getCurrentUser();
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    // Validate age (must be 18+)
    const calculatedAge = calculateAge(birthdate.toISOString());
    if (calculatedAge < 18) {
      Alert.alert('Invalid Age', 'You must be at least 18 years old');
      return;
    }

    setSaving(true);
    try {
      await updateProfile(user.uid, {
        birthdate: birthdate.toISOString(),
      });

      setOriginalBirthdate(birthdate);
      Alert.alert('Success', 'Age updated successfully');
      router.back();
    } catch (error) {
      console.error('Failed to update age:', error);
      Alert.alert('Error', 'Failed to update age');
    } finally {
      setSaving(false);
    }
  };

  const hasUnsavedChanges = () => {
    return birthdate.getTime() !== originalBirthdate.getTime();
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
        title="Edit Age"
        onSave={handleSave}
        onBack={handleBack}
        isSaving={saving}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sentence}>
          <AppText>I'm</AppText>
          <AppInput
            value={age}
            onChangeText={handleAgeChange}
            keyboardType="numeric"
            placeholder="18"
            maxLength={2}
          />
          <AppText>years old.</AppText>
        </View>
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
  sentence: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
