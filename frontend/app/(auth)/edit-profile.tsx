import AppText from '@/app/components/ui/AppText';
import { ProfileResponse, PromptData, getProfileAge } from '@/types';
import { router, useFocusEffect } from 'expo-router';
import {
  Check,
  ChevronRight,
  Eye,
  GripVertical,
  Pencil,
  Plus,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser } from '../api/authService';
import { deleteImage, uploadImages } from '../api/imageApi';
import { updateProfile } from '../api/profileApi';
import { AppColors } from '../components/AppColors';
import PhotoUploadGrid from '../components/onboarding/PhotoUploadGrid';
import Button from '../components/ui/Button';
import EditingHeader from '../components/ui/EditingHeader';
import FooterSpacer from '../components/ui/FooterSpacer';
import ListItem from '../components/ui/ListItem';
import ListItemWrapper from '../components/ui/ListItemWrapper';
import Tag from '../components/ui/Tag';
import UnsavedChangesSheet from '../components/ui/UnsavedChangesSheet';
import { useProfile } from '../contexts/ProfileContext';
import { useThemeAware } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface DraggablePromptItemProps {
  prompt: PromptData;
  index: number;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: (toIndex: number) => void;
  onHoverChange: (toIndex: number | null) => void;
  onPress: () => void;
  totalPrompts: number;
  onHaptic: () => void;
}

function DraggablePromptItem({
  prompt,
  index,
  isDragging,
  onDragStart,
  onDragEnd,
  onHoverChange,
  onPress,
  totalPrompts,
  onHaptic,
}: DraggablePromptItemProps) {
  const { gesture: handleGesture, animatedStyle } = useDragAndDrop({
    type: 'list',
    index,
    totalItems: totalPrompts,
    onDragStart,
    onDragEnd,
    onHoverChange,
    onHaptic,
    isDragging,
    listItemHeight: 72,
  });

  return (
    <Animated.View style={animatedStyle}>
      <ListItem
        title={prompt.question}
        description={prompt.answer}
        left={
          <GestureDetector gesture={handleGesture}>
            <View style={styles.dragHandle}>
              <GripVertical size={20} color={AppColors.foregroundDimmer} />
            </View>
          </GestureDetector>
        }
        right={<ChevronRight size={20} />}
        onPress={onPress}
      />
    </Animated.View>
  );
}

