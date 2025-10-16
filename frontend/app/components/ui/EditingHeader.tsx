import { useRouter } from 'expo-router';
import { Check, ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppColors } from '../AppColors';
import AppText from './AppText';
import Button from './Button';

interface EditingHeaderProps {
  onSave?: () => void | Promise<void>;
  isSaving?: boolean;
  backHref?: string; // Optional custom back route
  saveDisabled?: boolean;
  title?: string;
  showSave?: boolean; // to only have a Back button
}

export default function EditingHeader({
  onSave,
  isSaving = false,
  backHref,
  saveDisabled = false,
  title,
  showSave = true,
}: EditingHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref as any);
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <Button
        onPress={handleBack}
        disabled={isSaving}
        variant="secondary"
        title="Back"
        iconLeft={ChevronLeft}
      />
      {title && <AppText style={styles.title}>{title}</AppText>}

      <View style={styles.saveButtonContainer}>
        {isSaving ? (
          <ActivityIndicator color={AppColors.accentDefault} />
        ) : showSave ? (
          <Button
            title="Save"
            onPress={onSave}
            variant="primary"
            disabled={saveDisabled}
            iconLeft={Check}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: AppColors.backgroundDefault,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1,
  },
  saveButtonContainer: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
});
