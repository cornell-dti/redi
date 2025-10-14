import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { AppColors } from '../AppColors';
import AppText from './AppText';
import Button from './Button';

interface EditingHeaderProps {
  onSave: () => void | Promise<void>;
  isSaving?: boolean;
  backHref?: string; // Optional custom back route
  saveDisabled?: boolean;
  title?: string;
}

export default function EditingHeader({
  onSave,
  isSaving = false,
  backHref,
  saveDisabled = false,
  title,
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
      <TouchableOpacity
        onPress={handleBack}
        style={styles.backButton}
        disabled={isSaving}
        activeOpacity={0.7}
      >
        <ChevronLeft size={24} color={AppColors.foregroundDefault} />
        <AppText style={styles.backText}>Back</AppText>
      </TouchableOpacity>

      {title && <AppText style={styles.title}>{title}</AppText>}

      <View style={styles.saveButtonContainer}>
        {isSaving ? (
          <ActivityIndicator color={AppColors.accentDefault} />
        ) : (
          <Button
            title="Save"
            onPress={onSave}
            variant="primary"
            disabled={saveDisabled}
          />
        )}
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
    paddingVertical: 12,
    backgroundColor: AppColors.backgroundDefault,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.backgroundDimmer,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginLeft: -8,
  },
  backText: {
    fontSize: 17,
    color: AppColors.foregroundDefault,
    marginLeft: 4,
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
