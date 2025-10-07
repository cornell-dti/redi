import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppColors } from '../AppColors';
import { Text } from './';

interface InfoRowProps {
  label: string;
  value: string | number;
}

export default function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.container}>
      <Text variant="body" color={AppColors.foregroundDimmer}>
        {label}
      </Text>
      <Text
        variant="body"
        color={AppColors.foregroundDefault}
        style={styles.value}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.backgroundDimmer,
  },
  value: {
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
});
