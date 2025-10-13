import {
  Gender,
  PreferencesResponse,
  School,
  UpdatePreferencesInput,
} from '@/types';
import { Check } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
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
import AppText from '../components/ui/AppText';
import EditingHeader from '../components/ui/EditingHeader';
import ListItem from '../components/ui/ListItem';
import ListItemWrapper from '../components/ui/ListItemWrapper';
import SearchableMultiSelect from '../components/ui/SearchableMultiSelect';

export default function DatingPreferencesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(25);
  const [ageMinText, setAgeMinText] = useState('18');
  const [ageMaxText, setAgeMaxText] = useState('25');
  const [selectedYears, setSelectedYears] = useState<Year[]>([]);
  const [selectedSchools, setSelectedSchools] = useState<School[]>([]);
  const [selectedMajors, setSelectedMajors] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<Gender[]>([]);

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
      Alert.alert('Success', 'Preferences saved!');
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
        isSaving={saving}
        title="Preferences"
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <AppText variant="title" style={styles.title}>
            Dating preferences
          </AppText>
          <AppText style={styles.subtitle}>Who would you like to date?</AppText>
        </View>

        {/* Age Range */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Age</AppText>
          <View style={styles.ageRow}>
            <View style={styles.ageInputContainer}>
              <AppText style={styles.ageLabel}>Min</AppText>
              <TextInput
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
            <AppText style={styles.ageSeparator}>to</AppText>
            <View style={styles.ageInputContainer}>
              <AppText style={styles.ageLabel}>Max</AppText>
              <TextInput
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
          <AppText style={styles.sectionTitle}>Year</AppText>
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
                  ) : null
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
            placeholder="Search for schools"
            emptyText="All schools"
          />
          <AppText style={styles.helperText}>
            Leave empty to see all schools, or select specific ones
          </AppText>
        </View>

        {/* Majors */}
        <View style={styles.section}>
          <SearchableMultiSelect
            options={ALL_MAJORS}
            selected={selectedMajors}
            onChange={setSelectedMajors}
            label="Majors"
            placeholder="Search for majors"
            emptyText="All majors"
          />
          <AppText style={styles.helperText}>
            Leave empty to see all majors, or select specific ones
          </AppText>
        </View>

        {/* Interested In (Gender) */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Interested in</AppText>
          <ListItemWrapper>
            <ListItem
              title="Women"
              selected={selectedGenders.includes('female')}
              onPress={() => toggleGender('female')}
              right={
                selectedGenders.includes('female') ? (
                  <Check size={24} color={AppColors.backgroundDefault} />
                ) : null
              }
            />
            <ListItem
              title="Men"
              selected={selectedGenders.includes('male')}
              onPress={() => toggleGender('male')}
              right={
                selectedGenders.includes('male') ? (
                  <Check size={24} color={AppColors.backgroundDefault} />
                ) : null
              }
            />
            <ListItem
              title="Non-binary"
              selected={selectedGenders.includes('non-binary')}
              onPress={() => toggleGender('non-binary')}
              right={
                selectedGenders.includes('non-binary') ? (
                  <Check size={24} color={AppColors.backgroundDefault} />
                ) : null
              }
            />
          </ListItemWrapper>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: AppColors.foregroundDimmer,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ageInputContainer: {
    gap: 4,
  },
  ageLabel: {
    fontSize: 14,
    color: AppColors.foregroundDimmer,
  },
  ageInput: {
    backgroundColor: AppColors.backgroundDimmer,
    borderRadius: 8,
    padding: 12,
    width: 80,
    fontSize: 18,
    textAlign: 'center',
    color: AppColors.foregroundDefault,
  },
  ageSeparator: {
    fontSize: 16,
    color: AppColors.foregroundDimmer,
  },
  helperText: {
    fontSize: 14,
    color: AppColors.foregroundDimmer,
    marginTop: 8,
  },
});
