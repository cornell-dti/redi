import * as Haptics from 'expo-haptics';
import React, { useRef } from 'react';
import {
  Animated,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { useThemeAware } from '../../contexts/ThemeContext';
import { AppColors } from '../AppColors';
import AppText from './AppText';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  required?: boolean;
  noRound?: boolean;
  variant?: 'gray' | 'white';
  fullRound?: boolean;
  dateFormat?: boolean; // Automatically format as MM/DD/YYYY or MM/DD/YY
  bottomBorderRound?: boolean;
  disabled?: boolean;
  forceMinHeight?: boolean;
  fullWidth?: boolean;
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
  bottomBorderRound,
  disabled = false,
  forceMinHeight = false,
  fullWidth,
  ...props
}) => {
  useThemeAware(); // Force re-render when theme changes
  const borderColorAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const previousValueRef = useRef('');

  // Format date input as MM/DD/YYYY or MM/DD/YY (supports both 2 and 4 digit years)
  const formatDateInput = (text: string, isDeleting: boolean): string => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');

    // If deleting, don't auto-add slashes - just format what's there
    if (isDeleting) {
      let formatted = cleaned;
      if (cleaned.length > 2) {
        formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
      }
      if (cleaned.length > 4) {
        formatted =
          cleaned.slice(0, 2) +
          '/' +
          cleaned.slice(2, 4) +
          '/' +
          cleaned.slice(4, 8);
      }
      return formatted;
    }

    // When adding, auto-add slashes at appropriate positions
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
      const previousCleaned = previousValueRef.current.replace(/\D/g, '');
      const currentCleaned = text.replace(/\D/g, '');
      const isDeleting = currentCleaned.length < previousCleaned.length;

      const formatted = formatDateInput(text, isDeleting);
      previousValueRef.current = formatted;
      props.onChangeText(formatted);
    }
  };

  const borderColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [AppColors.backgroundDimmer, AppColors.accentDefault],
  });

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleFocus = (e: any) => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    Animated.timing(borderColorAnim, {
      toValue: 1,
      duration: 120,
      useNativeDriver: false,
    }).start();
    props.onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    if (disabled) return;
    Animated.timing(borderColorAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: false,
    }).start();
    props.onBlur?.(e);
  };

  return (
    <View style={[styles.container, fullWidth && { flex: 1 }]}>
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
              minHeight: forceMinHeight ? 56 : null,
            },
            noRound && { borderRadius: 6 },
            fullRound && { borderRadius: 32 },
            bottomBorderRound && {
              borderTopLeftRadius: 6,
              borderTopRightRadius: 6,
              borderBottomLeftRadius: 24,
              borderBottomRightRadius: 24,
            },
            disabled && { opacity: 0.5 },
          ]}
        >
          <TextInput
            style={[styles.input, style]}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            {...props}
            editable={!disabled}
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
