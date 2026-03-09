import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppColors } from './components/AppColors';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Landing screen for email sign-in deep links.
// _layout.tsx handles the actual sign-in and routes away when done.
export default function AuthRedirect() {
  return (
    < View style={styles.container} >
      <LoadingSpinner />
    </View >
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
