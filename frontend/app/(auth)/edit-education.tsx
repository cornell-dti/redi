import AppText from '@/app/components/ui/AppText';
import { School } from '@/types';
import { router } from 'expo-router';
import { Check, Plus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CORNELL_MAJORS, CORNELL_SCHOOLS } from '../../constants/cornell';
import { getCurrentUser } from '../api/authService';
import { getCurrentUserProfile } from '../api/profileApi';
import { AppColors } from '../components/AppColors';
import Button from '../components/ui/Button';
import EditingHeader from '../components/ui/EditingHeader';
import ListItem from '../components/ui/ListItem';
import ListItemWrapper from '../components/ui/ListItemWrapper';
import SearchableDropdown from '../components/ui/SearchableDropdown';
import Sheet from '../components/ui/Sheet';
import Tag from '../components/ui/Tag';
import { useThemeAware } from '../contexts/ThemeContext';

export default function EditEducationPage() {
  useThemeAware();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Current values
  const [school, setSchool] = useState<School | ''>('');
  const [majors, setMajors] = useState<string[]>([]);
  const [year, setYear] = useState<number | null>(null);

  // Original values for comparison
  const [originalSchool, setOriginalSchool] = useState<School | ''>('');
  const [originalMajors, setOriginalMajors] = useState<string[]>([]);
  const [originalYear, setOriginalYear] = useState<number | null>(null);

  // Sheet states
  const [showSchoolSheet, setShowSchoolSheet] = useState(false);
  const [showMajorSheet, setShowMajorSheet] = useState(false);
  const [showYearSheet, setShowYearSheet] = useState(false);

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
        setSchool(profileData.school);
        setMajors(profileData.major);
        setYear(profileData.year);

        setOriginalSchool(profileData.school);
        setOriginalMajors(profileData.major);
        setOriginalYear(profileData.year);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!school) {
      Alert.alert('Required', 'Please select a school');
      return;
    }
    if (majors.length === 0) {
      Alert.alert('Required', 'Please add at least one major');
      return;
    }
    if (!year) {
      Alert.alert('Required', 'Please select a graduation year');
      return;
    }

    setSaving(true);
    try {
      // TODO: Implement save to backend
      // await updateProfile({ school, major: majors, year });

      setOriginalSchool(school);
      setOriginalMajors(majors);
      setOriginalYear(year);
      Alert.alert('Success', 'Education updated successfully');
      router.back();
    } catch (error) {
      console.error('Failed to update education:', error);
      Alert.alert('Error', 'Failed to update education');
    } finally {
      setSaving(false);
    }
  };

  const hasUnsavedChanges = () => {
    return (
      school !== originalSchool ||
      year !== originalYear ||
      JSON.stringify(majors.sort()) !== JSON.stringify(originalMajors.sort())
    );
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

  const removeMajor = (index: number) => {
    setMajors((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={AppColors.accentDefault} />
        <AppText style={styles.loadingText}>Loading...</AppText>
      </SafeAreaView>
    );
  }

  const GRADUATION_YEARS = [2025, 2026, 2027, 2028];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <EditingHeader
        title="Edit Education"
        onSave={handleSave}
        onBack={handleBack}
        isSaving={saving}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* School */}
          <View style={styles.section}>
            <AppText variant="subtitle" color="dimmer">
              College
            </AppText>
            <ListItemWrapper>
              <ListItem
                title={school || 'Select college'}
                onPress={() => setShowSchoolSheet(true)}
                right={<Check size={20} color={AppColors.accentDefault} />}
              />
            </ListItemWrapper>
          </View>

          {/* Majors */}
          <View style={styles.section}>
            <AppText variant="subtitle" color="dimmer">
              Field(s) of study
            </AppText>
            <ListItemWrapper>
              {majors.length > 0 && (
                <View style={styles.tagsContainer}>
                  {majors.map((major, index) => (
                    <Tag
                      key={major}
                      variant="white"
                      label={major}
                      dismissible
                      onDismiss={() => removeMajor(index)}
                    />
                  ))}
                </View>
              )}
              <Button
                title="Add field of study"
                iconLeft={Plus}
                onPress={() => setShowMajorSheet(true)}
                variant="secondary"
                noRound
                disabled={!school}
              />
            </ListItemWrapper>
          </View>

          {/* Graduation Year */}
          <View style={styles.section}>
            <AppText variant="subtitle" color="dimmer">
              Graduation year
            </AppText>
            <ListItemWrapper>
              <ListItem
                title={year ? year.toString() : 'Select year'}
                onPress={() => setShowYearSheet(true)}
                right={<Check size={20} color={AppColors.accentDefault} />}
              />
            </ListItemWrapper>
          </View>
        </View>
      </ScrollView>

      {/* School Selection Sheet */}
      <Sheet
        visible={showSchoolSheet}
        onDismiss={() => setShowSchoolSheet(false)}
        title="Select your college"
        height={500}
      >
        <ListItemWrapper>
          {CORNELL_SCHOOLS.map((schoolOption) => (
            <ListItem
              key={schoolOption}
              title={schoolOption}
              selected={school === schoolOption}
              onPress={() => {
                setSchool(schoolOption);
                // Clear majors if school changes
                if (school !== schoolOption) {
                  setMajors([]);
                }
                setShowSchoolSheet(false);
              }}
              right={
                school === schoolOption ? (
                  <Check size={16} color={AppColors.accentDefault} />
                ) : null
              }
            />
          ))}
        </ListItemWrapper>
      </Sheet>

      {/* Major Selection Sheet */}
      {showMajorSheet && school && (
        <SearchableDropdown
          options={CORNELL_MAJORS[school] || []}
          value=""
          onSelect={(selectedMajor) => {
            if (!majors.includes(selectedMajor)) {
              setMajors([...majors, selectedMajor]);
            }
            setShowMajorSheet(false);
          }}
          placeholder="Search for your major"
          allowOther={true}
        />
      )}

      {/* Year Selection Sheet */}
      <Sheet
        visible={showYearSheet}
        onDismiss={() => setShowYearSheet(false)}
        title="Select graduation year"
        height={400}
      >
        <ListItemWrapper>
          {GRADUATION_YEARS.map((yearOption) => (
            <ListItem
              key={yearOption}
              title={yearOption.toString()}
              selected={year === yearOption}
              onPress={() => {
                setYear(yearOption);
                setShowYearSheet(false);
              }}
              right={
                year === yearOption ? (
                  <Check size={24} color={AppColors.accentDefault} />
                ) : null
              }
            />
          ))}
        </ListItemWrapper>
      </Sheet>
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
  loadingText: {
    marginTop: 12,
    color: AppColors.foregroundDimmer,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 24,
  },
  section: {
    gap: 8,
  },
  tagsContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    backgroundColor: AppColors.backgroundDimmer,
    padding: 16,
  },
});
