import { CreateProfileInput, UpdateProfileInput, Gender } from '@/types';
import auth from '@react-native-firebase/auth';
import { useState } from 'react';
import { Alert } from 'react-native';
import {
  createProfile,
  deleteProfile,
  getAllProfiles,
  getCurrentUserProfile,
  getMatches,
  getProfileByNetid,
  updateProfile,
} from '../api/profileApi';

export const useProfileAPI = () => {
  const user = auth().currentUser;
  const [loading, setLoading] = useState(false);

  const executeWithLoading = async <T>(
    operation: () => Promise<T>,
    successMessage?: string,
    successCallback?: (result: T) => void
  ): Promise<T | null> => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return null;
    }

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

  const getCurrentProfile = () =>
    executeWithLoading(() => getCurrentUserProfile());

  const createNewProfile = (profileData: CreateProfileInput) =>
    executeWithLoading(
      () => createProfile(profileData),
      'Profile created successfully!'
    );

  const updateCurrentProfile = (updateData: UpdateProfileInput) =>
    executeWithLoading(
      () => updateProfile(updateData),
      'Profile updated successfully!'
    );

  const deleteCurrentProfile = () =>
    new Promise<boolean>((resolve) => {
      Alert.alert(
        'Confirm Deletion',
        'Are you sure you want to delete your profile? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const result = await executeWithLoading(
                () => deleteProfile(),
                'Profile deleted successfully!'
              );
              resolve(!!result);
            },
          },
        ]
      );
    });

  const searchProfileByNetid = (netid: string) =>
    executeWithLoading(() => getProfileByNetid(netid));

  const getMatchingProfiles = (limit: number = 20) =>
    executeWithLoading(() => getMatches(limit));

  const getAllProfilesWithFilters = (
    filters: {
      limit?: number;
      gender?: Gender;
      school?: string;
      minYear?: number;
      maxYear?: number;
    } = {}
  ) => {
    const options = {
      ...filters,
      excludeNetid: user?.email?.split('@')[0],
    };

    return executeWithLoading(() => getAllProfiles(options));
  };

  return {
    loading,
    getCurrentProfile,
    createNewProfile,
    updateCurrentProfile,
    deleteCurrentProfile,
    searchProfileByNetid,
    getMatchingProfiles,
    getAllProfilesWithFilters,
  };
};

export default useProfileAPI;
