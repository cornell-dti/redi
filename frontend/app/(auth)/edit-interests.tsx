import AppInput from '@/app/components/ui/AppInput';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
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
import Button from '../components/ui/Button';
import EditingHeader from '../components/ui/EditingHeader';
import Sheet from '../components/ui/Sheet';
import Tag from '../components/ui/Tag';
import { useThemeAware } from '../contexts/ThemeContext';

export default function EditInterestsPage() {
  useThemeAware();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [originalInterests, setOriginalInterests] = useState<string[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [newInterest, setNewInterest] = useState('');

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
        const interestsData = profileData.interests || [];
        setInterests(interestsData);
        setOriginalInterests(interestsData);
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

    setSaving(true);
    try {
      await updateProfile( {
        interests,
      });

      setOriginalInterests(interests);
      Alert.alert('Success', 'Interests updated successfully');
      router.back();
    } catch (error) {
      console.error('Failed to update interests:', error);
      Alert.alert('Error', 'Failed to update interests');
    } finally {
      setSaving(false);
    }
  };

  const hasUnsavedChanges = () => {
    return JSON.stringify(interests) !== JSON.stringify(originalInterests);
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

  const addInterest = () => {
    if (newInterest.trim()) {
      if (!interests.includes(newInterest.trim())) {
        setInterests([...interests, newInterest.trim()]);
        setNewInterest('');
        setSheetVisible(false);
      } else {
        Alert.alert('Duplicate', 'This interest already exists');
      }
    }
  };

  const removeInterest = (interestToRemove: string) => {
    setInterests(interests.filter((interest) => interest !== interestToRemove));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <EditingHeader
        title="Edit Interests"
        onSave={handleSave}
        onBack={handleBack}
        isSaving={saving}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tagsContainer}>
          {interests.map((interest) => (
            <Tag
              key={interest}
              label={interest}
              variant="gray"
              dismissible
              onDismiss={() => removeInterest(interest)}
            />
          ))}
        </View>

        <Button
          title="Add interest"
          iconLeft={Plus}
          onPress={() => setSheetVisible(true)}
          variant="secondary"
        />
      </ScrollView>

      {/* Add Interest Sheet */}
      <Sheet
        visible={sheetVisible}
        onDismiss={() => {
          setSheetVisible(false);
          setNewInterest('');
        }}
        title="Add interest"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetContent}
        >
          <AppInput
            placeholder="e.g., Photography, Hiking, Cooking"
            value={newInterest}
            onChangeText={setNewInterest}
            autoCapitalize="words"
            autoCorrect={false}
          />
          <Button
            title="Add"
            onPress={addInterest}
            variant="primary"
            iconLeft={Plus}
            disabled={!newInterest.trim()}
          />
        </KeyboardAvoidingView>
      </Sheet>
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  sheetContent: {
    gap: 16,
  },
});
