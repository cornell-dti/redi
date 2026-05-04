import {
  GENDER_OPTIONS,
  INTERESTED_IN_OPTIONS,
  PRONOUN_OPTIONS,
  PromptData,
  SEXUAL_ORIENTATION_OPTIONS,
  YEAR_OPTIONS,
} from '@/types';
import { router } from 'expo-router';
import { Check, ChevronDown, GripVertical, Plus } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated as RNAnimated,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CORNELL_MAJORS, CORNELL_SCHOOLS } from '../../constants/cornell';
import { getCurrentUser } from '../api/authService';
import { uploadImages } from '../api/imageApi';
import { updatePreferences } from '../api/preferencesApi';
import { createProfile } from '../api/profileApi';
import { AppColors } from '../components/AppColors';
import OnboardingFooter from '../components/onboarding/OnboardingFooter';
import OnboardingHeader from '../components/onboarding/OnboardingHeader';
import OnboardingTitle from '../components/onboarding/OnboardingTitle';
import PhotoUploadGrid from '../components/onboarding/PhotoUploadGrid';
import PromptSelector from '../components/onboarding/PromptSelector';
import AppInput from '../components/ui/AppInput';
import AppText from '../components/ui/AppText';
import Button from '../components/ui/Button';
import CityAutocomplete from '../components/ui/CityAutocomplete';
import ListItem from '../components/ui/ListItem';
import ListItemWrapper from '../components/ui/ListItemWrapper';
import SearchableDropdown from '../components/ui/SearchableDropdown';
import Sheet from '../components/ui/Sheet';
import Tag from '../components/ui/Tag';
import { useProfile } from '../contexts/ProfileContext';
import { useThemeAware } from '../contexts/ThemeContext';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { useOnboardingState } from '../hooks/useOnboardingState';
import {
  extractPreferencesFromOnboarding,
  transformOnboardingToProfilePayload,
  validateProfilePayload,
} from '../utils/onboardingTransform';

const TOTAL_STEPS = 10; // Steps 2-11 (Step 1 is in home.tsx)
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PROMPT_ITEM_HEIGHT = 120; // Approximate height of a prompt selector

interface DraggablePromptSelectorProps {
  prompt: PromptData;
  index: number;
  isDragging: boolean;
  onUpdate: (prompt: PromptData) => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragEnd: (toIndex: number) => void;
  onHoverChange: (toIndex: number | null) => void;
  canRemove: boolean;
  totalPrompts: number;
  onHaptic: () => void;
}

function DraggablePromptSelector({
  prompt,
  index,
  isDragging,
  onUpdate,
  onRemove,
  onDragStart,
  onDragEnd,
  onHoverChange,
  canRemove,
  totalPrompts,
  onHaptic,
}: DraggablePromptSelectorProps) {
  const translateY = useSharedValue(0);
  const zIndex = useSharedValue(0);
  const lastTargetIndex = useSharedValue(index);

  const handleGesture = Gesture.Pan()
    .onStart(() => {
      runOnJS(onDragStart)();
      zIndex.value = 1000;
      lastTargetIndex.value = index;
    })
    .onUpdate((event) => {
      translateY.value = event.translationY;

      const offset = Math.round(event.translationY / PROMPT_ITEM_HEIGHT);
      const targetIndex = Math.max(
        0,
        Math.min(index + offset, totalPrompts - 1)
      );

      if (targetIndex !== lastTargetIndex.value) {
        runOnJS(onHaptic)();
        lastTargetIndex.value = targetIndex;
      }

      runOnJS(onHoverChange)(targetIndex);
    })
    .onEnd((event) => {
      const offset = Math.round(event.translationY / PROMPT_ITEM_HEIGHT);
      const toIndex = Math.max(0, Math.min(index + offset, totalPrompts - 1));

      runOnJS(onDragEnd)(toIndex);
      runOnJS(onHoverChange)(null);

      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      zIndex.value = 0;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    zIndex: zIndex.value,
    opacity: isDragging ? 0.8 : 1,
  }));

  return (
    <Animated.View style={[animatedStyle, styles.draggablePromptWrapper]}>
      <View style={styles.promptWithHandle}>
        <GestureDetector gesture={handleGesture}>
          <View style={styles.promptDragHandle}>
            <GripVertical size={20} color={AppColors.foregroundDimmer} />
          </View>
        </GestureDetector>
        <View style={styles.promptSelectorContainer}>
          <PromptSelector
            prompt={prompt}
            onUpdate={onUpdate}
            onRemove={onRemove}
            canRemove={canRemove}
          />
        </View>
      </View>
    </Animated.View>
  );
}

