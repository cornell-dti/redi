import {
  ETHNICITY_OPTIONS,
  GENDER_OPTIONS,
  INTERESTED_IN_OPTIONS,
  PRONOUN_OPTIONS,
  PromptData,
  SEXUAL_ORIENTATION_OPTIONS,
  YEAR_OPTIONS,
} from '@/types';
import { router } from 'expo-router';
import { Check, ChevronDown, Plus } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
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
import ListItem from '../components/ui/ListItem';
import ListItemWrapper from '../components/ui/ListItemWrapper';
import SearchableDropdown from '../components/ui/SearchableDropdown';
import Sheet from '../components/ui/Sheet';
import Tag from '../components/ui/Tag';
import { useThemeAware } from '../contexts/ThemeContext';
import { useOnboardingState } from '../hooks/useOnboardingState';
import {
  extractPreferencesFromOnboarding,
  transformOnboardingToProfilePayload,
  validateProfilePayload,
} from '../utils/onboardingTransform';

const TOTAL_STEPS = 15; // Steps 2-16 (Step 1 is in home.tsx)
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CreateProfileScreen() {
  useThemeAware(); // Force re-render when theme changes
  const [currentStep, setCurrentStep] = useState(2); // Start at step 2
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

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
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  if (!isLoaded) {
    return null; // Wait for AsyncStorage to load
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      Alert.alert('Required', 'Please complete all required fields');
      return;
    }

    if (currentStep === 14) {
      normalizeSocialMediaLinks();
    }

    if (currentStep < 16) {
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

  const normalizeSocialMediaLinks = () => {
    // Normalize LinkedIn
    if (data.linkedIn) {
      let linkedin = data.linkedIn.trim();
      // Remove @ if present
      linkedin = linkedin.replace(/^@/, '');
      // Remove https:// or http:// if present
      linkedin = linkedin.replace(/^https?:\/\//, '');
      // Remove www. if present
      linkedin = linkedin.replace(/^www\./, '');
      // If it doesn't start with linkedin.com, add it
      if (!linkedin.startsWith('linkedin.com/')) {
        // If it's just a username, add the full path
        if (!linkedin.includes('/')) {
          linkedin = `linkedin.com/in/${linkedin}`;
        } else {
          linkedin = `linkedin.com/${linkedin}`;
        }
      }
      updateField('linkedIn', `https://${linkedin}`);
    }

    // Normalize Instagram
    if (data.instagram) {
      let instagram = data.instagram.trim();
      // Remove @ if present
      instagram = instagram.replace(/^@/, '');
      // Remove https:// or http:// if present
      instagram = instagram.replace(/^https?:\/\//, '');
      // Remove www. if present
      instagram = instagram.replace(/^www\./, '');
      // Remove instagram.com/ if present (we'll add it back)
      instagram = instagram.replace(/^instagram\.com\//, '');
      // Create the full Instagram URL
      updateField('instagram', `https://instagram.com/${instagram}`);
    }

    // Normalize Snapchat
    if (data.snapchat) {
      let snapchat = data.snapchat.trim();
      // Remove @ if present
      snapchat = snapchat.replace(/^@/, '');
      // Remove https:// or http:// if present
      snapchat = snapchat.replace(/^https?:\/\//, '');
      // Remove www. if present
      snapchat = snapchat.replace(/^www\./, '');
      // Remove snapchat.com/add/ if present (we'll add it back)
      snapchat = snapchat.replace(/^snapchat\.com\/add\//, '');
      // Create the full Snapchat URL
      updateField('snapchat', `https://snapchat.com/add/${snapchat}`);
    }

    // Normalize GitHub
    if (data.github) {
      let github = data.github.trim();
      // Remove @ if present
      github = github.replace(/^@/, '');
      // Remove https:// or http:// if present
      github = github.replace(/^https?:\/\//, '');
      // Remove www. if present
      github = github.replace(/^www\./, '');
      // Remove github.com/ if present (we'll add it back)
      github = github.replace(/^github\.com\//, '');
      // Create the full GitHub URL
      updateField('github', `https://github.com/${github}`);
    }

    // Normalize Website (ensure it has https://)
    if (data.website) {
      let website = data.website.trim();
      if (!website.startsWith('http://') && !website.startsWith('https://')) {
        updateField('website', `https://${website}`);
      }
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
            'Failed to upload images. Please try again.'
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
              subtitle="Select all that describe you to help us show your profile to the right people"
            />

            <ListItemWrapper>
              {PRONOUN_OPTIONS.map((pronoun) => (
                <ListItem
                  key={pronoun}
                  title={pronoun}
                  selected={data.pronouns.includes(pronoun)}
                  onPress={() => toggleArrayItem('pronouns', pronoun)}
                  right={
                    data.pronouns.includes(pronoun) ? (
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
            <AppInput
              placeholder="E.g. New York City"
              value={data.hometown}
              onChangeText={(text) => updateField('hometown', text)}
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
              title="What's your ethnicity?"
              subtitle="Optional - this helps you connect with people who share similar cultural backgrounds."
            />
            <ListItemWrapper>
              {ETHNICITY_OPTIONS.map((ethnicity) => {
                const isPreferNotToSay = ethnicity === 'Prefer not to say';
                const hasPreferNotToSay =
                  data.ethnicity?.includes('Prefer not to say');
                const hasOtherEthnicity =
                  data.ethnicity &&
                  data.ethnicity.some((e) => e !== 'Prefer not to say');

                // Disable "Prefer not to say" if other ethnicities are selected
                // Disable other ethnicities if "Prefer not to say" is selected
                const isDisabled = isPreferNotToSay
                  ? hasOtherEthnicity
                  : hasPreferNotToSay;

                return (
                  <ListItem
                    key={ethnicity}
                    title={ethnicity}
                    selected={data.ethnicity?.includes(ethnicity)}
                    disabled={isDisabled}
                    onPress={() => {
                      if (isPreferNotToSay) {
                        // If clicking "Prefer not to say", toggle it exclusively
                        if (hasPreferNotToSay) {
                          // Already selected, unselect it
                          updateField('ethnicity', []);
                        } else {
                          // Not selected, set it exclusively
                          updateField('ethnicity', ['Prefer not to say']);
                        }
                      } else {
                        // If clicking other ethnicity and "Prefer not to say" is selected, remove it first
                        if (hasPreferNotToSay) {
                          updateField('ethnicity', [ethnicity]);
                        } else {
                          toggleArrayItem('ethnicity', ethnicity);
                        }
                      }
                    }}
                    right={
                      data.ethnicity?.includes(ethnicity) ? (
                        <Check size={20} color={AppColors.accentDefault} />
                      ) : null
                    }
                  />
                );
              })}
            </ListItemWrapper>
          </View>
        );

      case 10:
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

      case 11:
        return (
          <View style={styles.stepContainer}>
            <OnboardingTitle title="Choose 3-6 photos for your profile" />
            <PhotoUploadGrid
              photos={data.pictures}
              onPhotosChange={(photos) => updateField('pictures', photos)}
              minPhotos={3}
              maxPhotos={6}
            />
          </View>
        );

      case 12:
        return (
          <View style={styles.stepContainer}>
            <OnboardingTitle title="Select 1-3 prompts for your profile" />
            <View style={styles.promptsContainer}>
              {data.prompts.map((prompt) => (
                <PromptSelector
                  key={prompt.id}
                  prompt={prompt}
                  onUpdate={(updated) => updatePrompt(prompt.id, updated)}
                  onRemove={() => removePrompt(prompt.id)}
                  canRemove={true}
                />
              ))}
              {data.prompts.length < 3 && (
                <Button
                  title={
                    data.prompts.length === 0 ? 'Select prompt' : 'Add prompt'
                  }
                  onPress={addPrompt}
                  variant="secondary"
                  fullWidth
                  iconLeft={Plus}
                />
              )}
            </View>
          </View>
        );

      case 13:
        return (
          <View style={styles.stepContainer}>
            <OnboardingTitle
              title="What clubs are you in?"
              subtitle="Optional - Add any Cornell clubs or organizations you're part of."
            />

            {data.clubs.length > 0 && (
              <View style={styles.majorTags}>
                {data.clubs.map((club, index) => (
                  <Tag
                    key={club}
                    label={club}
                    dismissible
                    onDismiss={() => removeClub(index)}
                  />
                ))}
              </View>
            )}

            <Button
              title="Add club"
              iconLeft={Plus}
              onPress={() => setShowClubInput(true)}
              variant="secondary"
            />

            <Sheet
              visible={showClubInput}
              onDismiss={() => {
                setShowClubInput(false);
                setClubInput('');
              }}
              title="Add club"
              bottomRound={false}
            >
              <View style={styles.majorSheetContent}>
                <AppInput
                  autoFocus
                  placeholder="Enter club name"
                  value={clubInput}
                  onChangeText={setClubInput}
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={addClub}
                />
                <Button
                  title="Add"
                  onPress={addClub}
                  variant="primary"
                  fullWidth
                  iconLeft={Plus}
                />
              </View>
            </Sheet>
          </View>
        );

      case 14:
        return (
          <View style={styles.stepContainer}>
            <OnboardingTitle
              title="Connect your social media"
              subtitle="All fields are optional - add any you'd like to share"
            />
            <AppInput
              label="Instagram"
              placeholder="@username"
              value={data.instagram}
              onChangeText={(text) => updateField('instagram', text)}
            />
            <AppInput
              label="Snapchat"
              placeholder="username"
              value={data.snapchat}
              onChangeText={(text) => updateField('snapchat', text)}
            />
            <AppInput
              label="LinkedIn"
              placeholder="linkedin.com/in/username"
              value={data.linkedIn}
              onChangeText={(text) => updateField('linkedIn', text)}
            />
            <AppInput
              label="GitHub"
              placeholder="github.com/username"
              value={data.github}
              onChangeText={(text) => updateField('github', text)}
            />
            <AppInput
              label="Personal Website"
              placeholder="https://yourwebsite.com"
              value={data.website}
              onChangeText={(text) => updateField('website', text)}
            />
          </View>
        );

      case 15:
        return (
          <View style={styles.stepContainer}>
            <OnboardingTitle
              title="What are your interests?"
              subtitle="Share what you're passionate about"
            />

            {data.interests.length > 0 && (
              <View style={styles.majorTags}>
                {data.interests.map((interest, index) => (
                  <Tag
                    key={interest}
                    label={interest}
                    dismissible
                    onDismiss={() => removeInterest(index)}
                  />
                ))}
              </View>
            )}

            <Button
              title="Add interest"
              iconLeft={Plus}
              onPress={() => setShowInterestInput(true)}
              variant="secondary"
            />

            <Sheet
              visible={showInterestInput}
              onDismiss={() => {
                setShowInterestInput(false);
                setInterestInput('');
              }}
              title="Add interest"
              bottomRound={false}
            >
              <View style={styles.majorSheetContent}>
                <AppInput
                  autoFocus
                  placeholder="Enter an interest"
                  value={interestInput}
                  onChangeText={setInterestInput}
                  returnKeyType="done"
                  onSubmitEditing={addInterest}
                />
                <Button
                  title="Add"
                  onPress={addInterest}
                  variant="primary"
                  fullWidth
                  iconLeft={Plus}
                />
              </View>
            </Sheet>
          </View>
        );

      case 16:
        return (
          <View style={styles.stepContainer}>
            <AppText variant="title">Welcome, {data.firstName}!</AppText>
            <View style={styles.welcomeContainer}>
              {data.pictures[0] && (
                <Image
                  source={{ uri: data.pictures[0] }}
                  style={styles.welcomePhoto}
                />
              )}
              <AppText variant="body" style={styles.welcomeText}>
                Matches drop every Friday at 9:00 AM. Send a nudge to show
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
    if (currentStep === 16) return 'Get started';
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
    if (currentStep === 9) updateField('showEthnicityOnProfile', checked);
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

      <Animated.View
        style={{
          flex: 1,
          transform: [{ translateX: slideAnim }],
          opacity: fadeAnim,
        }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderStep()}
        </ScrollView>
      </Animated.View>

      <OnboardingFooter
        onNext={handleNext}
        nextDisabled={!validateStep(currentStep) || isSubmitting}
        nextLabel={getNextLabel()}
        showCheckbox={showCheckbox}
        checkboxLabel={getCheckboxLabel()}
        checkboxChecked={getCheckboxValue()}
        onCheckboxChange={handleCheckboxChange}
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
    gap: '24',
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
});
