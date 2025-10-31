import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  sendPasswordlessSignInLink,
  validateCornellEmail,
} from './api/authService';
import { AppColors } from './components/AppColors';
import LegalFooterText from './components/onboarding/LegalFooterText';
import AppInput from './components/ui/AppInput';
import AppText from './components/ui/AppText';
import Button from './components/ui/Button';

type AuthMode = 'welcome' | 'signin';

export default function HomePage() {
  const [mode, setMode] = useState<AuthMode>('welcome');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendLink = async () => {
    if (!email) {
      Alert.alert('Missing Information', 'Please enter your email address');
      return;
    }

    if (!validateCornellEmail(email)) {
      Alert.alert(
        'Invalid Email',
        'Please use your Cornell email address (@cornell.edu)'
      );
      return;
    }

    setLoading(true);
    try {
      await sendPasswordlessSignInLink(email);
      Alert.alert(
        'Check Your Email',
        'We sent you a sign-in link. Click the link in your email to continue.',
        [{ text: 'OK' }]
      );
      // Keep the email in case user needs to resend
    } catch (error) {
      Alert.alert(
        'Failed to Send Link',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setMode('welcome');
    setEmail('');
  };

  const renderWelcomeScreen = () => (
    <>
      <View style={styles.centerContent}>
        <AppText variant="title" style={styles.logo}>
          redi
        </AppText>
        <AppText variant="subtitle" style={styles.subtitle}>
          cornell&apos;s first dating app
        </AppText>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Get Started"
          onPress={() => setMode('signin')}
          variant="primary"
          fullWidth
        />
      </View>
    </>
  );

  const renderAuthForm = () => (
    <>
      <ScrollView
        style={styles.formScrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          <AppText variant="title" style={styles.formTitle}>
            Sign In
          </AppText>
          <AppText variant="body" style={styles.formSubtitle}>
            Enter your Cornell email and we&apos;ll send you a sign-in link
          </AppText>

          <View style={styles.inputContainer}>
            <AppInput
              label="Cornell Email"
              placeholder="netid@cornell.edu"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
              required
            />
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color={AppColors.accentDefault}
              style={styles.loader}
            />
          ) : (
            <View style={styles.buttonContainer}>
              <Button
                title="Send Sign-In Link"
                onPress={handleSendLink}
                variant="primary"
                fullWidth
              />
              <Button
                title="Back"
                onPress={handleBack}
                variant="secondary"
                fullWidth
              />
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={styles.content}>
          {mode === 'welcome' ? renderWelcomeScreen() : renderAuthForm()}
        </View>
      </KeyboardAvoidingView>

      <LegalFooterText text="By signing up, you agree to our {terms}. Learn how we process your data in our {privacy}." />
    </SafeAreaView>
  );
}

// styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: AppColors.foregroundDimmer,
  },
  buttonContainer: {
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.backgroundDefault,
  },
  formScrollView: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 40,
  },
  formTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  formSubtitle: {
    color: AppColors.foregroundDimmer,
    marginBottom: 32,
  },
  inputContainer: {
    gap: 16,
    marginBottom: 24,
  },
  loader: {
    marginVertical: 20,
  },
});
