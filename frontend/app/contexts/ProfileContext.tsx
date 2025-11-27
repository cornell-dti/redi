import { OwnProfileResponse } from '@/types';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { getCurrentUserProfile, updateProfile } from '../api/profileApi';
import { getCurrentUser } from '../api/authService';

interface ProfileContextType {
  profile: OwnProfileResponse | null;
  loading: boolean;
  error: Error | null;
  refreshProfile: () => Promise<void>;
  updateProfileData: (data: Partial<OwnProfileResponse>) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<OwnProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    const user = getCurrentUser();
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const profileData = await getCurrentUserProfile();
      setProfile(profileData);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  /**
   * Optimistically updates the profile data in the context
   * This allows instant UI updates without waiting for API calls
   */
  const updateProfileData = useCallback((data: Partial<OwnProfileResponse>) => {
    setProfile((prev) => {
      if (!prev) return null;
      return { ...prev, ...data };
    });
  }, []);

  return (
    <ProfileContext.Provider
      value={{ profile, loading, error, refreshProfile, updateProfileData }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