export default function EditProfileScreen() {
  useThemeAware(); // Force re-render when theme changes
  const { showToast } = useToast();
  const haptic = useHapticFeedback();
  const { profile: profileData, loading, refreshProfile, updateProfileData } = useProfile();
  const [prompts, setPrompts] = useState<PromptData[]>([]);
  const [showUnsavedSheet, setShowUnsavedSheet] = useState(false);
  const [originalPrompts, setOriginalPrompts] = useState<PromptData[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [originalPhotos, setOriginalPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [draggingPromptIndex, setDraggingPromptIndex] = useState<number | null>(
    null
  );
  const [hoverPromptIndex, setHoverPromptIndex] = useState<number | null>(null);
  const [pendingNavigation, setPendingNavigation] = useState<
    'back' | 'preview' | null
  >(null);

  // Scroll position preservation
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollPositionRef = useRef(0);

  // Initialize data from profile context
  useEffect(() => {
    if (profileData) {
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
      // Initialize photos from profile data
      const photosData = profileData.pictures || [];
      setPhotos(photosData);
      setOriginalPhotos(photosData);
    }
  }, [profileData]);

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
    const promptsChanged =
      JSON.stringify(prompts) !== JSON.stringify(originalPrompts);
    const photosChanged =
      JSON.stringify(photos) !== JSON.stringify(originalPhotos);
    return promptsChanged || photosChanged;
  };

  const handleSave = async () => {
    const user = getCurrentUser();
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    // Validate minimum photos requirement
    if (photos.length < 3) {
      Alert.alert('Error', 'Please add at least 3 photos');
      return;
    }

    setSaving(true);

    try {
      // Step 1: Determine which images are new (local URIs) vs existing (remote URLs)
      const newImages = photos.filter((uri) => uri.startsWith('file://'));

      // Step 2: Upload new images to Firebase Storage
      let uploadedImageUrls: string[] = [];
      if (newImages.length > 0) {
        try {
          setUploadingImages(true);
          uploadedImageUrls = await uploadImages(newImages);
          setUploadingImages(false);
        } catch (uploadError) {
          setUploadingImages(false);
          setSaving(false);
          Alert.alert(
            'Upload Error',
            'Failed to upload images. Please try again.'
          );
          console.error('Image upload failed:', uploadError);
          return;
        }
      }

      // Step 3: Combine existing URLs with newly uploaded URLs (maintain order)
      const finalImageUrls: string[] = [];
      let newImageIndex = 0;

      for (const photo of photos) {
        if (photo.startsWith('file://')) {
          // Replace local URI with uploaded URL
          finalImageUrls.push(uploadedImageUrls[newImageIndex]);
          newImageIndex++;
        } else {
          // Keep existing remote URL
          finalImageUrls.push(photo);
        }
      }

      // Step 4: Delete removed images from Firebase Storage
      const removedImages = originalPhotos.filter(
        (oldUrl) =>
          !finalImageUrls.includes(oldUrl) && !oldUrl.startsWith('file://')
      );

      if (removedImages.length > 0) {
        try {
          await Promise.all(removedImages.map((url) => deleteImage(url)));
        } catch (deleteError) {
          console.error('Failed to delete some images:', deleteError);
          // Don't fail the whole operation if deletion fails
        }
      }

      // Step 5: Update profile with final image URLs and prompts
      const updateData = {
        pictures: finalImageUrls,
        prompts: prompts
          .filter((p) => p.question && p.answer)
          .map((p) => ({ question: p.question, answer: p.answer })),
      };

      await updateProfile(updateData);

      // Update context with new values
      updateProfileData(updateData);

      setOriginalPrompts(prompts);
      setOriginalPhotos(finalImageUrls);
      setPhotos(finalImageUrls); // Update local state with remote URLs

      // Refresh profile from server in background
      refreshProfile();

      showToast({
        icon: <Check size={20} color={AppColors.backgroundDefault} />,
        label: 'Profile updated',
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
      setUploadingImages(false);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges()) {
      setPendingNavigation('back');
      setShowUnsavedSheet(true);
    } else {
      router.back();
    }
  };

  const handlePreviewProfile = () => {
    if (hasUnsavedChanges()) {
      setPendingNavigation('preview');
      setShowUnsavedSheet(true);
    } else {
      router.push('/profile-preview' as any);
    }
  };

  const handleDiscardAndExit = () => {
    setShowUnsavedSheet(false);
    if (pendingNavigation === 'back') {
      router.back();
    } else if (pendingNavigation === 'preview') {
      router.push('/profile-preview' as any);
    }
    setPendingNavigation(null);
  };

  const handleSaveAndExit = async () => {
    await handleSave();
    if (!saving) {
      // Only navigate if save was successful
      setShowUnsavedSheet(false);
      if (pendingNavigation === 'back') {
        router.back();
      } else if (pendingNavigation === 'preview') {
        router.push('/profile-preview' as any);
      }
      setPendingNavigation(null);
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

  const reorderPrompts = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const newPrompts = [...prompts];
    const [movedPrompt] = newPrompts.splice(fromIndex, 1);
    newPrompts.splice(toIndex, 0, movedPrompt);
    setPrompts(newPrompts);
  };

  // Get display data - use profile data if available, otherwise fallback
  const displayName = profileData?.firstName || 'User';
  const displayAge = profileData ? `${getProfileAge(profileData)}` : 'Not set';
  const displayBio = profileData?.bio || 'No bio yet';
  const displaySchool = profileData?.school || 'School not set';
  const displayMajor =
    profileData?.major && profileData.major.length > 0
      ? profileData.major.join(', ')
      : 'Major not set';
  const displayYear = profileData?.year || 'Year not set';
  // Social fields are only available on OwnProfileResponse
  const displayInstagram =
    profileData && 'instagram' in profileData ? profileData.instagram || null : null;
  const displaySnapchat =
    profileData && 'snapchat' in profileData ? profileData.snapchat || null : null;
  const displayLinkedIn =
    profileData && 'linkedIn' in profileData ? profileData.linkedIn || null : null;
  const displayGithub =
    profileData && 'github' in profileData ? profileData.github || null : null;
  const displayWebsite =
    profileData && 'website' in profileData ? profileData.website || null : null;
  const displayClubs = profileData?.clubs || [];
  const displayInterests = profileData?.interests || [];
  const displayEthnicity =
    profileData?.ethnicity && profileData.ethnicity.length > 0
      ? profileData.ethnicity.join(', ')
      : null;

  // Get socials order from profile, or use default order
  const socialsOrder =
    profileData && 'socialsOrder' in profileData && profileData.socialsOrder
      ? profileData.socialsOrder
      : ['instagram', 'snapchat', 'linkedin', 'github', 'website'];

  // Map social types to their display values and labels
  const socialMap: Record<
    string,
    { value: string | null; label: string } | null
  > = {
    instagram: displayInstagram
      ? { value: displayInstagram, label: 'Instagram' }
      : null,
    snapchat: displaySnapchat
      ? { value: displaySnapchat, label: 'Snapchat' }
      : null,
    linkedin: displayLinkedIn
      ? { value: displayLinkedIn, label: 'LinkedIn' }
      : null,
    github: displayGithub ? { value: displayGithub, label: 'GitHub' } : null,
    website: displayWebsite
      ? { value: displayWebsite, label: 'Website' }
      : null,
  };

  // Check if user has any social links
  const hasSocialLinks = !!(
    displayLinkedIn ||
    displayInstagram ||
    displaySnapchat ||
    displayGithub ||
    displayWebsite
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <EditingHeader
        showSave={true}
        title="Edit profile"
        onSave={handleSave}
        onBack={handleBack}
        isSaving={saving || uploadingImages}
        saveDisabled={!hasUnsavedChanges()}
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={{
          rowGap: 24,
        }}
        onScroll={(event) => {
          scrollPositionRef.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        <Button
          iconLeft={Eye}
          variant="secondary"
          title="Preview Profile"
          onPress={handlePreviewProfile}
          fullWidth
        />

        <View style={styles.section}>
          <AppText variant="subtitle" style={styles.subtitle}>
            My photos
          </AppText>
          <PhotoUploadGrid
            photos={photos}
            onPhotosChange={setPhotos}
            minPhotos={3}
            maxPhotos={6}
          />
        </View>

        <View style={styles.section}>
          <AppText variant="subtitle" style={styles.subtitle}>
            Written prompts (3 max)
          </AppText>

          <ListItemWrapper>
            {prompts.length > 0 &&
              prompts
                .filter((p) => p.question && p.answer)
                .map((prompt, index) => {
                  const isDragging = draggingPromptIndex === index;

                  // Show ghost placeholder at hover position
                  const shouldShowGhost =
                    hoverPromptIndex === index &&
                    draggingPromptIndex !== null &&
                    draggingPromptIndex !== hoverPromptIndex;

                  return (
                    <View key={prompt.id} style={styles.promptItemWrapper}>
                      {shouldShowGhost && draggingPromptIndex !== null && (
                        <View style={styles.promptGhostPlaceholder}>
                          <ListItem
                            title={prompts[draggingPromptIndex].question}
                            description={prompts[draggingPromptIndex].answer}
                            left={
                              <GripVertical
                                size={20}
                                color={AppColors.foregroundDimmer}
                              />
                            }
                            right={
                              <ChevronRight
                                size={20}
                                color={AppColors.foregroundDimmer}
                              />
                            }
                            style={{ opacity: 0.3 }}
                          />
                        </View>
                      )}
                      <DraggablePromptItem
                        prompt={prompt}
                        index={index}
                        isDragging={isDragging}
                        onDragStart={() => setDraggingPromptIndex(index)}
                        onDragEnd={(toIndex) => {
                          reorderPrompts(index, toIndex);
                          setDraggingPromptIndex(null);
                          setHoverPromptIndex(null);
                        }}
                        onHoverChange={setHoverPromptIndex}
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
                        totalPrompts={
                          prompts.filter((p) => p.question && p.answer).length
                        }
                        onHaptic={() => haptic.medium()}
                      />
                    </View>
                  );
                })}
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
              disabled={
                prompts.filter((p) => p.question && p.answer).length >= 3
              }
            />
          </ListItemWrapper>
        </View>

        <View style={styles.section}>
          <AppText variant="subtitle" style={styles.subtitle}>
            Details
          </AppText>

          <ListItemWrapper>
            <ListItem
              title="Name"
              description={displayName}
              right={<ChevronRight size={20} />}
              onPress={() => router.push('/edit-name' as any)}
            />

            <ListItem
              title="Age"
              description={displayAge}
              right={<ChevronRight size={20} />}
              onPress={() => router.push('/edit-age' as any)}
            />

            <ListItem
              title="Gender"
              description={
                profileData?.gender
                  ? profileData.gender.charAt(0).toUpperCase() +
                    profileData.gender.slice(1)
                  : ''
              }
              right={<ChevronRight size={20} />}
              onPress={() => router.push('/edit-gender' as any)}
            />

            <ListItem
              title="Sexuality"
              description={profileData?.sexualOrientation?.join(', ') || 'Not set'}
              right={<ChevronRight size={20} />}
              onPress={() => router.push('/edit-sexuality' as any)}
            />

            <ListItem
              title="Hometown"
              description={profileData?.hometown || 'Not set'}
              right={<ChevronRight size={20} />}
              onPress={() => router.push('/edit-hometown' as any)}
            />

            <ListItem
              title="Education"
              description={
                <AppText color="dimmer">
                  <AppText>{profileData?.year}</AppText>
                  {' in '}
                  <AppText>{profileData?.school}</AppText>
                  {' studying '}
                  <AppText>{profileData?.major?.join(', ')}</AppText>
                </AppText>
              }
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
                {socialsOrder.map((socialType) => {
                  const social = socialMap[socialType];
                  return social ? (
                    <Tag
                      key={socialType}
                      label={social.label}
                      variant="white"
                    />
                  ) : null;
                })}
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

        <FooterSpacer height={128} />
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
  tagsContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    backgroundColor: AppColors.backgroundDimmer,
    padding: 16,
    borderBottomEndRadius: 4,
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
  promptItemWrapper: {
    position: 'relative',
  },
  promptGhostPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: AppColors.accentDefault,
    borderRadius: 4,
    backgroundColor: AppColors.backgroundDimmer,
  },
  dragHandle: {
    padding: 8,
    marginLeft: -8,
  },
});
