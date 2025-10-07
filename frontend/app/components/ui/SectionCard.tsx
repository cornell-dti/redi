// app/components/ui/SectionCard.tsx
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
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
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default SectionCard;
