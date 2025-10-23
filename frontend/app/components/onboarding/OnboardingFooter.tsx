import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ChevronRightIcon } from 'lucide-react-native';
import { AppColors } from '../AppColors';
import AppText from '../ui/AppText';
import Button from '../ui/Button';
import Checkbox from '../ui/Checkbox';

interface OnboardingFooterProps {
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  showCheckbox?: boolean;
  checkboxLabel?: string;
  checkboxChecked?: boolean;
  onCheckboxChange: (checked: boolean) => void;
}

export default function OnboardingFooter({
  onNext,
  nextDisabled = false,
  nextLabel = 'Next',
  showCheckbox = false,
  checkboxLabel,
  checkboxChecked = false,
  onCheckboxChange,
}: OnboardingFooterProps) {
  return (
    <View style={styles.container}>
      {showCheckbox && checkboxLabel && onCheckboxChange && (
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => onCheckboxChange(!checkboxChecked)}
        >
          <Checkbox
            value={checkboxChecked}
            onValueChange={onCheckboxChange}
            color={checkboxChecked ? AppColors.accentDefault : undefined}
          />
          <AppText variant="body" style={styles.checkboxLabel}>
            {checkboxLabel}
          </AppText>
        </TouchableOpacity>
      )}
      <Button
        title={nextLabel}
        iconRight={ChevronRightIcon}
        onPress={onNext}
        variant="primary"
        fullWidth
        disabled={nextDisabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: AppColors.backgroundDefault,
    gap: 16,
  },
  checkboxRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  checkboxLabel: {
    textAlign: 'center',
  },
});
