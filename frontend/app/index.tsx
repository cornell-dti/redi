import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppColors } from './components/AppColors';
import AppText from './components/ui/AppText';
import Button from './components/ui/Button';

export default function Index() {
  const handleGetStarted = () => {
    router.push('/home');
  };

  // Note: Auth routing is handled by _layout.tsx
  // This page is only shown when user is not authenticated

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.centerContent}>
          <AppText variant="title">redi</AppText>
          <AppText variant="subtitle">cornell&apos;s first dating app</AppText>
        </View>
        <AppText variant="body" style={styles.madeByText}>
          Made by Incubator
        </AppText>
        <Button
          title="Get Started"
          onPress={handleGetStarted}
          variant="primary"
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingVertical: 80,
  },
  madeByText: {
    textAlign: 'center' as const,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
