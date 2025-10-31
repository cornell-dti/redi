import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppColors } from '../AppColors';

const ProfileViewSkeleton: React.FC = () => {
  return (
    <View style={styles.card}>
      {/* Title skeleton */}
      <View style={styles.titleSkeleton} />

      {/* Subtitle skeleton */}
      <View style={styles.subtitleSkeleton} />

      {/* Button row at bottom */}
      <View style={styles.buttonRow}>
        <View style={styles.buttonSkeleton} />
        <View style={styles.buttonSkeleton} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.backgroundDimmer,
    borderRadius: 24,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    gap: 16,
    height: 500,
  },
  titleSkeleton: {
    height: 24,
    width: '60%',
    backgroundColor: AppColors.backgroundDefault,
    borderRadius: 12,
  },
  subtitleSkeleton: {
    height: 16,
    width: '40%',
    backgroundColor: AppColors.backgroundDefault,
    borderRadius: 8,
  },
  buttonRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  buttonSkeleton: {
    flex: 1,
    height: 48,
    backgroundColor: '#DCDCDC',
    borderRadius: 24,
  },
});

export default ProfileViewSkeleton;
