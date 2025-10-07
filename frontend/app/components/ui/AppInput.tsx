import React, { useRef } from 'react';
import {
  Animated,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { AppColors } from '../AppColors';
import AppText from './AppText';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  required?: boolean;
}

const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  required = false,
  style,
  ...props
}) => {
  const borderColorAnim = useRef(new Animated.Value(0)).current;

  const borderColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [AppColors.backgroundDimmer, AppColors.accentDefault],
  });

  const handleFocus = (e: any) => {
    Animated.timing(borderColorAnim, {
      toValue: 1,
      duration: 120,
      useNativeDriver: false,
    }).start();
    props.onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    Animated.timing(borderColorAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: false,
    }).start();
    props.onBlur?.(e);
  };

  return (
    <View style={styles.container}>
      {label && (
        <AppText color="dimmer" style={styles.label}>
          {label}
          {required && <AppText color="negative"> *</AppText>}
        </AppText>
      )}
      <Animated.View
        style={[
          styles.inputWrapper,
          { borderColor: error ? AppColors.negativeDefault : borderColor },
        ]}
      >
        <TextInput
          style={[styles.input, style]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </Animated.View>
      {error && (
        <AppText color="negative" style={styles.errorMessage}>
          {error}
        </AppText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    marginLeft: 12,
  },
  inputWrapper: {
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: AppColors.backgroundDimmer,
  },
  input: {
    padding: 12,
    height: 48,
    fontSize: 16,
    color: AppColors.foregroundDefault,
  },
  errorMessage: {
    marginLeft: 12,
  },
});

export default AppInput;
