import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import CustomButton from '../ui/CustomButton';

type Gender = 'female' | 'male' | 'non-binary';

interface GenderPickerProps {
  value: Gender;
  onChange: (gender: Gender) => void;
  label?: string;
  includeAny?: boolean;
  onChangeAny?: (gender: Gender | '') => void;
  valueAny?: Gender | '';
}

const GenderPicker: React.FC<GenderPickerProps> = ({
  value,
  onChange,
  label = 'Gender',
  includeAny = false,
  onChangeAny,
  valueAny,
}) => {
  const genders: (Gender | '')[] = includeAny
    ? ['', 'female', 'male', 'non-binary']
    : ['female', 'male', 'non-binary'];

  const handlePress = (gender: Gender | '') => {
    if (includeAny && onChangeAny) {
      onChangeAny(gender);
    } else if (!includeAny && gender !== '') {
      onChange(gender);
    }
  };

  const isSelected = (gender: Gender | '') => {
    if (includeAny) {
      return valueAny === gender;
    }
    return value === gender;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}:</Text>
      <View style={styles.buttonContainer}>
        {genders.map((gender) => (
          <CustomButton
            key={gender || 'any'}
            title={gender || 'Any'}
            onPress={() => handlePress(gender)}
            variant={isSelected(gender) ? 'primary' : 'secondary'}
            size="small"
            style={styles.button}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  button: {
    flex: 1,
    minWidth: 80,
  },
});

export default GenderPicker;
