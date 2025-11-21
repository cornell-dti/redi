import React from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '../components/AppColors';
import AppText from '../components/ui/AppText';
import EditingHeader from '../components/ui/EditingHeader';
import FooterSpacer from '../components/ui/FooterSpacer';
import ListItemWrapper from '../components/ui/ListItemWrapper';
import { useThemeAware } from '../contexts/ThemeContext';

export default function PrivacyPolicyPage() {
  useThemeAware(); // Force re-render when theme changes

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: AppColors.backgroundDefault }]}>
      <StatusBar barStyle="dark-content" />
      <EditingHeader showSave={false} title="Privacy Policy" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContainer}>
          <ListItemWrapper style={styles.mainText}>
            <AppText>
              <AppText style={styles.bold}>Effective Date:</AppText> 11/02/25
              {'\n'}
              <AppText style={styles.bold}>Last Updated:</AppText> 11/02/25
              {'\n\n'}
              At <AppText style={styles.bold}>Redi</AppText>, we value your
              privacy and are committed to keeping your information safe and
              minimal. This Privacy Policy explains how we collect, use, and
              protect information when you use the Redi mobile application and
              related services (collectively, the “Service”). By using Redi, you
              agree to the practices described below.
              {'\n\n'}
              <AppText variant="subtitle">1. Information We Collect</AppText>
              {'\n'}
              Redi collects only the limited information necessary to make the
              app function properly and provide a smooth user experience.
              Specifically:
              {'\n\n'}• <AppText style={styles.bold}>Identifiers:</AppText> We
              collect your Cornell email address to verify that you are part of
              the Cornell community. This is used for eligibility verification
              only and is deleted when your session ends.{'\n'}•{' '}
              <AppText style={styles.bold}>User Content:</AppText> We
              temporarily process profile inputs you provide — such as prompts,
              preferences, or photos — solely for the purpose of generating
              match recommendations. This data is not permanently stored or used
              to personally identify you.{'\n'}•{' '}
              <AppText style={styles.bold}>Diagnostics:</AppText> We may collect
              anonymized technical data such as app performance metrics or crash
              reports to help us fix bugs and improve functionality.{'\n\n'}
              We do <AppText style={styles.bold}>not</AppText> collect your
              location, contacts, financial information, or health data. We also
              do <AppText style={styles.bold}>not</AppText> use tracking
              technologies for advertising or cross-app identification.
              {'\n\n'}
              <AppText variant="subtitle">2. How We Use Information</AppText>
              {'\n'}
              We use your information to operate and improve the Service.
              Specifically:
              {'\n\n'}• To generate and display compatible match suggestions
              using our machine learning model.{'\n'}• To maintain the
              reliability and security of the app.{'\n'}• To verify that users
              are eligible members of the Cornell community.{'\n'}• To analyze
              de-identified, aggregate usage patterns for product improvement.
              {'\n\n'}
              Your information is never sold, shared, or used for third-party
              advertising.
              {'\n\n'}
              <AppText variant="subtitle">
                3. Data Processing and Retention
              </AppText>
              {'\n'}
              Profile data that you provide is processed in real time and then
              deleted. When you input your preferences or responses, the data is
              sent through a machine learning algorithm to generate
              compatibility results. Once the match process is complete, the
              data is removed from our systems or anonymized so it cannot be
              linked back to you.{'\n\n'}
              We may retain de-identified, aggregated statistics (such as the
              number of matches made or overall engagement metrics) to improve
              Redi’s matching algorithm over time.
              {'\n\n'}
              <AppText variant="subtitle">
                4. Machine Learning and AI Processing
              </AppText>
              {'\n'}
              Our matching system uses machine learning to interpret the profile
              information you provide and recommend compatible matches. This
              process happens automatically and does not involve human review.
              The algorithm analyzes patterns and similarities between user
              inputs, but it does not store or remember identifiable data. Over
              time, we may use anonymized, aggregate results to improve model
              accuracy and fairness.
              {'\n\n'}
              <AppText variant="subtitle">5. Data Security</AppText>
              {'\n'}
              We use encryption and secure infrastructure to protect your
              information while it’s being processed. All communications between
              your device and our servers occur over HTTPS. Although no system
              is completely secure, we follow industry-standard practices to
              safeguard data against unauthorized access, loss, or misuse.
              {'\n\n'}
              <AppText variant="subtitle">6. Third-Party Services</AppText>
              {'\n'}
              Redi may rely on trusted third-party vendors — such as cloud
              hosting and analytics providers — to operate the Service. These
              vendors are bound by confidentiality and data processing
              agreements. They are not allowed to access or use your data for
              any reason other than to support Redi’s core functionality.
              {'\n\n'}
              <AppText variant="subtitle">
                7. Your Rights and Data Deletion
              </AppText>
              {'\n'}
              You have the right to control your information. You may:
              {'\n\n'}• Request deletion of your data at any time by contacting{' '}
              <AppText style={styles.bold}>support@rediapp.com</AppText>.{'\n'}•
              Ask for confirmation of what information we currently hold about
              you (if any).{'\n'}• Withdraw your consent to processing and stop
              using the Service.{'\n\n'}
              Once we receive a verified deletion request, all identifiable
              information will be permanently deleted within{' '}
              <AppText style={styles.bold}>7 days</AppText>.{'\n\n'}
              <AppText variant="subtitle">8. Children’s Privacy</AppText>
              {'\n'}
              Redi is not intended for individuals under 18 years of age. We do
              not knowingly collect data from minors. If we become aware that
              data from a minor has been collected, it will be deleted
              immediately.
              {'\n\n'}
              <AppText variant="subtitle">
                9. No Tracking or Cross-App Identification
              </AppText>
              {'\n'}
              Redi does not track your activity across other apps or websites,
              and we do not link any data to advertising or marketing
              identifiers. Your activity in Redi stays within Redi.
              {'\n\n'}
              <AppText variant="subtitle">10. Changes to This Policy</AppText>
              {'\n'}
              We may occasionally update this Privacy Policy to reflect
              improvements in our practices or changes in legal requirements. If
              we make material updates, we will notify users within the app or
              via email before the new policy takes effect.
              {'\n\n'}
              <AppText variant="subtitle">11. Contact Us</AppText>
              {'\n'}
              If you have questions or concerns about this Privacy Policy or our
              data handling practices, you can contact us at:{'\n'}
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
