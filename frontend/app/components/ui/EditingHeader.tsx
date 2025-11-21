import { useRouter } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemeAware } from '../../contexts/ThemeContext';
import { AppColors } from '../AppColors';
import AppText from './AppText';
import IconButton from './IconButton';
import LoadingSpinner from './LoadingSpinner';

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
  useThemeAware(); // Force re-render when theme changes
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
    <View
      style={[
        styles.container,
        { borderBottomColor: AppColors.backgroundDimmest },
      ]}
    >
      <View style={styles.buttonRow}>
        <IconButton
          onPress={handleBack}
          disabled={isSaving}
          variant="secondary"
          icon={ArrowLeft}
        />

        <AppText variant="subtitle" style={styles.title}>
          {title}
        </AppText>

        {isSaving ? (
          <LoadingSpinner color={AppColors.accentDefault} />
        ) : showSave ? (
          <IconButton
            onPress={async () => onSave?.()}
            variant="primary"
            disabled={saveDisabled}
            icon={Check}
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
    borderBottomWidth: 1,
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
