import * as Haptics from 'expo-haptics';
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
  noRound?: boolean;
  variant?: 'gray' | 'white';
  fullRound?: boolean;
  dateFormat?: boolean; // Automatically format as MM/DD/YYYY
}

const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  required = false,
  noRound,
  style,
  variant,
  fullRound,
  dateFormat,
  ...props
}) => {
  const borderColorAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Format date input as MM/DD/YYYY
  const formatDateInput = (text: string): string => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');

    // Add slashes at appropriate positions
    let formatted = cleaned;
    if (cleaned.length >= 2) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    if (cleaned.length >= 4) {
      formatted =
        cleaned.slice(0, 2) +
        '/' +
        cleaned.slice(2, 4) +
        '/' +
        cleaned.slice(4, 8);
    }

    return formatted;
  };

  const handleDateChange = (text: string) => {
    if (dateFormat && props.onChangeText) {
      const formatted = formatDateInput(text);
      props.onChangeText(formatted);
    }
  };

  const borderColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [AppColors.backgroundDimmer, AppColors.accentDefault],
  });

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleFocus = (e: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
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
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Animated.View
          style={[
            styles.inputWrapper,
            {
              borderColor: error ? AppColors.negativeDefault : borderColor,
              backgroundColor:
                variant === 'white'
                  ? AppColors.backgroundDefault
                  : AppColors.backgroundDimmer,
            },
            noRound && { borderRadius: 6 },
            fullRound && { borderRadius: 32 },
          ]}
        >
          <TextInput
            style={[styles.input, style]}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            {...props}
            keyboardType={dateFormat ? 'number-pad' : props.keyboardType}
            maxLength={dateFormat ? 10 : props.maxLength}
            onChangeText={dateFormat ? handleDateChange : props.onChangeText}
            multiline={props.multiline || false}
            placeholderTextColor={AppColors.foregroundDimmer}
          />
        </Animated.View>
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
    marginLeft: 6,
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