export default function CreateProfileScreen() {
  useThemeAware(); // Force re-render when theme changes
  const haptic = useHapticFeedback();
  const { refreshProfile } = useProfile();

  const [currentStep, setCurrentStep] = useState(2); // Start at step 2
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const slideAnim = useRef(new RNAnimated.Value(0)).current;
  const fadeAnim = useRef(new RNAnimated.Value(1)).current;
  const [draggingPromptIndex, setDraggingPromptIndex] = useState<number | null>(
    null
  );
  const [hoverPromptIndex, setHoverPromptIndex] = useState<number | null>(null);

  const {
    data,
    updateField,
    toggleArrayItem,
    validateStep,
    clearStorage,
    isLoaded,
  } = useOnboardingState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showSchoolSheet, setShowSchoolSheet] = useState(false);
  const [showClubInput, setShowClubInput] = useState(false);
  const [clubInput, setClubInput] = useState('');
  const [showInterestInput, setShowInterestInput] = useState(false);
  const [interestInput, setInterestInput] = useState('');
  const [showMajorSheet, setShowMajorSheet] = useState(false);

  // Animate page transitions
  useEffect(() => {
    // Reset position based on direction
    slideAnim.setValue(direction === 'forward' ? SCREEN_WIDTH : -SCREEN_WIDTH);
    fadeAnim.setValue(0);

    // Animate in
    RNAnimated.parallel([
      RNAnimated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }),
      RNAnimated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep, direction, slideAnim, fadeAnim]);

  if (!isLoaded) {
    return null; // Wait for AsyncStorage to load
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      Alert.alert('Required', 'Please complete all required fields');
      return;
    }

    if (currentStep < 11) {
      setDirection('forward');
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 2) {
      setDirection('backward');
      setCurrentStep(currentStep - 1);
    } else if (currentStep === 2) {
      // Go back to home/signup screen
      router.replace('/home' as any);
    }
  };

  const handleSubmit = async () => {
    // Get the authenticated user's Firebase UID
    const currentUser = getCurrentUser();
    const firebaseUid = currentUser?.uid;

    if (!firebaseUid) {
      Alert.alert('Error', 'You must be logged in to create a profile');
      router.replace('/(auth)/home' as any);
      return;
    }

    try {
      setIsSubmitting(true);

      // Step 1: Upload images to Firebase Storage
      let uploadedImageUrls: string[] = [];
      if (data.pictures.length > 0) {
        try {
          setUploadingImages(true);
          uploadedImageUrls = await uploadImages(data.pictures);
          setUploadingImages(false);
        } catch (uploadError) {
          setUploadingImages(false);
          Alert.alert(
            'Upload Error',
            uploadError instanceof Error
              ? uploadError.message
              : 'Failed to upload images. Please try again.'
          );
          console.error('Image upload failed:', uploadError);
          return;
        }
      }

      // Step 2: Transform data to API payload with uploaded image URLs
      const payload = transformOnboardingToProfilePayload(data, firebaseUid);

      // Replace local image URIs with uploaded URLs
      payload.pictures = uploadedImageUrls;

      // Validate payload
      const validation = validateProfilePayload(payload);
      if (!validation.valid) {
        Alert.alert('Missing Information', validation.errors.join('\n'));
        return;
      }

      // Step 3: Submit profile to backend
      const { firebaseUid: uid, ...profileData } = payload;
      await createProfile(profileData);

      // Step 4: Save preferences (interestedIn -> preferences.genders)
      try {
        const preferencesData = extractPreferencesFromOnboarding(data);
        if (preferencesData.genders && preferencesData.genders.length > 0) {
          await updatePreferences(preferencesData);
        }
      } catch (prefError) {
        // Don't fail the whole onboarding if preferences save fails
        console.error('Failed to save preferences:', prefError);
      }

      await refreshProfile();

      // Clear storage and navigate to main app
      await clearStorage();
      router.replace('/(auth)/(tabs)' as any);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Failed to create profile. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeMajor = (index: number) => {
    updateField(
      'major',
      data.major.filter((_, i) => i !== index)
    );
  };

  const addPrompt = () => {
    if (data.prompts.length < 3) {
      const newPrompt: PromptData = {
        id: Date.now().toString(),
        question: '',
        answer: '',
      };
      updateField('prompts', [...data.prompts, newPrompt]);
    }
  };

  const updatePrompt = (id: string, updatedPrompt: PromptData) => {
    updateField(
      'prompts',
      data.prompts.map((p) => (p.id === id ? updatedPrompt : p))
    );
  };

  const removePrompt = (id: string) => {
    updateField(
      'prompts',
      data.prompts.filter((p) => p.id !== id)
    );
  };

  const reorderPrompts = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const newPrompts = [...data.prompts];
    const [movedPrompt] = newPrompts.splice(fromIndex, 1);
    newPrompts.splice(toIndex, 0, movedPrompt);
    updateField('prompts', newPrompts);
  };

  const addClub = () => {
    if (clubInput.trim()) {
      updateField('clubs', [...data.clubs, clubInput.trim()]);
      setClubInput('');
      setShowClubInput(false);
    }
  };

  const removeClub = (index: number) => {
    updateField(
      'clubs',
      data.clubs.filter((_, i) => i !== index)
    );
  };

  const addInterest = () => {
    if (interestInput.trim()) {
      updateField('interests', [...data.interests, interestInput.trim()]);
      setInterestInput('');
      setShowInterestInput(false);
    }
  };

  const removeInterest = (index: number) => {
    updateField(
      'interests',
      data.interests.filter((_, i) => i !== index)
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 2:
        return (
          <View style={styles.stepContainer}>
            <OnboardingTitle title="To start, let's learn more about you!" />
            <AppInput
              label="Your first name"
              placeholder="Ezra"
              value={data.firstName}
              onChangeText={(text) => updateField('firstName', text)}
              required
            />
            <AppInput
              label="Your birthday"
              placeholder="MM/DD/YYYY"
              value={data.birthdate}
              onChangeText={(text) => updateField('birthdate', text)}
              dateFormat
              required
            />
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <OnboardingTitle
              title="What's your gender?"
              subtitle="Select what best describes you to help us show your profile to the right people."
            />
            <ListItemWrapper>
              {GENDER_OPTIONS.map((gender) => (
                <ListItem
                  key={gender.value}
                  title={gender.label}
                  selected={data.genders.includes(gender.value)}
                  onPress={() => updateField('genders', [gender.value])}
                  right={
                    data.genders.includes(gender.value) ? (
                      <Check size={20} color={AppColors.accentDefault} />
                    ) : null
                  }
                />
              ))}
            </ListItemWrapper>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <OnboardingTitle
              title="What pronouns do you use?"
              subtitle="Select the pronouns that best describe you"
            />

            <ListItemWrapper>
              {PRONOUN_OPTIONS.map((pronoun) => (
                <ListItem
                  key={pronoun}
                  title={pronoun}
                  selected={data.pronouns === pronoun}
                  onPress={() => updateField('pronouns', pronoun)}
                  right={
                    data.pronouns === pronoun ? (
                      <Check size={20} color={AppColors.accentDefault} />
                    ) : null
                  }
                />
              ))}
            </ListItemWrapper>
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContainer}>
            <OnboardingTitle title="What's your hometown?" />
            <CityAutocomplete
              value={data.hometown}
              onSelect={(city) => updateField('hometown', city)}
            />
          </View>
        );

      case 6:
        return (
          <View style={styles.stepContainer}>
            <OnboardingTitle title="What's your college and area of study?" />
            <Button
              title={data.school || 'Select college'}
              onPress={() => setShowSchoolSheet(true)}
              variant="secondary"
              fullWidth
              dropdown
              iconRight={ChevronDown}
            />

            <ListItemWrapper>
              {data.major.length > 0 && (
                <View style={styles.majorTagsFilled}>
                  {data.major.map((major, index) => (
                    <Tag
                      key={major}
                      variant="white"
                      label={major}
                      dismissible
                      onDismiss={() => removeMajor(index)}
                    />
                  ))}
                </View>
              )}
              <Button
                title="Add field of study"
                iconLeft={Plus}
                onPress={() => setShowMajorSheet(true)}
                variant="secondary"
                noRound
                disabled={!data.school} // Disable if no school selected
              />
            </ListItemWrapper>

            <Sheet
              visible={showSchoolSheet}
              onDismiss={() => setShowSchoolSheet(false)}
              title="Select your college"
            >
              <ListItemWrapper>
                {CORNELL_SCHOOLS.map((school) => (
                  <ListItem
                    key={school}
                    title={school}
                    selected={data.school === school}
                    onPress={() => {
                      if (data.school !== school) {
                        updateField('major', []);
                      }
                      updateField('school', school);
                      setShowSchoolSheet(false);
                    }}
                    right={
                      data.school === school ? (
                        <Check size={16} color={AppColors.accentDefault} />
                      ) : null
                    }
                  />
                ))}
              </ListItemWrapper>
            </Sheet>

            {showMajorSheet && (
              <SearchableDropdown
                options={data.school ? CORNELL_MAJORS[data.school] : []}
                value=""
                onSelect={(selectedMajor) => {
                  if (!data.major.includes(selectedMajor)) {
                    updateField('major', [...data.major, selectedMajor]);
                  }
                  setShowMajorSheet(false);
                }}
                onDismiss={() => setShowMajorSheet(false)}
                placeholder="Search for your major"
                allowOther={true}
                autoOpen={true}
              />
            )}
          </View>
        );

      case 7:
        return (
          <View style={styles.stepContainer}>
            <OnboardingTitle title="What year are you in?" />
            <ListItemWrapper>
              {YEAR_OPTIONS.map((year) => (
                <ListItem
                  key={year}
                  title={year}
                  selected={data.year === year}
                  onPress={() => updateField('year', year)}
                  right={
                    data.year === year ? (
                      <Check size={20} color={AppColors.accentDefault} />
                    ) : null
                  }
                />
              ))}
            </ListItemWrapper>
          </View>
        );

      case 8:
        return (
          <View style={styles.stepContainer}>
            <OnboardingTitle
              title="What's your sexual orientation?"
              subtitle="Select the option that best describes you to help us show your profile to the right people."
            />
            <ListItemWrapper>
              {SEXUAL_ORIENTATION_OPTIONS.map((orientation) => (
                <ListItem
                  key={orientation}
                  title={orientation}
                  selected={data.sexualOrientation.includes(orientation)}
                  onPress={() =>
                    updateField('sexualOrientation', [orientation])
                  }
                  right={
                    data.sexualOrientation.includes(orientation) ? (
                      <Check size={20} color={AppColors.accentDefault} />
                    ) : null
                  }
                />
              ))}
            </ListItemWrapper>
          </View>
        );

      case 9:
        return (
          <View style={styles.stepContainer}>
            <OnboardingTitle
              title="Who are you interested in seeing?"
              subtitle="Select all that help us find the right people for you."
            />
            <ListItemWrapper>
              {INTERESTED_IN_OPTIONS.map((option) => (
                <ListItem
                  key={option}
                  title={option}
                  selected={data.interestedIn.includes(option)}
                  onPress={() => toggleArrayItem('interestedIn', option)}
                  right={
                    data.interestedIn.includes(option) ? (
                      <Check size={20} color={AppColors.accentDefault} />
                    ) : null
                  }
                />
              ))}
            </ListItemWrapper>
          </View>
        );

      case 10:
        return (
          <View style={styles.stepContainer}>
            <OnboardingTitle
              title="Choose 3-6 photos for your profile"
              subtitle="Optional - Add photos so others can recognize you."
            />
            <PhotoUploadGrid
              photos={data.pictures}
              onPhotosChange={(photos) => updateField('pictures', photos)}
              minPhotos={3}
              maxPhotos={6}
            />
          </View>
        );

      case 11:
        return (
          <View style={styles.stepContainer}>
            <AppText variant="title" style={{ textAlign: 'center' }}>
              And now, {data.firstName}, you&apos;re redi!
            </AppText>
            <View style={styles.welcomeContainer}>
              {data.pictures[0] && (
                <Image
                  source={{ uri: data.pictures[0] }}
                  style={styles.welcomePhoto}
                />
              )}
              <AppText variant="body" style={styles.welcomeText}>
                Matches drop every Friday at 12:00 AM. Send a nudge to show
                interest, and if they nudge back, you&apos;ll unlock chat!
              </AppText>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const getNextLabel = () => {
    if (uploadingImages) return 'Uploading images...';
    if (isSubmitting) return 'Creating profile...';
    if (currentStep === 11) return 'Get started';
    return 'Next';
  };

  const showCheckbox = [3, 4, 5, 6, 8, 9].includes(currentStep);
  const getCheckboxLabel = () => {
    if (currentStep === 3) return 'Show on my profile';
    if (currentStep === 4) return 'Show on my profile';
    if (currentStep === 5) return 'Show on my profile';
    if (currentStep === 6) return 'Show on my profile';
    if (currentStep === 8) return 'Show on my profile';
    if (currentStep === 9) return 'Show on my profile';
    return '';
  };

  const getCheckboxValue = () => {
    if (currentStep === 3) return data.showGenderOnProfile;
    if (currentStep === 4) return data.showPronounsOnProfile;
    if (currentStep === 5) return data.showHometownOnProfile;
    if (currentStep === 6) return data.showCollegeOnProfile;
    if (currentStep === 8) return data.showSexualOrientationOnProfile;
    if (currentStep === 9) return data.showEthnicityOnProfile;
    return false;
  };

  const handleCheckboxChange = (checked: boolean) => {
    if (currentStep === 3) updateField('showGenderOnProfile', checked);
    if (currentStep === 4) updateField('showPronounsOnProfile', checked);
    if (currentStep === 5) updateField('showHometownOnProfile', checked);
    if (currentStep === 6) updateField('showCollegeOnProfile', checked);
    if (currentStep === 8)
      updateField('showSexualOrientationOnProfile', checked);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <OnboardingHeader
        currentStep={currentStep - 1}
        totalSteps={TOTAL_STEPS}
        onBack={handleBack}
        showBackButton={true}
      />

      <RNAnimated.View
        style={{
          flex: 1,
          transform: [{ translateX: slideAnim }],
          opacity: fadeAnim,
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={styles.content}
            contentContainerStyle={{ paddingBottom: 200 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {renderStep()}
          </ScrollView>
        </KeyboardAvoidingView>
      </RNAnimated.View>

      <OnboardingFooter
        onNext={handleNext}
        nextDisabled={!validateStep(currentStep) || isSubmitting}
        nextLabel={getNextLabel()}
        showCheckbox={showCheckbox}
        checkboxLabel={getCheckboxLabel()}
        checkboxChecked={getCheckboxValue()}
        onCheckboxChange={handleCheckboxChange}
        loading={uploadingImages || isSubmitting}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    justifyContent: 'center',
    padding: 20,
    gap: 20,
  },
  majorContainer: {
    gap: 12,
  },
  majorTags: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  majorTagsFilled: {
    backgroundColor: AppColors.backgroundDimmer,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    padding: 16,
  },
  majorInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  majorSheetContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  promptsContainer: {
    gap: 16,
  },
  welcomeContainer: {
    alignItems: 'center',
    gap: 24,
  },
  welcomePhoto: {
    width: 200,
    height: 266,
    borderRadius: 12,
  },
  welcomeText: {
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 360,
  },
  draggablePromptWrapper: {
    position: 'relative',
  },
  promptWithHandle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  promptDragHandle: {
    padding: 8,
    paddingTop: 16,
    marginLeft: -8,
  },
  promptSelectorContainer: {
    flex: 1,
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
    borderRadius: 24,
    backgroundColor: AppColors.backgroundDimmer,
  },
});
