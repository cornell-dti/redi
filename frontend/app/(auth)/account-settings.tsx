import AppText from '@/app/components/ui/AppText';
import Button from '@/app/components/ui/Button';
import DeleteAccountSheet from '@/app/components/ui/DeleteAccountSheet';
import ListItem from '@/app/components/ui/ListItem';
import ListItemWrapper from '@/app/components/ui/ListItemWrapper';
import SignOutSheet from '@/app/components/ui/SignOutSheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { LogOut, Pencil, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser, signOutUser } from '../api/authService';
import { AppColors } from '../components/AppColors';
import AppInput from '../components/ui/AppInput';
import EditingHeader from '../components/ui/EditingHeader';
import { useThemeAware } from '../contexts/ThemeContext';

export default function AccountSettingsPage() {
  useThemeAware(); // Force re-render when theme changes
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [showSignOutSheet, setShowSignOutSheet] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
          Alert.alert('Error', 'You must be logged in');
          return;
        }

        setEmail(currentUser.email || null);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        Alert.alert('Error', 'Failed to load account information');
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, []);

  const confirmSignOut = async () => {
    try {
      console.log('Starting sign out process...');

      // Clear any stored data first
      await AsyncStorage.clear();
      console.log('AsyncStorage cleared');

      // Sign out from Firebase
      await signOutUser();
      console.log('Sign out successful');
      setShowSignOutSheet(false);
      router.replace('/home' as any);
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert(
        'Error',
        'Failed to sign out: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  };

  const confirmDeleteAccount = async () => {
    try {
      // TODO: Implement delete account logic
      Alert.alert('Coming Soon', 'Account deletion will be implemented soon');
      setShowDeleteSheet(false);
    } catch (error) {
      console.error('Delete account error:', error);
      Alert.alert(
        'Error',
        'Failed to delete account: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={AppColors.accentDefault} />
        <AppText style={styles.loadingText}>Loading...</AppText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <EditingHeader showSave={false} title="Account settings" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          rowGap: 24,
        }}
      >
        <View style={styles.section}>
          <AppText variant="subtitle" style={styles.subtitle}>
            Email
          </AppText>
          <ListItemWrapper>
            <AppInput value={`${email}`} noRound />
            <Button
              noRound
              disabled
              iconLeft={Pencil}
              variant="secondary"
              title="Cannot change email address"
              onPress={() => {}}
            />
          </ListItemWrapper>
        </View>

        <View style={styles.section}>
          <AppText variant="subtitle" style={styles.subtitle}>
            Password
          </AppText>
          <ListItemWrapper>
            <AppInput value="••••••••••" noRound />
            <Button
              noRound
              iconLeft={Pencil}
              variant="secondary"
              title="Edit"
              onPress={() => router.push('/edit-password' as any)}
            />
          </ListItemWrapper>
        </View>

        <View style={styles.section}>
          <AppText variant="subtitle" style={styles.subtitle} color="negative">
            Danger Zone
          </AppText>
          <ListItemWrapper>
            <ListItem
              title="Sign Out"
              left={<LogOut color={AppColors.negativeDefault} size={20} />}
              onPress={() => setShowSignOutSheet(true)}
              destructive
            />
            <ListItem
              title="Delete Account"
              left={<Trash2 color={AppColors.negativeDefault} size={20} />}
              onPress={() => setShowDeleteSheet(true)}
              destructive
            />
          </ListItemWrapper>
        </View>
      </ScrollView>

      {/* Sign Out Confirmation Sheet */}
      <SignOutSheet
        visible={showSignOutSheet}
        onDismiss={() => setShowSignOutSheet(false)}
        onConfirm={confirmSignOut}
      />

      {/* Delete Account Confirmation Sheet */}
      <DeleteAccountSheet
        visible={showDeleteSheet}
        onDismiss={() => setShowDeleteSheet(false)}
        onConfirm={confirmDeleteAccount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: AppColors.foregroundDimmer,
    marginTop: 12,
  },
  scrollView: {
    padding: 16,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  subtitle: {
    paddingLeft: 16,
  },
  sheetContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  sheetText: {
    fontSize: 16,
    textAlign: 'center',
    color: AppColors.foregroundDefault,
  },
  sheetButtons: {
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
  },
});
