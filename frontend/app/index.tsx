import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  KeyboardAvoidingView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { signInUser, signInWithGoogle, signUpUser } from './api/authService';

const GOOGLE_CLIENT_ID = '827839734794-ms5jes64lv5u1590imn34gnd4o9m7hj1.apps.googleusercontent.com';
const REDIRECT_SCHEME = 'com.incubator.redi';

export default function Index() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await signUpUser(email, password);
      Alert.alert('Success', 'Account created successfully! Please check your email for verification.');
    } catch (error) {
      Alert.alert('Registration Failed', error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await signInUser(email, password);
      // Navigation will be handled by _layout.tsx auth state listener
    } catch (error) {
      Alert.alert('Sign In Failed', error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle(GOOGLE_CLIENT_ID, REDIRECT_SCHEME);
      // Navigation will be handled by _layout.tsx auth state listener
    } catch (error) {
      // Only show alert if it's not a cancellation
      if (error instanceof Error && !error.message.includes('cancelled')) {
        Alert.alert('Google Sign-In Failed', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior="padding">
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Cornell Email (@cornell.edu)"
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Password"
          editable={!loading}
        />
        {loading ? (
          <ActivityIndicator size="large" style={styles.loader} />
        ) : (
          <>
            <Button onPress={handleSignIn} title="Login" />
            <Button onPress={handleSignUp} title="Create account" />
            <View style={styles.divider} />
            <Button onPress={handleGoogleSignIn} title="Sign in with Google" />
          </>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    marginVertical: 4,
    height: 50,
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#fff',
  },
  divider: {
    marginVertical: 10,
  },
  loader: {
    margin: 28,
  },
});