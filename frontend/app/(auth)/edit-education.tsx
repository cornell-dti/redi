import AppText from '@/app/components/ui/AppText';
import { School } from '@/types';
import { router } from 'expo-router';
import { Check, ChevronDown, Plus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CORNELL_MAJORS,
  CORNELL_SCHOOLS,
  Year,
  YEARS,
} from '../../constants/cornell';
import { getCurrentUser } from '../api/authService';
import { getCurrentUserProfile, updateProfile } from '../api/profileApi';
import { AppColors } from '../components/AppColors';
import AppInput from '../components/ui/AppInput';
import Button from '../components/ui/Button';
import EditingHeader from '../components/ui/EditingHeader';
import FooterSpacer from '../components/ui/FooterSpacer';
import ListItem from '../components/ui/ListItem';
import ListItemWrapper from '../components/ui/ListItemWrapper';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Sheet from '../components/ui/Sheet';
import Tag from '../components/ui/Tag';
import Toggle from '../components/ui/Toggle';
import UnsavedChangesSheet from '../components/ui/UnsavedChangesSheet';
import { useThemeAware } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';

export default function EditEducationPage() {
  useThemeAware();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Current values
  const [school, setSchool] = useState<School | ''>('');
  const [majors, setMajors] = useState<string[]>([]);
  const [year, setYear] = useState<Year | null>(null);

  // Original values for comparison
  const [originalSchool, setOriginalSchool] = useState<School | ''>('');
  const [originalMajors, setOriginalMajors] = useState<string[]>([]);
  const [originalYear, setOriginalYear] = useState<Year | null>(null);

  // Visibility preference
  const [showOnProfile, setShowOnProfile] = useState(true);
  const [originalShowOnProfile, setOriginalShowOnProfile] = useState(true);

  // Sheet states
  const [showSchoolSheet, setShowSchoolSheet] = useState(false);
  const [showMajorSheet, setShowMajorSheet] = useState(false);
  const [showYearSheet, setShowYearSheet] = useState(false);
  const [majorSearchQuery, setMajorSearchQuery] = useState('');
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
        setSchool(profileData.school);
        setMajors(profileData.major);
        setYear(profileData.year);

        setOriginalSchool(profileData.school);
        setOriginalMajors(profileData.major);
        setOriginalYear(profileData.year);

        const showCollegeValue = profileData.showCollegeOnProfile ?? true;
        setShowOnProfile(showCollegeValue);
        setOriginalShowOnProfile(showCollegeValue);
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

    if (!school) {
      Alert.alert('Required', 'Please select a school');
      return;
    }
    if (majors.length === 0) {
      Alert.alert('Required', 'Please add at least one major');
      return;
    }
    if (!year) {
      Alert.alert('Required', 'Please select a year');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        school,
        major: majors,
        year,
        showCollegeOnProfile: showOnProfile,
      });

      setOriginalSchool(school);
      setOriginalMajors(majors);
      setOriginalYear(year);
      setOriginalShowOnProfile(showOnProfile);

      showToast({
        icon: <Check size={20} color={AppColors.backgroundDefault} />,
        label: 'Education updated',
      });

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
      showOnProfile !== originalShowOnProfile ||
      JSON.stringify(majors.sort()) !== JSON.stringify(originalMajors.sort())
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

  const removeMajor = (index: number) => {
    setMajors((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <LoadingSpinner />
        <AppText style={styles.loadingText}>Loading...</AppText>
      </SafeAreaView>
    );
  }

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
            <AppText indented>College</AppText>

            <Button
              title={school || 'Select college'}
              onPress={() => setShowSchoolSheet(true)}
              iconRight={ChevronDown}
              dropdown
              variant="secondary"
            />
          </View>

          {/* Majors */}
          <View style={styles.section}>
            <AppText indented>Field(s) of study</AppText>
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

          {/* Year */}
          <View style={styles.section}>
            <AppText indented>Year</AppText>

            <Button
              title={year || 'Select year'}
              onPress={() => setShowYearSheet(true)}
              iconRight={ChevronDown}
              dropdown
              variant="secondary"
            />
          </View>

          {/* Visibility Toggle */}
          <ListItemWrapper>
            <View style={styles.toggleContainer}>
              <View style={styles.toggleLabel}>
                <AppText variant="body">Show on profile</AppText>
              </View>
              <Toggle value={showOnProfile} onValueChange={setShowOnProfile} />
            </View>
          </ListItemWrapper>

          <FooterSpacer />
        </View>
      </ScrollView>

      {/* School Selection Sheet */}
      <Sheet
        visible={showSchoolSheet}
        onDismiss={() => setShowSchoolSheet(false)}
        title="Select your college"
      >
        <ScrollView style={styles.scrollView}>
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
        </ScrollView>
      </Sheet>

      {/* Major Selection Sheet */}
      <Sheet
        visible={showMajorSheet && !!school}
        onDismiss={() => {
          setShowMajorSheet(false);
          setMajorSearchQuery('');
        }}
        title="Select your major"
        bottomRound={false}
      >
        <View style={styles.majorSheetContent}>
          <AppInput
            placeholder="Search for your major"
            value={majorSearchQuery}
            onChangeText={setMajorSearchQuery}
            autoFocus
          />

          <ScrollView style={styles.majorScrollView}>
            <ListItemWrapper>
              {school &&
                (CORNELL_MAJORS[school] || [])
                  .filter((major) =>
                    major.toLowerCase().includes(majorSearchQuery.toLowerCase())
                  )
                  .map((major) => (
                    <ListItem
                      key={major}
                      title={major}
                      onPress={() => {
                        if (!majors.includes(major)) {
                          setMajors([...majors, major]);
                        }
                        setShowMajorSheet(false);
                        setMajorSearchQuery('');
                      }}
                    />
                  ))}
              {majorSearchQuery.trim() &&
                school &&
                (CORNELL_MAJORS[school] || []).filter((major) =>
                  major.toLowerCase().includes(majorSearchQuery.toLowerCase())
                ).length === 0 && (
                  <View style={styles.emptyState}>
                    <AppText style={styles.emptyText}>No results found</AppText>
                    <Button
                      title={`Use "${majorSearchQuery}"`}
                      onPress={() => {
                        if (!majors.includes(majorSearchQuery.trim())) {
                          setMajors([...majors, majorSearchQuery.trim()]);
                        }
                        setShowMajorSheet(false);
                        setMajorSearchQuery('');
                      }}
                      variant="primary"
                    />
                  </View>
                )}
            </ListItemWrapper>
          </ScrollView>
        </View>
      </Sheet>

      {/* Year Selection Sheet */}
      <Sheet
        visible={showYearSheet}
        onDismiss={() => setShowYearSheet(false)}
        title="Select year"
      >
        <ListItemWrapper>
          {YEARS.map((yearOption) => (
            <ListItem
              key={yearOption}
              title={yearOption}
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
  majorSheetContent: {
    flex: 1,
    gap: 16,
  },
  majorScrollView: {
    flex: 1,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: AppColors.foregroundDimmer,
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
