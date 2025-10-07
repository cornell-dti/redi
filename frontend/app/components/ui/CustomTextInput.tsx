import React from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { AppColors } from '../AppColors';
import { Text } from './';

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
        <Text variant="body" color={AppColors.foregroundDefault} style={{ marginBottom: 5 }}>
          {label}
          {required && <Text variant="body" color={AppColors.negativeDefault}> *</Text>}
        </Text>
      )}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        {...props}
      />
      {error && <Text variant="bodySmall" color={AppColors.negativeDefault} style={{ marginTop: 4 }}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
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
});

export default CustomTextInput;
