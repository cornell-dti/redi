import { LogOut } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from './AppText';
import Button from './Button';
import ListItemWrapper from './ListItemWrapper';
import Sheet from './Sheet';

interface SignOutSheetProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
}

export default function SignOutSheet({
  visible,
  onDismiss,
  onConfirm,
}: SignOutSheetProps) {
  return (
    <Sheet
      visible={visible}
      onDismiss={onDismiss}
      title="Sign Out"
      height={265}
    >
      <View style={styles.sheetContent}>
        <AppText>Are you sure you want to sign out?</AppText>
        <ListItemWrapper>
          <Button
            title="Sign Out"
            onPress={onConfirm}
            variant="negative"
            iconLeft={LogOut}
            noRound
            fullWidth
          />
          <Button
            title="Never mind"
            onPress={onDismiss}
            variant="secondary"
            noRound
            fullWidth
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
