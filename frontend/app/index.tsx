import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppColors } from './components/AppColors';

export default function Index() {
  return (
    <View style={styles.container} />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
  },
});
