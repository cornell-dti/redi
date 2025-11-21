// app/components/ui/SectionCard.tsx
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { AppColors } from '../AppColors';
import { useThemeAware } from '../../contexts/ThemeContext';
import AppText from './AppText';

interface SectionCardProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  children,
  style,
}) => {
  useThemeAware(); // Force re-render when theme changes

  return (
    <View style={[styles.container, style]}>
      {title && (
        <AppText variant="subtitle" color="dimmer" style={{ marginBottom: 16 }}>
          {title}
        </AppText>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.backgroundDimmer,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: AppColors.shadowDefault,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default SectionCard;
