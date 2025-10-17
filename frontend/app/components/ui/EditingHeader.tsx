import { useRouter } from 'expo-router';
import { Check, ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppColors } from '../AppColors';
import AppText from './AppText';
import Button from './Button';
import IconButton from './IconButton';

interface EditingHeaderProps {
  onSave?: () => void | Promise<void>;
  onBack?: () => void; // Optional custom back handler
  isSaving?: boolean;
  backHref?: string; // Optional custom back route
  saveDisabled?: boolean;
  title?: string;
  showSave?: boolean; // to only have a Back button
}

export default function EditingHeader({
  onSave,
  onBack,
  isSaving = false,
  backHref,
  saveDisabled = false,
  title,
  showSave = true,
}: EditingHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.push(backHref as any);
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <IconButton
          onPress={handleBack}
          disabled={isSaving}
          variant="secondary"
          icon={ChevronLeft}
        />

        <AppText variant="subtitle" style={styles.title}>
          {title}
        </AppText>

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
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    padding: 16,
    position: 'relative',
  },
  buttonRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1,
  },
  placeholder: {
    width: 44, // Same width as IconButton to maintain symmetry
  },
});
