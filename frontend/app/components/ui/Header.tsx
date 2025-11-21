import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemeAware } from '../../contexts/ThemeContext';
import { AppColors } from '../AppColors';
import AppText from './AppText';

interface HeaderProps {
  title: string;
  right?: React.ReactNode;
}

export default function Header({ title, right }: HeaderProps) {
  useThemeAware(); // Force re-render when theme changes

  return (
    <View style={[styles.container, { backgroundColor: AppColors.backgroundDefault }]}>
      <AppText variant="title">{title}</AppText>
      {right && <View>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
});
