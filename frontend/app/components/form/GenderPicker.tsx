import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../ui';
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
      <Text variant="body" color="#333" style={{ marginBottom: 8 }}>{label}:</Text>
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
