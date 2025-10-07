import React from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import GenderPicker from '../form/GenderPicker';
import { default as AppInput } from '../ui/AppInput';
import AppText from '../ui/AppText';
import SectionCard from '../ui/SectionCard';

interface FilterPanelProps {
  showFilters: boolean;
  onToggleFilters: (show: boolean) => void;
  gender: 'female' | 'male' | 'non-binary' | '';
  onGenderChange: (gender: 'female' | 'male' | 'non-binary' | '') => void;
  school: string;
  onSchoolChange: (school: string) => void;
  minYear?: number;
  maxYear?: number;
  onMinYearChange?: (year: number) => void;
  onMaxYearChange?: (year: number) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  showFilters,
  onToggleFilters,
  gender,
  onGenderChange,
  school,
  onSchoolChange,
  minYear,
  maxYear,
  onMinYearChange,
  onMaxYearChange,
}) => {
  return (
    <SectionCard>
      <View style={styles.header}>
        <AppText variant="subtitle" color="dimmer">
          Filters
        </AppText>
        <Switch value={showFilters} onValueChange={onToggleFilters} />
      </View>

      {showFilters && (
        <View style={styles.filterContent}>
          <GenderPicker
            value={gender === '' ? 'female' : gender}
            valueAny={gender}
            onChange={onGenderChange}
            onChangeAny={onGenderChange}
            includeAny
            label="Filter by Gender"
          />

          <AppInput
            label="Filter by School"
            value={school}
            onChangeText={onSchoolChange}
            placeholder="Engineering, Arts & Sciences, etc."
          />

          {(onMinYearChange || onMaxYearChange) && (
            <View style={styles.yearFilters}>
              {onMinYearChange && (
                <AppInput
                  label="Min Year"
                  value={minYear?.toString() || ''}
                  onChangeText={(value) =>
                    onMinYearChange(parseInt(value) || 0)
                  }
                  placeholder="2024"
                  keyboardType="numeric"
                  style={styles.yearInput}
                />
              )}
              {onMaxYearChange && (
                <AppInput
                  label="Max Year"
                  value={maxYear?.toString() || ''}
                  onChangeText={(value) =>
                    onMaxYearChange(parseInt(value) || 0)
                  }
                  placeholder="2028"
                  keyboardType="numeric"
                  style={styles.yearInput}
                />
              )}
            </View>
          )}
        </View>
      )}
    </SectionCard>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterContent: {
    marginTop: 16,
  },
  yearFilters: {
    flexDirection: 'row',
    gap: 12,
  },
  yearInput: {
    flex: 1,
  },
});

export default FilterPanel;
