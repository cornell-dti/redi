import AppInput from '@/app/components/ui/AppInput';
import AppText from '@/app/components/ui/AppText';
import Button from '@/app/components/ui/Button';
import ListItemWrapper from '@/app/components/ui/ListItemWrapper';
import Sheet from '@/app/components/ui/Sheet';
import Tag from '@/app/components/ui/Tag';
import { Ban } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '../components/AppColors';
import EditingHeader from '../components/ui/EditingHeader';
import { useThemeAware } from '../contexts/ThemeContext';
import auth from '@react-native-firebase/auth';
import { blockUser, unblockUser, getBlockedUsers } from '../api/blockingApi';

export default function SafetyPage() {
  useThemeAware(); // Force re-render when theme changes
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [showBlockSheet, setShowBlockSheet] = useState(false);
  const [blockInput, setBlockInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [blocking, setBlocking] = useState(false);

  const user = auth().currentUser;
  const currentNetid = user?.email?.split('@')[0] || '';

  // Fetch blocked users on component mount
  useEffect(() => {
    if (currentNetid) {
      fetchBlockedUsers();
    }
  }, [currentNetid]);

  const fetchBlockedUsers = async () => {
    try {
      setLoading(true);
      const response = await getBlockedUsers(currentNetid);
      setBlockedUsers(response.blockedUsers);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to fetch blocked users'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async () => {
    const netidToBlock = blockInput.trim();

    if (!netidToBlock) {
      Alert.alert('Error', 'Please enter a NetID');
      return;
    }

    try {
      setBlocking(true);
      await blockUser(netidToBlock);
      setBlockedUsers([...blockedUsers, netidToBlock]);
      setBlockInput('');
      setShowBlockSheet(false);
      Alert.alert('Success', `Blocked ${netidToBlock} successfully`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to block user');
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblockUser = async (netid: string) => {
    try {
      await unblockUser(netid);
      setBlockedUsers(blockedUsers.filter((user) => user !== netid));
      Alert.alert('Success', `Unblocked ${netid} successfully`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to unblock user');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <EditingHeader showSave={false} title="Safety" />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <AppText style={{ marginTop: 16 }}>Loading blocked users...</AppText>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{
            rowGap: 24,
          }}
        >
          <View style={styles.sectionsWrapper}>
            <View style={styles.section}>
              <View style={styles.topText}>
                <AppText variant="subtitle" indented>
                  Blocked Users
                </AppText>
                <AppText color="dimmer" indented>
                  These are users that you won't be matched with. They also
                  cannot be matched with you.
                </AppText>
              </View>

              <ListItemWrapper>
                {blockedUsers.length > 0 && (
                  <View style={styles.blockedUsersContainer}>
                    {blockedUsers.map((username) => (
                      <Tag
                        key={username}
                        label={username}
                        variant="white"
                        dismissible
                        onDismiss={() => handleUnblockUser(username)}
                      />
                    ))}
                  </View>
                )}
                <Button
                  title="Block a user"
                  iconLeft={Ban}
                  onPress={() => setShowBlockSheet(true)}
                  variant="secondary"
                  noRound
                />
              </ListItemWrapper>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Block User Sheet */}
      <Sheet
        visible={showBlockSheet}
        onDismiss={() => {
          setShowBlockSheet(false);
          setBlockInput('');
        }}
        title="Block user"
      >
        <View style={styles.sheetContent}>
          <AppText>Enter the NetID of the person you want to block.</AppText>
          <AppInput
            placeholder="NetID"
            value={blockInput}
            onChangeText={setBlockInput}
            autoCapitalize="none"
          />

          <View style={styles.buttonRow}>
            <Button
              title={blocking ? 'Blocking...' : 'Block User'}
              onPress={handleBlockUser}
              variant="negative"
              fullWidth
              iconLeft={Ban}
              disabled={blocking}
            />

            <Button
              title="Cancel"
              onPress={() => {
                setShowBlockSheet(false);
                setBlockInput('');
              }}
              variant="secondary"
              fullWidth
              disabled={blocking}
            />
          </View>
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
  scrollView: {
    padding: 16,
  },
  sectionsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  topText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  description: {
    paddingLeft: 16,
    fontSize: 14,
    color: AppColors.foregroundDimmer,
    marginBottom: 8,
  },
  blockedUsersContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
    backgroundColor: AppColors.backgroundDimmer,
  },
  sheetContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    display: 'flex',
    gap: 12,
  },
});
