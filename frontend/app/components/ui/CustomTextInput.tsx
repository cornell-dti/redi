import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { AppColors } from '../AppColors';

interface CustomTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  required?: boolean;
}

const CustomTextInput: React.FC<CustomTextInputProps> = ({
  label,
  error,
  required = false,
  style,
  ...props
}) => {
  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    color: AppColors.foregroundDefault,
  },
  required: {
    color: AppColors.negativeDefault,
  },
  input: {
    borderWidth: 1,
    borderColor: AppColors.backgroundDimmer,
    borderRadius: 4,
    padding: 12,
    backgroundColor: AppColors.backgroundDefault,
    fontSize: 14,
    color: AppColors.foregroundDefault,
  },
  inputError: {
    borderColor: AppColors.negativeDefault,
  },
  errorText: {
    fontSize: 12,
    color: AppColors.negativeDefault,
    marginTop: 4,
  },
});

export default CustomTextInput;
