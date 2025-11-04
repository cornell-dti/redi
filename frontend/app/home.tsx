import { router } from 'expo-router';
import { ArrowLeft, Info, LogIn, Plus } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getCurrentUser,
  signInUser,
  signUpUser,
  validateCornellEmail,
} from './api/authService';
import { getCurrentUserProfile } from './api/profileApi';
import { AppColors } from './components/AppColors';
import LegalFooterText from './components/onboarding/LegalFooterText';
import AppInput from './components/ui/AppInput';
import AppText from './components/ui/AppText';
import Button from './components/ui/Button';
import Sheet from './components/ui/Sheet';

type AuthMode = 'welcome' | 'signup' | 'login';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomePage() {
  const [mode, setMode] = useState<AuthMode>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  // Animation refs
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Animate page transitions when mode changes
  useEffect(() => {
    // Reset position based on direction
    slideAnim.setValue(direction === 'forward' ? SCREEN_WIDTH : -SCREEN_WIDTH);
    fadeAnim.setValue(0);

    // Animate in
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [mode]);

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

      // Get the current user's Firebase UID
      const user = getCurrentUser();
      if (!user?.uid) {
        throw new Error('Authentication failed. Please try again.');
      }

      // Check if user has a profile in the database
      const profile = await getCurrentUserProfile();

      if (profile) {
        // User has a complete profile, go to main app
        router.replace('/(auth)/(tabs)');
      } else {
        // User doesn't have a profile yet, go to create profile
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
    setDirection('backward');
    setMode('welcome');
    setEmail('');
    setPassword('');
  };

  const handleModeChange = (newMode: AuthMode) => {
    setDirection('forward');
    setMode(newMode);
  };

  const renderWelcomeScreen = () => (
    <Animated.View
      style={[
        styles.animatedContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
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
          title="Create account"
          onPress={() => handleModeChange('signup')}
          variant="primary"
          fullWidth
          iconLeft={Plus}
        />
        <Button
          title="Log in"
          onPress={() => handleModeChange('login')}
          variant="secondary"
          fullWidth
          iconLeft={LogIn}
        />
      </View>
    </Animated.View>
  );

  const renderAuthForm = () => (
    <Animated.View
      style={[
        styles.animatedContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <ScrollView
        style={styles.formScrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          <AppText variant="title" style={styles.formTitle}>
            {mode === 'signup' ? 'Create account' : 'Welcome back!'}
          </AppText>
          <AppText variant="subtitle" style={styles.formSubtitle}>
            {mode === 'signup'
              ? 'Enter your Cornell email to get started'
              : 'Log in to continue'}
          </AppText>

          <View style={styles.inputContainer}>
            <AppInput
              label="Cornell email"
              placeholder="netid@cornell.edu"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
              required
            />

            <TouchableOpacity
              onPress={() => setShowInfoSheet(true)}
              style={styles.infoIcon}
            >
              <Info size={16} color={AppColors.foregroundDimmer} />
            </TouchableOpacity>

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
        </View>
      </ScrollView>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={AppColors.accentDefault}
          style={styles.loader}
        />
      ) : (
        <View style={styles.buttonContainer}>
          <Button
            title={mode === 'signup' ? 'Create account' : 'Log in'}
            onPress={mode === 'signup' ? handleCreateAccount : handleLogin}
            variant="primary"
            fullWidth
            iconLeft={mode === 'signup' ? Plus : LogIn}
          />
          <Button
            title="Back"
            onPress={handleBack}
            variant="secondary"
            fullWidth
            iconLeft={ArrowLeft}
          />
        </View>
      )}
    </Animated.View>
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

      <Sheet
        visible={showInfoSheet}
        onDismiss={() => setShowInfoSheet(false)}
        title="Why Cornell Email?"
        height="auto"
      >
        <AppText variant="body" style={styles.sheetText}>
          We require a Cornell email address to ensure that redi is exclusively
          for the Cornell community. This helps create a safe and trusted
          environment where you can connect with fellow Cornellians.
        </AppText>
        <AppText variant="body" style={styles.sheetText}>
          Your email is kept private and is only used for account verification
          and authentication purposes.
        </AppText>
      </Sheet>
    </SafeAreaView>
  );
}

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
  animatedContainer: {
    flex: 1,
    justifyContent: 'space-between',
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
    paddingTop: 24,
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
    position: 'relative',
  },
  infoIcon: { position: 'absolute', top: 0, right: 8 },
  loader: {
    marginVertical: 20,
  },
  sheetText: {
    marginBottom: 16,
    lineHeight: 22,
  },
});
