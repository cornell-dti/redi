import { router } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Info,
  LogIn,
  Play,
  Plus,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  getCurrentUser,
  signInUser,
  signInWithGoogle,
  signUpUser,
  validateCornellEmail,
} from './api/authService';
import { getCurrentUserProfile } from './api/profileApi';
import { AppColors } from './components/AppColors';
import GoogleIcon from './components/icons/GoogleIcon';
import OnboardingVideo from './components/onboarding/OnboardingVideo';
import AppInput from './components/ui/AppInput';
import AppText from './components/ui/AppText';
import Button from './components/ui/Button';
import LoadingSpinner from './components/ui/LoadingSpinner';
import Sheet from './components/ui/Sheet';

type AuthMode = 'splash' | 'welcome' | 'signup' | 'login';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomePage() {
  const [mode, setMode] = useState<AuthMode>('splash');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [showGoogleErrorSheet, setShowGoogleErrorSheet] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  // Animation refs for splash/welcome elements
  const buttonsSlideAnim = useRef(new Animated.Value(0)).current;
  const buttonsFadeAnim = useRef(new Animated.Value(1)).current;
  const footerSlideAnim = useRef(new Animated.Value(0)).current;
  const footerFadeAnim = useRef(new Animated.Value(1)).current;

  // Animation refs for auth form (signup/login screens)
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Animate transitions between splash and welcome
  useEffect(() => {
    if (mode === 'splash' || mode === 'welcome') {
      // Reset position based on direction
      buttonsSlideAnim.setValue(
        direction === 'forward' ? SCREEN_WIDTH : -SCREEN_WIDTH
      );
      buttonsFadeAnim.setValue(0);
      footerSlideAnim.setValue(
        direction === 'forward' ? SCREEN_WIDTH : -SCREEN_WIDTH
      );
      footerFadeAnim.setValue(0);

      // Animate in
      Animated.parallel([
        Animated.spring(buttonsSlideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 10,
        }),
        Animated.timing(buttonsFadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(footerSlideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 10,
        }),
        Animated.timing(footerFadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mode === 'signup' || mode === 'login') {
      // Animate auth form screens
      slideAnim.setValue(
        direction === 'forward' ? SCREEN_WIDTH : -SCREEN_WIDTH
      );
      fadeAnim.setValue(0);

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 40,
          friction: 0,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
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
        error instanceof Error
          ? error.message
          : 'Incorrect email or password. Please try again.'
      );
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setDirection('backward');
    if (mode === 'welcome') {
      setMode('splash');
    } else {
      setMode('welcome');
    }
    setEmail('');
    setPassword('');
  };

  const handleModeChange = (newMode: AuthMode) => {
    setDirection('forward');
    setMode(newMode);
  };

  const handleGetStarted = () => {
    setDirection('forward');
    setMode('welcome');
  };

  const handleReplayVideo = () => {
    setShowVideo(true);
  };

  const handleVideoFinish = () => {
    setShowVideo(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();

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
      setShowGoogleErrorSheet(true);
    } finally {
      setLoading(false);
    }
  };

  const renderSplashScreen = () => (
    <View style={{ flex: 1, gap: 24 }}>
      <View style={styles.logoContainerAlt}>
        <Image
          source={require('../assets/images/icon.png')}
          resizeMode="contain"
          style={styles.logoImage}
        />

        <AppText variant="title" style={styles.logoWordmark}>
          redi
        </AppText>
        <AppText variant="subtitle" color="dimmer">
          Cornell&apos;s first dating app
        </AppText>
      </View>

      {/* Fixed bottom area - buttons and footer stack vertically */}

      <Animated.View
        style={{
          gap: 12,
          justifyContent: 'flex-end',
          opacity: buttonsFadeAnim,
          transform: [{ translateX: buttonsSlideAnim }],
        }}
      >
        <Button
          title="Get Started"
          onPress={handleGetStarted}
          variant="primary"
          iconRight={ArrowRight}
        />

        <Button
          title="Replay Video"
          onPress={handleReplayVideo}
          variant="secondary"
          iconLeft={Play}
        />
      </Animated.View>

      <Animated.View
        style={{
          opacity: footerFadeAnim,
          transform: [{ translateX: footerSlideAnim }],
        }}
      >
        <AppText style={{ textAlign: 'center', height: 60 }} color="dimmer">
          Made by Incubator, part of DTI
        </AppText>
      </Animated.View>
    </View>
  );

  const renderWelcomeScreen = () => (
    <View style={{ flex: 1, gap: 24, position: 'relative' }}>
      {/* <View style={{ position: 'absolute', top: 48, right: 0, width: 200 }}>
        <Button
          title="DEBUG LOGIN"
          onPress={() => handleModeChange('login')}
          variant="negative"
          fullWidth
          iconLeft={Bug}
        />
      </View> */}

      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/icon.png')}
          resizeMode="contain"
          style={styles.logoImage}
        />

        <AppText variant="title" style={styles.logoWordmark}>
          redi
        </AppText>
        <AppText variant="subtitle" color="dimmer">
          Cornell&apos;s first dating app
        </AppText>
      </View>

      <Animated.View
        style={{
          gap: 12,
          justifyContent: 'flex-end',
          opacity: buttonsFadeAnim,
          transform: [{ translateX: buttonsSlideAnim }],
        }}
      >
        <Button
          title="Continue with Google"
          onPress={handleGoogleSignIn}
          variant="primary"
          fullWidth
          disabled={loading}
          iconLeft={GoogleIcon}
        />

        <Button
          title="Back"
          onPress={handleBack}
          variant="secondary"
          fullWidth
          iconLeft={ArrowLeft}
        />
      </Animated.View>

      <Animated.View
        style={{
          opacity: footerFadeAnim,
          transform: [{ translateX: footerSlideAnim }],
        }}
      >
        <AppText style={{ textAlign: 'center', height: 60 }} color="dimmer">
          By signing up, you agree to our{' '}
          <AppText
            color="accent"
            style={{ textDecorationLine: 'underline' }}
            onPress={() => Linking.openURL('https://redi.love/terms')}
          >
            Terms
          </AppText>
          . Learn how we process your data in our{' '}
          <AppText
            color="accent"
            style={{ textDecorationLine: 'underline' }}
            onPress={() => Linking.openURL('https://redi.love/privacy')}
          >
            Privacy
          </AppText>
          .
        </AppText>
      </Animated.View>
    </View>
  );

  const renderAuthForm = () => (
    <Animated.View
      style={[
        styles.screenContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      {/* Flexible top area - scrollable form */}
      <View style={styles.topSection}>
        <ScrollView
          style={styles.formScrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.formScrollContent}
        >
          <View style={styles.formContainer}>
            <AppText variant="title" style={styles.formTitle}>
              {mode === 'signup'
                ? 'Create account [DEBUG]'
                : 'Welcome back! [DEBUG]'}
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
      </View>

      {/* Fixed bottom area - buttons and footer stack vertically */}
      <View style={styles.bottomFixedSection}>
        {loading ? (
          <LoadingSpinner style={styles.loader} />
        ) : (
          <View style={styles.buttonContainer}>
            <Button
              title={mode === 'signup' ? 'Create account' : 'Log in'}
              onPress={mode === 'signup' ? handleCreateAccount : handleLogin}
              variant="primary"
              iconLeft={mode === 'signup' ? Plus : LogIn}
            />

            {/* Toggle between signup and login */}
            <TouchableOpacity
              onPress={() => {
                setDirection('forward');
                setMode(mode === 'signup' ? 'login' : 'signup');
              }}
              style={styles.toggleAuthMode}
            >
              <AppText variant="body" style={styles.toggleAuthModeText}>
                {mode === 'signup'
                  ? 'Already have an account? '
                  : "Don't have an account? "}
                <AppText variant="body" style={styles.toggleAuthModeTextBold}>
                  {mode === 'signup' ? 'Log in' : 'Create account'}
                </AppText>
              </AppText>
            </TouchableOpacity>

            <Button
              title="Back"
              onPress={handleBack}
              variant="secondary"
              iconLeft={ArrowLeft}
            />
          </View>
        )}
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* <StatusBar barStyle="dark-content" /> */}

      {mode === 'splash' && renderSplashScreen()}
      {mode === 'welcome' && renderWelcomeScreen()}
      {(mode === 'signup' || mode === 'login') && renderAuthForm()}

      {/* Onboarding Video Modal */}
      <OnboardingVideo visible={showVideo} onFinish={handleVideoFinish} />

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

      <Sheet
        visible={showGoogleErrorSheet}
        onDismiss={() => setShowGoogleErrorSheet(false)}
        title="Could not continue with Google"
        height="auto"
      >
        <AppText variant="body" style={styles.sheetText}>
          Please try again with your Cornell .edu email address.
        </AppText>

        <AppText variant="body" style={styles.sheetText}>
          We require a Cornell email address to ensure that redi is exclusively
          for the Cornell community. This helps create a safe and trusted
          environment where you can connect with fellow Cornellians.
        </AppText>
        <AppText variant="body" style={styles.sheetText}>
          Your email is kept private and is only used for account verification
          and authentication purposes.
        </AppText>

        <Button
          onPress={() => setShowGoogleErrorSheet(false)}
          title="Close"
          variant="secondary"
        />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    // alignItems: 'center',
    backgroundColor: AppColors.backgroundDefault,
  },
  // Main screen container - holds top and bottom sections
  screenContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  // Top section - flexible, takes available space
  topSection: {
    flex: 1,
  },
  // Center content - "redi" title area
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainerAlt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 96,
  },
  logoImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginBottom: 16,
  },
  logoWordmark: {
    fontSize: 48,
    lineHeight: 48,
  },
  subtitle: {
    color: AppColors.foregroundDimmer,
  },
  // Bottom fixed section - NOT flex, stacks children naturally
  bottomFixedSection: {
    // No flex - this is key to prevent overlap
  },
  // Button container - stacks buttons with gap
  buttonContainer: {
    // gap: 12,
    // marginBottom: 20,
  },
  // Footer container - separate, below buttons
  footerContainer: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  // Form-specific styles
  formScrollView: {
    flex: 1,
  },
  formScrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    paddingTop: 20,
    paddingBottom: 20,
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
  infoIcon: {
    position: 'absolute',
    top: 0,
    right: 8,
  },
  loader: {
    marginVertical: 20,
  },
  sheetText: {
    marginBottom: 16,
    lineHeight: 22,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: AppColors.backgroundDimmest,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
  },
  toggleAuthMode: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleAuthModeText: {
    color: AppColors.foregroundDimmer,
    fontSize: 14,
  },
  toggleAuthModeTextBold: {
    fontWeight: '600',
  },
});
