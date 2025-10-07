import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { AppColors } from '../AppColors';
import AppText from './AppText';

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
        <AppText variant="body" style={{ marginBottom: 5 }}>
          {label}
          {required && (
            <AppText variant="body" color="negative">
              {' '}
              *
            </AppText>
          )}
        </AppText>
      )}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        {...props}
      />
      {error && (
        <AppText variant="bodySmall" color="negative" style={{ marginTop: 4 }}>
          {error}
        </AppText>
      )}
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
