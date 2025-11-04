import React from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '../components/AppColors';
import AppText from '../components/ui/AppText';
import EditingHeader from '../components/ui/EditingHeader';
import FooterSpacer from '../components/ui/FooterSpacer';
import ListItemWrapper from '../components/ui/ListItemWrapper';
import { useThemeAware } from '../contexts/ThemeContext';

export default function TermsAndConditionsPage() {
  useThemeAware(); // Force re-render when theme changes

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <EditingHeader showSave={false} title="Terms & Conditions" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContainer}>
          <ListItemWrapper style={styles.mainText}>
            <AppText>
              <AppText variant="body">
                <AppText style={styles.bold}>Effective Date:</AppText> 11/02/25
                {'\n'}
                <AppText style={styles.bold}>Last Updated:</AppText> 11/02/25
              </AppText>
              {'\n\n'}
              Welcome to <AppText style={styles.bold}>Redi</AppText> (“Redi,”
              “we,” “us,” or “our”). By downloading or using the Redi mobile
              application and related services (collectively, the “Service”),
              you agree to these Terms and Conditions (“Terms”). Please read
              them carefully before use. If you do not agree, please do not use
              the Service.
              {'\n\n'}
              <AppText variant="subtitle">1. Eligibility</AppText>
              {'\n'}
              Redi is designed exclusively for members of the Cornell University
              community who are 18 years of age or older and use a valid Cornell
              email address for verification. By using the Service, you
              represent and warrant that you meet these criteria.
              {'\n\n'}
              <AppText variant="subtitle">2. Account and Access</AppText>
              {'\n'}
              You may be required to verify your identity with your Cornell
              email or other credentials. You are responsible for maintaining
              the confidentiality of your login information and for all activity
              under your account.
              {'\n\n'}
              <AppText variant="subtitle">3. Use of the Service</AppText>
              {'\n'}• Use Redi only for lawful personal purposes.{'\n'}• Do not
              misuse, interfere with, reverse engineer, or extract data from the
              Service.{'\n'}• Redi may suspend or terminate accounts that
              violate these Terms.
              {'\n\n'}
              <AppText variant="subtitle">
                4. Data Processing and Machine Learning
              </AppText>
              {'\n'}• Profile inputs (e.g., preferences, prompts, responses,
              photos) are{' '}
              <AppText style={styles.bold}>temporarily processed</AppText>{' '}
              through a machine-learning model to generate match
              recommendations.{'\n'}• Once processing is complete, these inputs
              are deleted or anonymized and cannot be used to identify you.
              {'\n'}• Redi may retain aggregated, de-identified statistics to
              improve its models.
              {'\n\n'}
              <AppText variant="subtitle">5. User Content</AppText>
              {'\n'}
              You own the content you submit. You grant Redi a limited,
              revocable license to process that content solely for matching and
              Service functionality.
              {'\n\n'}
              <AppText variant="subtitle">6. Intellectual Property</AppText>
              {'\n'}
              All trademarks, logos, designs, and software belong to Redi or its
              licensors. You may not copy, modify, or redistribute any part of
              the Service without written permission.
              {'\n\n'}
              <AppText variant="subtitle">7. Disclaimers</AppText>
              {'\n'}
              Redi is provided “as is,” without warranties of any kind. We do
              not guarantee the accuracy of match results or continuous
              availability of the Service.
              {'\n\n'}
              <AppText variant="subtitle">8. Limitation of Liability</AppText>
              {'\n'}
              To the maximum extent permitted by law, Redi and its affiliates
              are not liable for indirect, incidental, or consequential damages
              arising from use of the Service.
              {'\n\n'}
              <AppText variant="subtitle">9. Termination</AppText>
              {'\n'}
              You may delete your account at any time. We may suspend or
              terminate access for violations of these Terms.
              {'\n\n'}
              <AppText variant="subtitle">10. Changes to These Terms</AppText>
              {'\n'}
              We may update these Terms periodically. Continued use after notice
              of changes constitutes acceptance of the new Terms.
              {'\n\n'}
              <AppText variant="subtitle">11. Contact</AppText>
              {'\n'}
              For questions about these Terms, contact us at:{'\n'}
              redicornell@gmail.com
            </AppText>
          </ListItemWrapper>
        </View>

        <FooterSpacer height={32} />
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
  bold: {
    fontWeight: '600',
  },
});
