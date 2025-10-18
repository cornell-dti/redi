import { Trash2 } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from './AppText';
import Button from './Button';
import Sheet from './Sheet';

interface DeleteAccountSheetProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
}

export default function DeleteAccountSheet({
  visible,
  onDismiss,
  onConfirm,
}: DeleteAccountSheetProps) {
  return (
    <Sheet visible={visible} onDismiss={onDismiss} title="Delete Account">
      <View style={styles.sheetContent}>
        <AppText>
          Are you sure you want to delete your account? This action cannot be
          undone and all your data will be permanently deleted.
        </AppText>

        <View style={styles.buttonRow}>
          <Button
            title="Delete Account"
            onPress={onConfirm}
            variant="negative"
            fullWidth
            iconLeft={Trash2}
          />
          <Button
            title="Keep my account"
            onPress={onDismiss}
            variant="secondary"
            fullWidth
          />
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  buttonRow: {
    display: 'flex',
    gap: 12,
  },
});
