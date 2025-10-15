import AppText from '@/app/components/ui/AppText';
import { ProfileResponse, PromptData } from '@/types';
import { router } from 'expo-router';
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
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
import ListItem from '../components/ui/ListItem';
import ListItemWrapper from '../components/ui/ListItemWrapper';
import Tag from '../components/ui/Tag';

// Mock fallback data for fields not in API
const mockFallbackData = {
  age: 22, // Not in ProfileResponse
  images: [
    'https://media.licdn.com/dms/image/v2/D4E03AQEppsomLWUZgA/profile-displayphoto-scale_200_200/B4EZkMKRSMIUAA-/0/1756845653823?e=2147483647&v=beta&t=oANMmUogYztIXt7p1pB11qv-Qwh0IHYmFMZIdl9CFZE',
    'https://media.licdn.com/dms/image/v2/D4E03AQEppsomLWUZgA/profile-displayphoto-scale_200_200/B4EZkMKRSMIUAA-/0/1756845653823?e=2147483647&v=beta&t=oANMmUogYztIXt7p1pB11qv-Qwh0IHYmFMZIdl9CFZE',
    'https://media.licdn.com/dms/image/v2/D4E03AQEppsomLWUZgA/profile-displayphoto-scale_200_200/B4EZkMKRSMIUAA-/0/1756845653823?e=2147483647&v=beta&t=oANMmUogYztIXt7p1pB11qv-Qwh0IHYmFMZIdl9CFZE',
  ],
  interests: ['Hiking', 'Photography', 'Board Games', 'Business', 'Travel'], // Not in current schema
};

export default function EditProfileScreen() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<PromptData[]>([]);

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const user = getCurrentUser();

    if (!user?.uid) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const profileData = await getCurrentUserProfile(user.uid);

      if (profileData) {
        setProfile(profileData);
        // Initialize prompts from profile data
        if (profileData.prompts && profileData.prompts.length > 0) {
          setPrompts(
            profileData.prompts.map((p, index) => ({
              id: index.toString(),
              question: p.question,
              answer: p.answer,
            }))
          );
        } else {
          // Initialize with at least one empty prompt
          setPrompts([
            {
              id: Date.now().toString(),
              question: '',
              answer: '',
            },
          ]);
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
  const displayImages =
    profile?.pictures && profile.pictures.length > 0
      ? profile.pictures
      : mockFallbackData.images;
  const displayBio = profile?.bio || 'No bio yet';
  const displaySchool = profile?.school || 'School not set';
  const displayMajor =
    profile?.major && profile.major.length > 0
      ? profile.major.join(', ')
      : 'Major not set';
  const displayYear = profile?.year?.toString() || 'Year not set';
  const displayInstagram = profile?.instagram || null;
  const displaySnapchat = profile?.snapchat || null;
  const displayLinkedIn = profile?.linkedIn || null;
  const displayGithub = profile?.github || null;
  const displayWebsite = profile?.website || null;
  const displayClubs = profile?.clubs || [];
  const displayInterests =
    profile?.interests && profile.interests.length > 0
      ? profile.interests
      : mockFallbackData.interests;
  const displayEthnicity =
    profile?.ethnicity && profile.ethnicity.length > 0
      ? profile.ethnicity.join(', ')
      : null;

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

      <View style={styles.buttonRow}>
        <Button
          title="Back"
          onPress={() => router.back()}
          variant="secondary"
          iconLeft={ChevronLeft}
        />

        <Button title="Save" onPress={() => {}} iconLeft={Check} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionsWrapper}>
          <View style={styles.section}>
            <AppText variant="subtitle" style={styles.subtitle}>
              My photos
            </AppText>
            <View style={styles.imageGrid}>
              {displayImages.map((image, index) => (
                <TouchableOpacity key={index} style={styles.imageContainer}>
                  <Image source={{ uri: image }} style={styles.image} />
                  {index === 0 && (
                    <View style={styles.badge}>
                      <AppText style={styles.badgeText}>Main</AppText>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
              {displayImages.length < 5 && (
                <TouchableOpacity style={styles.addImage}>
                  <Camera size={32} color={AppColors.foregroundDimmer} />
                </TouchableOpacity>
              )}
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
                    <View key={prompt.id} style={styles.promptItem}>
                      <AppText variant="subtitle" style={styles.promptQuestion}>
                        {prompt.question}
                      </AppText>
                      <AppText style={styles.promptAnswer}>
                        {prompt.answer}
                      </AppText>
                    </View>
                  ))}
              <Button
                title="Edit prompts"
                iconLeft={Pencil}
                onPress={() => {}}
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
                description={`${mockFallbackData.age}`}
                right={<ChevronRight />}
                onPress={() => {}}
              />

              <ListItem
                title="Gender"
                description={profile?.gender}
                right={<ChevronRight />}
                onPress={() => {}}
              />

              <ListItem
                title="Sexuality"
                description={`${profile?.sexualOrientation || undefined}`}
                right={<ChevronRight />}
                onPress={() => {}}
              />

              <ListItem
                title="Hometown"
                description={profile?.hometown}
                right={<ChevronRight />}
                onPress={() => {}}
              />

              <ListItem
                title="Education"
                description={`${profile?.year} in ${profile?.school} studying ${profile?.major?.join(', ')}`}
                right={<ChevronRight />}
                onPress={() => {}}
              />
            </ListItemWrapper>
          </View>

          <View style={styles.section}>
            <AppText variant="subtitle" style={styles.subtitle}>
              Socials
            </AppText>

            <ListItemWrapper>
              {(displayLinkedIn ||
                displayInstagram ||
                displaySnapchat ||
                displayGithub ||
                displayWebsite) && (
                <View style={styles.tagsContainer}>
                  {displayLinkedIn && <Tag label="LinkedIn" variant="white" />}
                  {displayInstagram && (
                    <Tag label="Instagram" variant="white" />
                  )}
                  {displaySnapchat && <Tag label="Snapchat" variant="white" />}
                  {displayGithub && <Tag label="GitHub" variant="white" />}
                  {displayWebsite && <Tag label="Website" variant="white" />}
                </View>
              )}
              <Button
                title="Edit"
                iconLeft={Pencil}
                onPress={() => {}}
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
              <View style={styles.tagsContainer}>
                {displayInterests.map((interest, index) => (
                  <Tag key={index} label={interest} variant="white" />
                ))}
              </View>

              <Button
                title="Edit"
                iconLeft={Pencil}
                onPress={() => {}}
                variant="secondary"
                noRound
              />
            </ListItemWrapper>
          </View>

          {displayClubs.length > 0 && (
            <View style={styles.section}>
              <AppText variant="subtitle" style={styles.subtitle}>
                Clubs
              </AppText>

              <ListItemWrapper>
                <View style={styles.tagsContainer}>
                  {displayClubs.map((club, index) => (
                    <Tag key={index} label={club} variant="white" />
                  ))}
                </View>

                <Button
                  title="Edit"
                  iconLeft={Pencil}
                  onPress={() => {}}
                  variant="secondary"
                  noRound
                />
              </ListItemWrapper>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
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
    flex: 1,
  },
  sectionsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
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
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    borderRadius: 24,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '31%',
    aspectRatio: 0.75,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: AppColors.accentDefault,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: AppColors.backgroundDefault,
    fontSize: 10,
    fontWeight: '600',
  },
  addImage: {
    width: '31%',
    aspectRatio: 0.75,
    borderRadius: 12,
    backgroundColor: AppColors.backgroundDimmer,
    justifyContent: 'center',
    alignItems: 'center',
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
  buttonRow: {
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
    gap: 24,
  },
});
