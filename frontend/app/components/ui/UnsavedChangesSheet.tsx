import { Check, Pencil, Trash2 } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from './AppText';
import Button from './Button';
import ListItemWrapper from './ListItemWrapper';
import Sheet from './Sheet';

interface UnsavedChangesSheetProps {
  visible: boolean;
  onDiscard: () => void;
  onSave: () => void;
  onDismiss: () => void;
}

export default function UnsavedChangesSheet({
  visible,
  onDiscard,
  onSave,
  onDismiss,
}: UnsavedChangesSheetProps) {
  return (
    <Sheet
      visible={visible}
      onDismiss={onDismiss}
      title="Unsaved Changes"
      height={340}
    >
      <View style={styles.sheetContent}>
        <AppText>
          You have unsaved changes. Do you want to save them before leaving?
        </AppText>

        <ListItemWrapper>
          <Button
            title="Save & Exit"
            onPress={onSave}
            variant="primary"
            fullWidth
            iconLeft={Check}
            noRound
          />

          <Button
            title="Keep editing"
            onPress={onDismiss}
            variant="secondary"
            fullWidth
            iconLeft={Pencil}
            noRound
          />

          <Button
            title="Discard changes"
            onPress={onDiscard}
            fullWidth
            iconLeft={Trash2}
            noRound
            variant="negative"
          />
        </ListItemWrapper>
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
});
