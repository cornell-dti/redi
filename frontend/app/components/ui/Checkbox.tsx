import { Check } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { AppColors } from '../AppColors';

interface CheckboxProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  color?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  value,
  onValueChange,
  color = AppColors.accentDefault,
}) => {
  return (
    <TouchableOpacity
      onPress={() => onValueChange(!value)}
      style={[
        styles.checkbox,
        value && { backgroundColor: color, borderColor: color },
      ]}
      activeOpacity={0.7}
    >
      {value && <Check size={16} color={AppColors.backgroundDefault} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: AppColors.foregroundDimmer,
    backgroundColor: AppColors.backgroundDefault,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Checkbox;
