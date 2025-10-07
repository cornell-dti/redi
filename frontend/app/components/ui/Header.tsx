import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../AppColors';
import { AppTypography } from '../AppTypography';

interface HeaderProps {
  title: string;
  right?: React.ReactNode;
}

export default function Header({ title, right }: HeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {right && <View>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: AppColors.backgroundDefault,
  },
  title: {
    ...AppTypography.title,
    color: AppColors.foregroundDefault,
  },
});
