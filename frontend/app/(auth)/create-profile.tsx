import {
  CORNELL_SCHOOLS,
  GENDER_OPTIONS,
  GRADUATION_YEARS,
  INTERESTED_IN_OPTIONS,
  PRONOUN_OPTIONS,
  PromptData,
  SEXUAL_ORIENTATION_OPTIONS,
} from '@/types';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser } from '../api/authService';
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
import Sheet from '../components/ui/Sheet';
import { useOnboardingState } from '../hooks/useOnboardingState';
import {
  transformOnboardingToProfilePayload,
  validateProfilePayload,
} from '../utils/onboardingTransform';

const TOTAL_STEPS = 14; // Steps 2-15 (Step 1 is in home.tsx)

export default function CreateProfileScreen() {
  const [currentStep, setCurrentStep] = useState(2); // Start at step 2
  const {
    data,
    updateField,
    toggleArrayItem,
    validateStep,
    clearStorage,
    isLoaded,
  } = useOnboardingState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSchoolSheet, setShowSchoolSheet] = useState(false);
  const [showMajorInput, setShowMajorInput] = useState(false);
  const [majorInput, setMajorInput] = useState('');
  const [showClubInput, setShowClubInput] = useState(false);
  const [clubInput, setClubInput] = useState('');
  const [showInterestInput, setShowInterestInput] = useState(false);
  const [interestInput, setInterestInput] = useState('');

  if (!isLoaded) {
    return null; // Wait for AsyncStorage to load
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      Alert.alert('Required', 'Please complete all required fields');
      return;
    }

    if (currentStep === 13) {
      normalizeSocialMediaLinks();
    }

    if (currentStep < 15) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 2) {
      setCurrentStep(currentStep - 1);
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

      // Transform data to API payload
      const payload = transformOnboardingToProfilePayload(data, firebaseUid);

      // Validate payload
      const validation = validateProfilePayload(payload);
      if (!validation.valid) {
        Alert.alert('Missing Information', validation.errors.join('\n'));
        return;
      }

      // Submit to backend - extract firebaseUid from payload
      const { firebaseUid: uid, ...profileData } = payload;
      await createProfile(uid, profileData);

      // Clear storage and navigate to main app
      await clearStorage();
      Alert.alert('Welcome!', 'Your profile has been created successfully!', [
        {
          text: 'Get Started',
          onPress: () => router.replace('/(auth)/(tabs)' as any),
        },
      ]);
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

  const addMajor = () => {
    if (majorInput.trim()) {
      updateField('major', [...data.major, majorInput.trim()]);
      setMajorInput('');
      setShowMajorInput(false);
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
            <OnboardingTitle title="To start, let's learn more about you" />
            <AppInput
              label="Your first name"
              placeholder="First name"
              value={data.firstName}
              onChangeText={(text) => updateField('firstName', text)}
              required
            />
            <AppInput
              label="Your birthday"
              placeholder="MM/DD/YYYY"
              value={data.birthdate}
              onChangeText={(text) => updateField('birthdate', text)}
              required
            />
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <OnboardingTitle
              title="What's your gender?"
              subtitle="Select all that describe you to help us show your profile to the right people."
            />
            <ListItemWrapper>
              {GENDER_OPTIONS.map((gender) => (
                <ListItem
                  key={gender}
                  title={gender}
                  selected={data.genders.includes(gender)}
                  onPress={() => toggleArrayItem('genders', gender)}
                  right={
                    data.genders.includes(gender) ? (
                      <Check size={24} color={AppColors.backgroundDefault} />
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
                      <Check size={24} color={AppColors.backgroundDefault} />
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
            />
            <View style={styles.majorContainer}>
              {data.major.map((major, index) => (
                <View key={index} style={styles.majorTag}>
                  <AppText variant="body">{major}</AppText>
                  <Button
                    title="×"
                    onPress={() => removeMajor(index)}
                    variant="secondary"
                  />
                </View>
              ))}
              {showMajorInput ? (
                <View style={styles.majorInputRow}>
                  <AppInput
                    placeholder="Enter major"
                    value={majorInput}
                    onChangeText={setMajorInput}
                    style={{ flex: 1 }}
                  />
                  <Button title="Add" onPress={addMajor} variant="primary" />
                </View>
              ) : (
                <Button
                  title="+ Add major"
                  onPress={() => setShowMajorInput(true)}
                  variant="secondary"
                />
              )}
            </View>

            <Sheet
              visible={showSchoolSheet}
              onDismiss={() => setShowSchoolSheet(false)}
              title="Select your college"
              height={500}
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
                  />
                ))}
              </ListItemWrapper>
            </Sheet>
          </View>
        );

      case 7:
        return (
          <View style={styles.stepContainer}>
            <OnboardingTitle title="What's your graduation year?" />
            <ListItemWrapper>
              {GRADUATION_YEARS.map((year) => (
                <ListItem
                  key={year}
                  title={year.toString()}
                  selected={data.year === year}
                  onPress={() => updateField('year', year)}
                  right={
                    data.year === year ? (
                      <Check size={24} color={AppColors.backgroundDefault} />
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
              subtitle="Select all that describe you to help us show your profile to the right people."
            />
            <ListItemWrapper>
              {SEXUAL_ORIENTATION_OPTIONS.map((orientation) => (
                <ListItem
                  key={orientation}
                  title={orientation}
                  selected={data.sexualOrientation.includes(orientation)}
                  onPress={() =>
                    toggleArrayItem('sexualOrientation', orientation)
                  }
                  right={
                    data.sexualOrientation.includes(orientation) ? (
                      <Check size={24} color={AppColors.backgroundDefault} />
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
                      <Check size={24} color={AppColors.backgroundDefault} />
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
            <OnboardingTitle title="Choose 3-5 photos for your profile" />
            {/* TODO: this is currently crashing every time I try to test on the app */}
            <PhotoUploadGrid
              photos={data.pictures}
              onPhotosChange={(photos) => updateField('pictures', photos)}
              minPhotos={3}
              maxPhotos={5}
            />
            {/* Temporary skip button for testing */}
            <Button
              title="Skip Photos (Testing Only)"
              onPress={() => {
                // Add placeholder photos for testing
                const placeholderPhotos = [
                  'https://media.licdn.com/dms/image/v2/D5603AQFxIrsKx3XV3g/profile-displayphoto-shrink_200_200/B56ZdXeERIHUAg-/0/1749519189434?e=2147483647&v=beta&t=MscfLHknj7AGAwDGZoRcVzT03zerW4P1jUR2mZ3QMKU',
                  'https://media.licdn.com/dms/image/v2/D4E03AQHIyGmXArUgLQ/profile-displayphoto-shrink_200_200/B4EZSMgrNeGwAY-/0/1737524163741?e=2147483647&v=beta&t=nb1U9gqxgOz9Jzf0bAnUY5wk5R9v_nn9AsgdhYbbpbk',
                  'https://media.licdn.com/dms/image/v2/D4E03AQEppsomLWUZgA/profile-displayphoto-scale_200_200/B4EZkMKRSMIUAA-/0/1756845653823?e=2147483647&v=beta&t=oANMmUogYztIXt7p1pB11qv-Qwh0IHYmFMZIdl9CFZE',
                ];
                updateField('pictures', placeholderPhotos);
                Alert.alert(
                  'Photos Skipped',
                  'Placeholder photos added for testing',
                  [{ text: 'OK', onPress: () => setCurrentStep(11) }]
                );
              }}
              variant="secondary"
            />
          </View>
        );

      case 11:
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
                  canRemove={data.prompts.length > 1}
                />
              ))}
              {data.prompts.length < 3 && (
                <Button
                  title="+ Add another prompt"
                  onPress={addPrompt}
                  variant="secondary"
                  fullWidth
                />
              )}
            </View>
          </View>
        );

      case 12:
        return (
          <View style={styles.stepContainer}>
            <OnboardingTitle
              title="What clubs are you in?"
              subtitle="Add any Cornell clubs or organizations you're part of"
            />
            <View style={styles.majorContainer}>
              {data.clubs.map((club, index) => (
                <View key={index} style={styles.majorTag}>
                  <AppText variant="body">{club}</AppText>
                  <Button
                    title="×"
                    onPress={() => removeClub(index)}
                    variant="secondary"
                  />
                </View>
              ))}
              {showClubInput ? (
                <View style={styles.majorInputRow}>
                  <AppInput
                    placeholder="Enter club name"
                    value={clubInput}
                    onChangeText={setClubInput}
                    style={{ flex: 1 }}
                  />
                  <Button title="Add" onPress={addClub} variant="primary" />
                </View>
              ) : (
                <Button
                  title="+ Add club"
                  onPress={() => setShowClubInput(true)}
                  variant="secondary"
                />
              )}
            </View>
          </View>
        );

      case 13:
        return (
          <View style={styles.stepContainer}>
            <OnboardingTitle
              title="Connect your social media"
              subtitle="All fields are optional - add any you'd like to share"
            />
            <AppInput
              label="LinkedIn"
              placeholder="linkedin.com/in/username"
              value={data.linkedIn}
              onChangeText={(text) => updateField('linkedIn', text)}
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

      case 14:
        return (
          <View style={styles.stepContainer}>
            <OnboardingTitle
              title="What are your interests?"
              subtitle="Share what you're passionate about"
            />
            <View style={styles.majorContainer}>
              {data.interests.map((interest, index) => (
                <View key={index} style={styles.majorTag}>
                  <AppText variant="body">{interest}</AppText>
                  <Button
                    title="×"
                    onPress={() => removeInterest(index)}
                    variant="secondary"
                  />
                </View>
              ))}
              {showInterestInput ? (
                <View style={styles.majorInputRow}>
                  <AppInput
                    placeholder="Enter an interest"
                    value={interestInput}
                    onChangeText={setInterestInput}
                    style={{ flex: 1 }}
                  />
                  <Button title="Add" onPress={addInterest} variant="primary" />
                </View>
              ) : (
                <Button
                  title="+ Add Interest"
                  onPress={() => setShowInterestInput(true)}
                  variant="secondary"
                />
              )}
            </View>
          </View>
        );

      case 15:
        return (
          <View style={styles.stepContainer}>
            <OnboardingTitle title={`Welcome ${data.firstName}!`} />
            <View style={styles.welcomeContainer}>
              {data.pictures[0] && (
                <Image
                  source={{ uri: data.pictures[0] }}
                  style={styles.welcomePhoto}
                />
              )}
              <AppText variant="body" style={styles.welcomeText}>
                Matches drop every Friday at 9am. Send a nudge to show interest,
                and if they nudge back, you&apos;ll unlock chat!
              </AppText>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const getNextLabel = () => {
    if (currentStep === 15) return 'Get Started';
    return 'Next ▼';
  };

  const showCheckbox = [3, 4, 5, 6, 8].includes(currentStep);
  const getCheckboxLabel = () => {
    if (currentStep === 3) return 'Show on my profile';
    if (currentStep === 4) return 'Show on my profile';
    if (currentStep === 5) return 'Show on my profile';
    if (currentStep === 6) return 'Show on my profile';
    if (currentStep === 8) return 'Show on my profile';
    return '';
  };

  const getCheckboxValue = () => {
    if (currentStep === 3) return data.showGenderOnProfile;
    if (currentStep === 4) return data.showPronounsOnProfile;
    if (currentStep === 5) return data.showHometownOnProfile;
    if (currentStep === 6) return data.showCollegeOnProfile;
    if (currentStep === 8) return data.showSexualOrientationOnProfile;
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
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStep()}
      </ScrollView>

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
  majorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AppColors.backgroundDimmer,
    borderRadius: 8,
    padding: 12,
  },
  majorInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
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
  },
});
