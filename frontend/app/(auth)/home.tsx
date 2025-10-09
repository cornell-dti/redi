import AsyncStorage from '@react-native-async-storage/async-storage';
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
  signInUser,
  signUpUser,
  validateCornellEmail,
} from '../api/authService';
import { AppColors } from '../components/AppColors';
import LegalFooterText from '../components/onboarding/LegalFooterText';
import AppInput from '../components/ui/AppInput';
import AppText from '../components/ui/AppText';
import Button from '../components/ui/Button';

type AuthMode = 'welcome' | 'signup' | 'login';

export default function HomePage() {
  const [mode, setMode] = useState<AuthMode>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateAccount = async () => {
    if (!email || !password) {
      Alert.alert(
        'Missing Information',
        'Please enter both email and password'
      );
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
      await signUpUser(email, password);
      // After successful signup, navigate to create profile
      router.replace('/(auth)/create-profile');
    } catch (error) {
      Alert.alert(
        'Sign Up Failed',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(
        'Missing Information',
        'Please enter both email and password'
      );
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
      await signInUser(email, password);

      // Check onboarding completion status
      const onboardingComplete = await AsyncStorage.getItem(
        'onboarding_complete'
      );

      if (onboardingComplete === 'true') {
        // User has completed onboarding, go to main app
        router.replace('/(auth)/(tabs)');
      } else {
        // User hasn't completed onboarding, go to create profile
        router.replace('/(auth)/create-profile');
      }
    } catch (error) {
      Alert.alert(
        'Login Failed',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setMode('welcome');
    setEmail('');
    setPassword('');
  };

  // ... rest of the component remains the same
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
          title="Create an account"
          onPress={() => setMode('signup')}
          variant="primary"
          fullWidth
        />
        <Button
          title="Log in with existing account"
          onPress={() => setMode('login')}
          variant="secondary"
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
            {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
          </AppText>
          <AppText variant="body" style={styles.formSubtitle}>
            {mode === 'signup'
              ? 'Enter your Cornell email to get started'
              : 'Log in to continue'}
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
            <AppInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
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
                title={mode === 'signup' ? 'Create Account' : 'Log In'}
                onPress={mode === 'signup' ? handleCreateAccount : handleLogin}
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
