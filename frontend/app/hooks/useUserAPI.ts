import auth from '@react-native-firebase/auth';
import { useState } from 'react';
import { Alert } from 'react-native';
import { deleteUser, getAllUsers, getUserByNetid } from '../api/userApi';

export const useUserAPI = () => {
  const user = auth().currentUser;
  const [loading, setLoading] = useState(false);

  const executeWithLoading = async <T>(
    operation: () => Promise<T>,
    successMessage?: string,
    successCallback?: (result: T) => void
  ): Promise<T | null> => {
    setLoading(true);
    try {
      const result = await operation();

      if (successMessage) {
        Alert.alert('Success', successMessage);
      }

      successCallback?.(result);
      return result;
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Operation failed'
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = () => executeWithLoading(() => getAllUsers());

  const fetchUserByNetid = (netid: string) =>
    executeWithLoading(() => getUserByNetid(netid));

  const deleteUserByNetid = (netid: string) =>
    new Promise<boolean>((resolve) => {
      // Prevent users from deleting themselves
      const currentUserNetid = user?.email?.split('@')[0];
      if (netid === currentUserNetid) {
        Alert.alert('Error', 'Cannot delete your own account');
        resolve(false);
        return;
      }

      Alert.alert(
        'Confirm Deletion',
        `Are you sure you want to delete user "${netid}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const result = await executeWithLoading(
                () => deleteUser(netid),
                'User deleted successfully!'
              );
              resolve(!!result);
            },
          },
        ]
      );
    });

  return {
    loading,
    fetchAllUsers,
    fetchUserByNetid,
    deleteUserByNetid,
  };
};

export default useUserAPI;
