import React from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '../components/AppColors';
import AppText from '../components/ui/AppText';
import EditingHeader from '../components/ui/EditingHeader';
import ListItemWrapper from '../components/ui/ListItemWrapper';
import { useThemeAware } from '../contexts/ThemeContext';

export default function PrivacyPolicyPage() {
  useThemeAware(); // Force re-render when theme changes
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <EditingHeader showSave={false} title="Privacy Policy" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContainer}>
          <ListItemWrapper style={styles.mainText}>
            <AppText>
              Your privacy matters to us at Redi. By using our app, you agree to
              the following:
              {'\n\n'}
              <AppText variant="subtitle">Information We Collect</AppText>
              {'\n'}
              We collect basic info (like name, email, age), profile content
              (photos, bio), and app usage data.
              {'\n\n'}
              <AppText variant="subtitle">How We Use It</AppText>
              {'\n'}
              We use your information to:{'\n'}• Match you with other users
              {'\n'}• Improve app features{'\n'}• Keep the platform safe
              {'\n\n'}
              <AppText variant="subtitle">Sharing</AppText>
              {'\n'}
              We do not sell your personal data. We may share info with trusted
              service providers to run Redi (e.g. hosting, analytics).
              {'\n\n'}
              <AppText variant="subtitle">Your Choices</AppText>
              {'\n'}
              You can edit or delete your profile at any time. Some data may
              remain for safety or legal reasons.
              {'\n\n'}
              <AppText variant="subtitle">Security</AppText>
              {'\n'}
              We use reasonable measures to protect your data, but no system is
              100% secure.
              {'\n\n'}
              <AppText variant="subtitle">Updates</AppText>
              {'\n'}
              We may change this Privacy Policy. Continued use means you accept
              the latest version.
              {'\n\n'}
              <AppText variant="subtitle">Contact Us</AppText>
              {'\n'}
              Questions? Email [EMAIL]
            </AppText>
          </ListItemWrapper>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  mainContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  mainText: {
    padding: 16,
    backgroundColor: AppColors.backgroundDimmer,
  },
});
