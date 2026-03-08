import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppColors } from './components/AppColors';
import LoadingSpinner from './components/ui/LoadingSpinner';

export default function Index() {
  return (
    <View style={styles.container}>
      <LoadingSpinner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
