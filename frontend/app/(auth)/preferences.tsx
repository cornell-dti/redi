import { Gender, School, UpdatePreferencesInput } from '@/types';
import { router } from 'expo-router';
import { Check, Square } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ALL_MAJORS,
  CORNELL_SCHOOLS,
  Year,
  YEARS,
} from '../../constants/cornell';
import { getCurrentUser } from '../api/authService';
import {
  getCurrentUserPreferences,
  updatePreferences,
} from '../api/preferencesApi';
import { AppColors } from '../components/AppColors';
import AppInput from '../components/ui/AppInput';
import AppText from '../components/ui/AppText';
import EditingHeader from '../components/ui/EditingHeader';
import ListItem from '../components/ui/ListItem';
import ListItemWrapper from '../components/ui/ListItemWrapper';
import SearchableMultiSelect from '../components/ui/SearchableMultiSelect';
import UnsavedChangesSheet from '../components/ui/UnsavedChangesSheet';

export default function DatingPreferencesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showUnsavedSheet, setShowUnsavedSheet] = useState(false);

  // Form state
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(25);
  const [ageMinText, setAgeMinText] = useState('18');
  const [ageMaxText, setAgeMaxText] = useState('25');
  const [selectedYears, setSelectedYears] = useState<Year[]>([]);
  const [selectedSchools, setSelectedSchools] = useState<School[]>([]);
  const [selectedMajors, setSelectedMajors] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<Gender[]>([]);

  // Original values to track changes
  const [originalValues, setOriginalValues] = useState({
    ageMin: 18,
    ageMax: 25,
    years: [] as Year[],
    schools: [] as School[],
    majors: [] as string[],
    genders: [] as Gender[],
  });

  // Fetch preferences on mount
  useEffect(() => {
    async function fetchPreferences() {
      try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
          Alert.alert('Error', 'You must be logged in');
          return;
        }

        const data = await getCurrentUserPreferences(currentUser.uid);
        console.log('Fetched preferences:', data);

        if (data) {
          // Populate form
          setAgeMin(data.ageRange.min);
          setAgeMax(data.ageRange.max);
          setAgeMinText(data.ageRange.min.toString());
          setAgeMaxText(data.ageRange.max.toString());
          setSelectedYears(data.years);
          setSelectedSchools(data.schools);
          setSelectedMajors(data.majors);
          setSelectedGenders(data.genders);

          // Store original values
          setOriginalValues({
            ageMin: data.ageRange.min,
            ageMax: data.ageRange.max,
            years: data.years,
            schools: data.schools,
            majors: data.majors,
            genders: data.genders,
          });
        }
      } catch (error) {
        console.error('Failed to fetch preferences:', error);
        Alert.alert('Error', 'Failed to load preferences');
      } finally {
        setLoading(false);
      }
    }

    fetchPreferences();
  }, []);

  const handleSave = async () => {
    // Validate
    if (selectedGenders.length === 0) {
      Alert.alert('Required', 'Please select at least one gender');
      return;
    }

    if (selectedYears.length === 0) {
      Alert.alert('Required', 'Please select at least one year');
      return;
    }

    if (ageMin >= ageMax) {
      Alert.alert('Invalid Range', 'Minimum age must be less than maximum age');
      return;
    }

    setSaving(true);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in');
        return;
      }

      const updates: UpdatePreferencesInput = {
        ageRange: { min: ageMin, max: ageMax },
        years: selectedYears,
        schools: selectedSchools,
        majors: selectedMajors,
        genders: selectedGenders,
      };

      await updatePreferences(currentUser.uid, updates);

      // Update original values after successful save
      setOriginalValues({
        ageMin,
        ageMax,
        years: selectedYears,
        schools: selectedSchools,
        majors: selectedMajors,
        genders: selectedGenders,
      });

      Alert.alert('Success', 'Preferences saved!');
      router.back();
    } catch (error) {
      console.error('Failed to save preferences:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save preferences'
      );
    } finally {
      setSaving(false);
    }
  };

  const hasUnsavedChanges = () => {
    return (
      ageMin !== originalValues.ageMin ||
      ageMax !== originalValues.ageMax ||
      JSON.stringify(selectedYears) !== JSON.stringify(originalValues.years) ||
      JSON.stringify(selectedSchools) !==
        JSON.stringify(originalValues.schools) ||
      JSON.stringify(selectedMajors) !==
        JSON.stringify(originalValues.majors) ||
      JSON.stringify(selectedGenders) !== JSON.stringify(originalValues.genders)
    );
  };

  const handleBack = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedSheet(true);
    } else {
      router.back();
    }
  };

  const handleDiscardAndExit = () => {
    setShowUnsavedSheet(false);
    router.back();
  };

  const handleSaveAndExit = async () => {
    await handleSave();
    setShowUnsavedSheet(false);
    router.back();
  };

  const toggleYear = (year: Year) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const toggleGender = (gender: Gender) => {
    setSelectedGenders((prev) =>
      prev.includes(gender)
        ? prev.filter((g) => g !== gender)
        : [...prev, gender]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <AppText>Loading...</AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <EditingHeader
        onSave={handleSave}
        onBack={handleBack}
        isSaving={saving}
        title="Preferences"
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <AppText variant="title">Dating preferences</AppText>
          <AppText variant="subtitle" color="dimmer">
            Who would you like to date?
          </AppText>
        </View>

        {/* Age Range */}
        <View style={styles.section}>
          <AppText variant="subtitle" style={styles.sectionTitle}>
            Age
          </AppText>
          <View style={styles.ageRow}>
            <View style={styles.ageInputContainer}>
              <AppText variant="bodySmall" color="dimmer">
                Min
              </AppText>
              <AppInput
                variant="white"
                style={styles.ageInput}
                value={ageMinText}
                onChangeText={(text) => {
                  setAgeMinText(text);
                  if (text === '') {
                    return;
                  }
                  const num = parseInt(text);
                  if (!isNaN(num)) {
                    setAgeMin(Math.max(18, Math.min(99, num)));
                  }
                }}
                onBlur={() => {
                  if (ageMinText === '' || isNaN(parseInt(ageMinText))) {
                    setAgeMinText('18');
                    setAgeMin(18);
                  }
                }}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
            <AppText style={styles.ageSeparator} color="dimmer">
              to
            </AppText>
            <View style={styles.ageInputContainer}>
              <AppText variant="bodySmall" color="dimmer">
                Max
              </AppText>
              <AppInput
                variant="white"
                style={styles.ageInput}
                value={ageMaxText}
                onChangeText={(text) => {
                  setAgeMaxText(text);
                  if (text === '') {
                    return;
                  }
                  const num = parseInt(text);
                  if (!isNaN(num)) {
                    setAgeMax(Math.max(18, Math.min(99, num)));
                  }
                }}
                onBlur={() => {
                  if (ageMaxText === '' || isNaN(parseInt(ageMaxText))) {
                    setAgeMaxText('25');
                    setAgeMax(25);
                  }
                }}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>
        </View>

        {/* Year */}
        <View style={styles.section}>
          <AppText variant="subtitle" style={styles.sectionTitle}>
            Year
          </AppText>
          <ListItemWrapper>
            {YEARS.map((year) => (
              <ListItem
                key={year}
                title={year}
                selected={selectedYears.includes(year)}
                onPress={() => toggleYear(year)}
                right={
                  selectedYears.includes(year) ? (
                    <Check size={24} color={AppColors.backgroundDefault} />
                  ) : (
                    <Square color={AppColors.foregroundDimmer} />
                  )
                }
              />
            ))}
          </ListItemWrapper>
        </View>

        {/* Schools */}
        <View style={styles.section}>
          <SearchableMultiSelect
            options={CORNELL_SCHOOLS}
            selected={selectedSchools}
            onChange={(selected: string[]) =>
              setSelectedSchools(selected as School[])
            }
            label="Schools"
            description="Leave empty to see all schools or select specific ones to not get matched with."
            placeholder="Search for schools"
            emptyText="Select specific schools"
          />
        </View>

        {/* Majors */}
        <View style={styles.section}>
          <SearchableMultiSelect
            options={ALL_MAJORS}
            selected={selectedMajors}
            onChange={setSelectedMajors}
            label="Majors"
            placeholder="Search for majors"
            description="Leave empty to see all majors, or select specific ones to not get matched with."
            emptyText="Select specific majors"
          />
        </View>

        {/* Interested In (Gender) */}
        <View style={styles.section}>
          <AppText variant="subtitle" style={styles.sectionTitle}>
            Interested in
          </AppText>
          <ListItemWrapper>
            <ListItem
              title="Women"
              selected={selectedGenders.includes('female')}
              onPress={() => toggleGender('female')}
              right={
                selectedGenders.includes('female') ? (
                  <Check size={24} color={AppColors.backgroundDefault} />
                ) : (
                  <Square color={AppColors.foregroundDimmer} />
                )
              }
            />
            <ListItem
              title="Men"
              selected={selectedGenders.includes('male')}
              onPress={() => toggleGender('male')}
              right={
                selectedGenders.includes('male') ? (
                  <Check size={24} color={AppColors.backgroundDefault} />
                ) : (
                  <Square color={AppColors.foregroundDimmer} />
                )
              }
            />
            <ListItem
              title="Non-binary"
              selected={selectedGenders.includes('non-binary')}
              onPress={() => toggleGender('non-binary')}
              right={
                selectedGenders.includes('non-binary') ? (
                  <Check size={24} color={AppColors.backgroundDefault} />
                ) : (
                  <Square color={AppColors.foregroundDimmer} />
                )
              }
            />
          </ListItemWrapper>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Unsaved Changes Confirmation Sheet */}
      <UnsavedChangesSheet
        visible={showUnsavedSheet}
        onDiscard={handleDiscardAndExit}
        onSave={handleSaveAndExit}
        onDismiss={() => setShowUnsavedSheet(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    display: 'flex',
    gap: 8,
    flexDirection: 'column',
  },
  sectionTitle: {
    paddingLeft: 16,
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 24,
    backgroundColor: AppColors.backgroundDimmer,
  },
  ageInputContainer: {
    gap: 4,
    display: 'flex',
    alignItems: 'center',
    flex: 1,
  },
  ageInput: {
    width: 140,
    justifyContent: 'center',
    textAlign: 'center',
  },
  ageSeparator: {
    position: 'relative',
    top: 12,
  },
});
