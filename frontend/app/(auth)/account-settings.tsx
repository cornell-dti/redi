import AppText from '@/app/components/ui/AppText';
import Button from '@/app/components/ui/Button';
import ListItem from '@/app/components/ui/ListItem';
import ListItemWrapper from '@/app/components/ui/ListItemWrapper';
import Sheet from '@/app/components/ui/Sheet';
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

export default function AccountSettingsPage() {
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

      <EditingHeader title="Account Settings" showSave={false} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionsWrapper}>
          <AppText variant="title">Account settings</AppText>
        </View>

        <View style={styles.sectionsWrapper}>
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
            <AppText
              variant="subtitle"
              style={styles.subtitle}
              color="negative"
            >
              Danger Zone
            </AppText>
            <ListItemWrapper>
              <ListItem
                title="Log Out"
                left={<LogOut color={AppColors.negativeDefault} />}
                onPress={() => setShowSignOutSheet(true)}
                destructive
              />
              <ListItem
                title="Delete Account"
                left={<Trash2 color={AppColors.negativeDefault} />}
                onPress={() => setShowDeleteSheet(true)}
                destructive
              />
            </ListItemWrapper>
          </View>
        </View>
      </ScrollView>

      {/* Sign Out Confirmation Sheet */}

      <Sheet
        visible={showSignOutSheet}
        onDismiss={() => setShowSignOutSheet(false)}
        title="Sign Out"
        height={265}
      >
        <View style={styles.sheetContent}>
          <AppText>Are you sure you want to sign out?</AppText>
          <ListItemWrapper>
            <Button
              title="Sign Out"
              onPress={confirmSignOut}
              variant="negative"
              iconLeft={LogOut}
              noRound
              fullWidth
            />
            <Button
              title="Never mind"
              onPress={() => setShowSignOutSheet(false)}
              variant="secondary"
              noRound
              fullWidth
            />
          </ListItemWrapper>
        </View>
      </Sheet>

      {/* Delete Account Confirmation Sheet */}
      <Sheet
        visible={showDeleteSheet}
        onDismiss={() => setShowDeleteSheet(false)}
        title="Delete Account"
        height={315}
      >
        <View style={styles.sheetContent}>
          <AppText>
            Are you sure you want to delete your account? This action cannot be
            undone and all your data will be permanently deleted.
          </AppText>
          <ListItemWrapper>
            <Button
              title="Delete Account"
              onPress={confirmDeleteAccount}
              variant="negative"
              fullWidth
              noRound
              iconLeft={Trash2}
            />
            <Button
              title="Keep my account"
              onPress={() => setShowDeleteSheet(false)}
              variant="secondary"
              fullWidth
              noRound
            />
          </ListItemWrapper>
        </View>
      </Sheet>
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
    flex: 1,
  },
  sectionsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
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
