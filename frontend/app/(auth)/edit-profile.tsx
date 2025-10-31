import AppText from '@/app/components/ui/AppText';
import { ProfileResponse, PromptData, getProfileAge } from '@/types';
import { router, useFocusEffect } from 'expo-router';
import { Camera, ChevronRight, Pencil, Plus } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser } from '../api/authService';
import { getCurrentUserProfile } from '../api/profileApi';
import { AppColors } from '../components/AppColors';
import Button from '../components/ui/Button';
import EditingHeader from '../components/ui/EditingHeader';
import ListItem from '../components/ui/ListItem';
import ListItemWrapper from '../components/ui/ListItemWrapper';
import Tag from '../components/ui/Tag';
import UnsavedChangesSheet from '../components/ui/UnsavedChangesSheet';
import { useThemeAware } from '../contexts/ThemeContext';

export default function EditProfileScreen() {
  useThemeAware(); // Force re-render when theme changes
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<PromptData[]>([]);
  const [showUnsavedSheet, setShowUnsavedSheet] = useState(false);
  const [originalPrompts, setOriginalPrompts] = useState<PromptData[]>([]);

  // Fetch profile data on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const fetchProfile = async () => {
    const user = getCurrentUser();

    if (!user?.uid) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const profileData = await getCurrentUserProfile();

      if (profileData) {
        setProfile(profileData);
        // Initialize prompts from profile data
        if (profileData.prompts && profileData.prompts.length > 0) {
          const initialPrompts = profileData.prompts.map((p, index) => ({
            id: index.toString(),
            question: p.question,
            answer: p.answer,
          }));
          setPrompts(initialPrompts);
          setOriginalPrompts(initialPrompts);
        } else {
          // Initialize with at least one empty prompt
          const emptyPrompt = [
            {
              id: Date.now().toString(),
              question: '',
              answer: '',
            },
          ];
          setPrompts(emptyPrompt);
          setOriginalPrompts(emptyPrompt);
        }
        setError(null);
      } else {
        setError('Profile not found. Please complete your profile.');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const openURL = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', `Cannot open URL: ${url}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open link');
      console.error('Error opening URL:', error);
    }
  };

  const hasUnsavedChanges = () => {
    return JSON.stringify(prompts) !== JSON.stringify(originalPrompts);
  };

  const handleBack = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedSheet(true);
    } else {
      router.back();
    }
  };

  const handleDiscardAndExit = () => {
    setShowUnsavedSheet(false);
    router.back();
  };

  const handleSaveAndExit = async () => {
    // TODO: Implement save functionality
    // await saveProfile();
    setOriginalPrompts(prompts);
    setShowUnsavedSheet(false);
    router.back();
  };

  const addPrompt = () => {
    if (prompts.length < 3) {
      const newPrompt: PromptData = {
        id: Date.now().toString(),
        question: '',
        answer: '',
      };
      setPrompts([...prompts, newPrompt]);
    }
  };

  const updatePrompt = (id: string, updatedPrompt: PromptData) => {
    setPrompts(prompts.map((p) => (p.id === id ? updatedPrompt : p)));
  };

  const removePrompt = (id: string) => {
    setPrompts(prompts.filter((p) => p.id !== id));
  };

  // Get display data - use profile data if available, otherwise fallback
  const displayName = profile?.firstName || 'User';
  const displayImages = profile?.pictures || [];
  const displayAge = profile ? getProfileAge(profile) : null;
  const displayBio = profile?.bio || 'No bio yet';
  const displaySchool = profile?.school || 'School not set';
  const displayMajor =
    profile?.major && profile.major.length > 0
      ? profile.major.join(', ')
      : 'Major not set';
  const displayYear = profile?.year || 'Year not set';
  // Social fields are only available on OwnProfileResponse
  const displayInstagram =
    profile && 'instagram' in profile ? profile.instagram || null : null;
  const displaySnapchat =
    profile && 'snapchat' in profile ? profile.snapchat || null : null;
  const displayLinkedIn =
    profile && 'linkedIn' in profile ? profile.linkedIn || null : null;
  const displayGithub =
    profile && 'github' in profile ? profile.github || null : null;
  const displayWebsite =
    profile && 'website' in profile ? profile.website || null : null;
  const displayClubs = profile?.clubs || [];
  const displayInterests = profile?.interests || [];
  const displayEthnicity =
    profile?.ethnicity && profile.ethnicity.length > 0
      ? profile.ethnicity.join(', ')
      : null;

  // Check if user has any social links
  const hasSocialLinks = !!(
    displayLinkedIn ||
    displayInstagram ||
    displaySnapchat ||
    displayGithub ||
    displayWebsite
  );

  // Show loading spinner while fetching
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={AppColors.accentDefault} />
        <AppText style={styles.loadingText}>Loading profile...</AppText>
      </SafeAreaView>
    );
  }

  // Show error message if failed to load
  if (error && !profile) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <AppText style={styles.errorText}>{error}</AppText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <EditingHeader showSave={false} title="Edit profile" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          rowGap: 24,
        }}
      >
        <View style={styles.section}>
          <AppText variant="subtitle" style={styles.subtitle}>
            My photos
          </AppText>
          <View style={styles.photoGrid}>
            {Array.from({ length: 6 }, (_, slotIndex) => {
              if (slotIndex < displayImages.length) {
                // Show existing photo
                return (
                  <TouchableOpacity
                    key={slotIndex}
                    style={styles.photoSlot}
                    onPress={() => {
                      // TODO: Add photo edit/reorder functionality
                      Alert.alert('Edit Photo', 'Photo editing coming soon!');
                    }}
                  >
                    <Image
                      source={{ uri: displayImages[slotIndex] }}
                      style={styles.photoImage}
                    />
                    {slotIndex === 0 && (
                      <Tag
                        label="Main"
                        style={styles.mainBadge}
                        variant="accent"
                      />
                    )}
                  </TouchableOpacity>
                );
              } else if (displayImages.length < 6) {
                // Show "Add more" button for all empty slots
                return (
                  <TouchableOpacity
                    key={slotIndex}
                    style={[styles.photoSlot, styles.addPhotoButton]}
                    onPress={() => {
                      // TODO: Add photo upload functionality
                      Alert.alert('Add Photo', 'Photo upload coming soon!');
                    }}
                  >
                    <Camera size={32} color={AppColors.foregroundDimmer} />
                    <AppText variant="bodySmall" style={styles.addPhotoText}>
                      {displayImages.length === 0 ? 'Add photo' : 'Add more'}
                    </AppText>
                  </TouchableOpacity>
                );
              }
              // This case won't happen since we return early if displayImages.length < 6
              return null;
            })}
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="subtitle" style={styles.subtitle}>
            Written prompts
          </AppText>

          <ListItemWrapper>
            {prompts.length > 0 &&
              prompts
                .filter((p) => p.question && p.answer)
                .map((prompt) => (
                  <ListItem
                    key={prompt.id}
                    title={prompt.question}
                    description={prompt.answer}
                    right={<ChevronRight size={20} />}
                    onPress={() =>
                      router.push({
                        pathname: '/edit-prompt',
                        params: {
                          promptId: prompt.id,
                          question: prompt.question,
                          answer: prompt.answer,
                        },
                      } as any)
                    }
                  />
                ))}
            <Button
              title="Add prompt"
              iconLeft={Plus}
              onPress={() =>
                router.push({
                  pathname: '/edit-prompt',
                  params: {
                    promptId: `new-${Date.now()}`,
                  },
                } as any)
              }
              variant="secondary"
              noRound
            />
          </ListItemWrapper>
        </View>

        <View style={styles.section}>
          <AppText variant="subtitle" style={styles.subtitle}>
            Details
          </AppText>

          <ListItemWrapper>
            <ListItem
              title="Age"
              description={displayAge ? `${displayAge}` : 'Not set'}
              right={<ChevronRight size={20} />}
              onPress={() => router.push('/edit-age' as any)}
            />

            <ListItem
              title="Gender"
              description={
                profile?.gender
                  ? profile.gender.charAt(0).toUpperCase() +
                    profile.gender.slice(1)
                  : ''
              }
              right={<ChevronRight size={20} />}
              onPress={() => router.push('/edit-gender' as any)}
            />

            <ListItem
              title="Sexuality"
              description={profile?.sexualOrientation?.join(', ') || 'Not set'}
              right={<ChevronRight size={20} />}
              onPress={() => router.push('/edit-sexuality' as any)}
            />

            <ListItem
              title="Hometown"
              description={profile?.hometown || 'Not set'}
              right={<ChevronRight size={20} />}
              onPress={() => router.push('/edit-hometown' as any)}
            />

            <ListItem
              title="Education"
              description={`${profile?.year} in ${profile?.school} studying ${profile?.major?.join(', ')}`}
              right={<ChevronRight size={20} />}
              onPress={() => router.push('/edit-education' as any)}
            />
          </ListItemWrapper>
        </View>

        <View style={styles.section}>
          <AppText variant="subtitle" style={styles.subtitle}>
            Socials
          </AppText>

          <ListItemWrapper>
            {hasSocialLinks ? (
              <View style={styles.tagsContainer}>
                {displayLinkedIn && <Tag label="LinkedIn" variant="white" />}
                {displayInstagram && <Tag label="Instagram" variant="white" />}
                {displaySnapchat && <Tag label="Snapchat" variant="white" />}
                {displayGithub && <Tag label="GitHub" variant="white" />}
                {displayWebsite && <Tag label="Website" variant="white" />}
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <AppText style={styles.emptyStateText}>
                  No social links yet - Add them here
                </AppText>
              </View>
            )}
            <Button
              title="Edit"
              iconLeft={Pencil}
              onPress={() => router.push('/edit-socials' as any)}
              variant="secondary"
              noRound
            />
          </ListItemWrapper>
        </View>

        <View style={styles.section}>
          <AppText variant="subtitle" style={styles.subtitle}>
            Interests
          </AppText>

          <ListItemWrapper>
            {displayInterests.length > 0 ? (
              <View style={styles.tagsContainer}>
                {displayInterests.map((interest: string, index: number) => (
                  <Tag key={index} label={interest} variant="white" />
                ))}
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <AppText style={styles.emptyStateText}>
                  No interests yet - Add them here
                </AppText>
              </View>
            )}

            <Button
              title="Edit"
              iconLeft={Pencil}
              onPress={() => router.push('/edit-interests' as any)}
              variant="secondary"
              noRound
            />
          </ListItemWrapper>
        </View>

        <View style={styles.section}>
          <AppText variant="subtitle" style={styles.subtitle}>
            Clubs
          </AppText>

          <ListItemWrapper>
            {displayClubs.length > 0 ? (
              <View style={styles.tagsContainer}>
                {displayClubs.map((club: string, index: number) => (
                  <Tag key={index} label={club} variant="white" />
                ))}
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <AppText style={styles.emptyStateText}>
                  No clubs yet - Add them here
                </AppText>
              </View>
            )}

            <Button
              title="Edit"
              iconLeft={Pencil}
              onPress={() => router.push('/edit-clubs' as any)}
              variant="secondary"
              noRound
            />
          </ListItemWrapper>
        </View>
      </ScrollView>

      {/* Unsaved Changes Confirmation Sheet */}
      <UnsavedChangesSheet
        visible={showUnsavedSheet}
        onDiscard={handleDiscardAndExit}
        onSave={handleSaveAndExit}
        onDismiss={() => setShowUnsavedSheet(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
    display: 'flex',
    flexDirection: 'column',
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
  errorText: {
    fontSize: 16,
    color: AppColors.negativeDefault,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
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
  promptsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  promptsList: {
    display: 'flex',
    flexDirection: 'column',
  },
  promptItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 16,
    borderRadius: 4,
    backgroundColor: AppColors.backgroundDimmer,
  },
  promptQuestion: {
    color: AppColors.foregroundDefault,
  },
  promptAnswer: {
    color: AppColors.foregroundDimmer,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    borderRadius: 24,
    overflow: 'hidden',
  },
  photoSlot: {
    width: '31.5%',
    height: 120,
    aspectRatio: 1,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mainBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  mainBadgeText: {
    color: AppColors.backgroundDefault,
    fontSize: 10,
    fontWeight: '600',
  },
  addPhotoButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: AppColors.backgroundDimmest,
    backgroundColor: AppColors.backgroundDimmer,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addPhotoText: {
    color: AppColors.foregroundDimmer,
    textAlign: 'center',
  },
  tagsContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    backgroundColor: AppColors.backgroundDimmer,
    padding: 16,
  },
  clubRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.backgroundDimmer,
  },
  clubText: {
    fontSize: 16,
    color: AppColors.foregroundDefault,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: AppColors.backgroundDefault,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: AppColors.backgroundDimmer,
  },
  emptyStateContainer: {
    backgroundColor: AppColors.backgroundDimmer,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    color: AppColors.foregroundDimmer,
    fontSize: 14,
    textAlign: 'center',
  },
});
