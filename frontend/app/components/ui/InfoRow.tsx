import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../AppColors';

interface InfoRowProps {
  label: string;
  value: string | number;
}

export default function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
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
  label: {
    fontSize: 14,
    color: AppColors.foregroundDimmer,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: AppColors.foregroundDefault,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
});
