import React from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '../components/AppColors';
import AppText from '../components/ui/AppText';
import EditingHeader from '../components/ui/EditingHeader';
import ListItemWrapper from '../components/ui/ListItemWrapper';

export default function TermsAndConditionsPage() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <EditingHeader showSave={false} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContainer}>
          <AppText variant="title">Terms & Conditions</AppText>

          <ListItemWrapper style={styles.mainText}>
            <AppText>
              <AppText variant="subtitle">Welcome to Redi!</AppText>
              {'\n'}
              By creating an account or using our app, you agree to the
              following terms:
              {'\n\n'}
              <AppText variant="subtitle">Eligibility</AppText>
              {'\n'}
              You must be at least 18 years old to use Redi.
              {'\n\n'}
              <AppText variant="subtitle">Your Account</AppText>
              {'\n'}
              You are responsible for keeping your login details secure. Don’t
              share your account with others.
              {'\n\n'}
              <AppText variant="subtitle">User Conduct</AppText>
              {'\n'}
              Be respectful. Do not use Redi to harass, scam, or post harmful
              content.
              {'\n\n'}
              <AppText variant="subtitle">Content</AppText>
              {'\n'}
              You own the photos and information you share, but grant Redi a
              license to display them in the app.
              {'\n\n'}
              <AppText variant="subtitle">Safety</AppText>
              {'\n'}
              Redi is not responsible for the actions of other users. Please
              stay safe and report inappropriate behavior.
              {'\n\n'}
              <AppText variant="subtitle">Termination</AppText>
              {'\n'}
              We may suspend or remove accounts that violate these terms.
              {'\n\n'}
              <AppText variant="subtitle">Changes</AppText>
              {'\n'}
              We may update these terms from time to time. Continued use means
              you accept the updated version.
              {'\n\n'}
              <AppText variant="subtitle">Contact Us</AppText>
              {'\n'}
              Questions? Reach us at [EMAIL]
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
