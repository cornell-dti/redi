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

export default function EditClubsPage() {
  useThemeAware();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clubs, setClubs] = useState<string[]>([]);
  const [originalClubs, setOriginalClubs] = useState<string[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [newClub, setNewClub] = useState('');

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
        const clubsData = profileData.clubs || [];
        setClubs(clubsData);
        setOriginalClubs(clubsData);
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
        clubs,
      });

      setOriginalClubs(clubs);
      Alert.alert('Success', 'Clubs updated successfully');
      router.back();
    } catch (error) {
      console.error('Failed to update clubs:', error);
      Alert.alert('Error', 'Failed to update clubs');
    } finally {
      setSaving(false);
    }
  };

  const hasUnsavedChanges = () => {
    return JSON.stringify(clubs) !== JSON.stringify(originalClubs);
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

  const addClub = () => {
    if (newClub.trim()) {
      if (!clubs.includes(newClub.trim())) {
        setClubs([...clubs, newClub.trim()]);
        setNewClub('');
        setSheetVisible(false);
      } else {
        Alert.alert('Duplicate', 'This club already exists');
      }
    }
  };

  const removeClub = (clubToRemove: string) => {
    setClubs(clubs.filter((club) => club !== clubToRemove));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <EditingHeader
        title="Edit Clubs"
        onSave={handleSave}
        onBack={handleBack}
        isSaving={saving}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tagsContainer}>
          {clubs.map((club) => (
            <Tag
              key={club}
              label={club}
              variant="gray"
              dismissible
              onDismiss={() => removeClub(club)}
            />
          ))}
        </View>

        <Button
          title="Add club"
          iconLeft={Plus}
          onPress={() => setSheetVisible(true)}
          variant="secondary"
        />
      </ScrollView>

      {/* Add Club Sheet */}
      <Sheet
        visible={sheetVisible}
        onDismiss={() => {
          setSheetVisible(false);
          setNewClub('');
        }}
        title="Add Club"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetContent}
        >
          <AppInput
            placeholder="e.g., Debate Club, Chess Club, Dance Team"
            value={newClub}
            onChangeText={setNewClub}
            autoCapitalize="words"
            autoCorrect={false}
          />
          <Button
            title="Add"
            onPress={addClub}
            variant="primary"
            iconLeft={Plus}
            disabled={!newClub.trim()}
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
