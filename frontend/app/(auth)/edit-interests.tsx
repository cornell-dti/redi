import AppInput from '@/app/components/ui/AppInput';
import { router } from 'expo-router';
import { Camera, Check, Gamepad2, Music, Plus } from 'lucide-react-native';
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
import EmptyState from '../components/ui/EmptyState';
import Sheet from '../components/ui/Sheet';
import Tag from '../components/ui/Tag';
import UnsavedChangesSheet from '../components/ui/UnsavedChangesSheet';
import { useTheme, useThemeAware } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';

export default function EditInterestsPage() {
  useThemeAware();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [originalInterests, setOriginalInterests] = useState<string[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [newInterest, setNewInterest] = useState('');
  const [showUnsavedChangesSheet, setShowUnsavedChangesSheet] = useState(false);
  const [animationTrigger, setAnimationTrigger] = useState(0);

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
      await updateProfile({
        interests,
      });

      setOriginalInterests(interests);

      showToast({
        icon: <Check size={20} color={AppColors.backgroundDefault} />,
        label: 'Interests updated',
      });

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

  const { themeMode } = useTheme();

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: AppColors.backgroundDefault },
      ]}
    >
      <StatusBar
        barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
      />

      <EditingHeader
        title="Edit Interests"
        onSave={handleSave}
        onBack={handleBack}
        isSaving={saving}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          interests.length === 0 ? styles.emptyContainer : undefined
        }
      >
        {interests.length === 0 ? (
          <EmptyState
            icons={[Music, Camera, Gamepad2]}
            label="No interests yet - tap below to add some!"
            triggerAnimation={animationTrigger}
          />
        ) : (
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
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          title="Add interest"
          iconLeft={Plus}
          onPress={() => {
            setSheetVisible(true);
            setAnimationTrigger((prev) => prev + 1);
          }}
          variant="secondary"
        />
      </View>

      {/* Add Interest Sheet */}
      <Sheet
        visible={sheetVisible}
        onDismiss={() => {
          setSheetVisible(false);
          setNewInterest('');
        }}
        title="Add interest"
        bottomRound={false}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetContent}
        >
          <AppInput
            placeholder="e.g., Music, Photography, Gaming"
            value={newInterest}
            onChangeText={setNewInterest}
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus={true}
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 16,
    backgroundColor: AppColors.backgroundDefault,
  },
  sheetContent: {
    gap: 16,
  },
});
