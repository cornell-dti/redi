import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '../components/AppColors';
import AppButton from '../components/Button';
import CustomTextInput from '../components/ui/CustomTextInput';

// Mock data for dropdowns
const schools = [
  'College of Arts and Sciences',
  'College of Agriculture and Life Sciences',
  'College of Engineering',
  'School of Hotel Administration',
  'College of Human Ecology',
  'School of Industrial and Labor Relations',
  'College of Architecture, Art, and Planning',
  'Dyson School of Applied Economics',
  'Graduate School',
];

const graduationYears = [2025, 2026, 2027, 2028];

interface ProfileFormData {
  photos: string[];
  bio: string;
  school: string;
  graduationYear: number | null;
  major: string;
  instagram: string;
  snapchat: string;
  interests: string[];
}

const availableInterests = [
  'Hiking',
  'Photography',
  'Music',
  'Travel',
  'Board Games',
  'Cooking',
  'Art',
  'Sports',
  'Reading',
  'Dancing',
  'Yoga',
  'Coffee',
  'Movies',
  'Gaming',
  'Fitness',
];

export default function CreateProfileScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProfileFormData>({
    photos: [],
    bio: '',
    school: '',
    graduationYear: null,
    major: '',
    instagram: '',
    snapchat: '',
    interests: [],
  });

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.bio || !formData.school || !formData.graduationYear) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    try {
      // TODO: Submit to backend API
      console.log('Profile data:', formData);
      Alert.alert('Success!', 'Your profile has been created!', [
        {
          text: 'Continue',
          onPress: () => router.replace('/(auth)/(tabs)' as any),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create profile. Please try again.');
    }
  };

  const addPhoto = () => {
    // TODO: Implement image picker
    const mockPhoto =
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400';
    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, mockPhoto],
    }));
  };

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <View
          key={index}
          style={[styles.stepDot, index + 1 <= currentStep && styles.activeDot]}
        />
      ))}
    </View>
  );

  const renderPhotosStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Add Your Photos</Text>
      <Text style={styles.stepSubtitle}>
        Show your personality with great photos
      </Text>

      <View style={styles.photosGrid}>
        {formData.photos.map((photo, index) => (
          <View key={index} style={styles.photoContainer}>
            <Image source={{ uri: photo }} style={styles.photo} />
            {index === 0 && (
              <View style={styles.mainPhotoBadge}>
                <Text style={styles.mainPhotoText}>Main</Text>
              </View>
            )}
          </View>
        ))}
        {formData.photos.length < 6 && (
          <TouchableOpacity style={styles.addPhotoButton} onPress={addPhoto}>
            <MaterialIcons
              name="add-a-photo"
              size={40}
              color={AppColors.foregroundDimmer}
            />
            <Text style={styles.addPhotoText}>
              {formData.photos.length === 0
                ? 'Add your first photo'
                : 'Add more'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderBioStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Tell us about yourself</Text>
      <Text style={styles.stepSubtitle}>
        Write a bio that shows your personality
      </Text>

      <CustomTextInput
        placeholder="I love exploring Ithaca's gorges, trying new restaurants on the Commons, and weekend hiking trips..."
        value={formData.bio}
        onChangeText={(text) => setFormData((prev) => ({ ...prev, bio: text }))}
        multiline
        numberOfLines={4}
        maxLength={500}
        style={styles.bioInput}
      />
      <Text style={styles.charCounter}>{formData.bio.length}/500</Text>
    </View>
  );

  const renderBasicInfoStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepSubtitle}>Let people know the basics</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>School *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.schoolButtons}>
            {schools.map((school) => (
              <TouchableOpacity
                key={school}
                style={[
                  styles.schoolButton,
                  formData.school === school && styles.selectedSchoolButton,
                ]}
                onPress={() => setFormData((prev) => ({ ...prev, school }))}
              >
                <Text
                  style={[
                    styles.schoolButtonText,
                    formData.school === school &&
                      styles.selectedSchoolButtonText,
                  ]}
                >
                  {school}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Graduation Year *</Text>
        <View style={styles.yearButtons}>
          {graduationYears.map((year) => (
            <TouchableOpacity
              key={year}
              style={[
                styles.yearButton,
                formData.graduationYear === year && styles.selectedYearButton,
              ]}
              onPress={() =>
                setFormData((prev) => ({ ...prev, graduationYear: year }))
              }
            >
              <Text
                style={[
                  styles.yearButtonText,
                  formData.graduationYear === year &&
                    styles.selectedYearButtonText,
                ]}
              >
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <CustomTextInput
          label="Major"
          placeholder="Computer Science"
          value={formData.major}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, major: text }))
          }
        />
      </View>
    </View>
  );

  const renderInterestsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Your Interests</Text>
      <Text style={styles.stepSubtitle}>
        Select what you are passionate about
      </Text>

      <View style={styles.interestsGrid}>
        {availableInterests.map((interest) => (
          <TouchableOpacity
            key={interest}
            style={[
              styles.interestButton,
              formData.interests.includes(interest) &&
                styles.selectedInterestButton,
            ]}
            onPress={() => toggleInterest(interest)}
          >
            <Text
              style={[
                styles.interestButtonText,
                formData.interests.includes(interest) &&
                  styles.selectedInterestButtonText,
              ]}
            >
              {interest}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Social Media (Optional)</Text>
        <CustomTextInput
          placeholder="Instagram username"
          value={formData.instagram}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, instagram: text }))
          }
          autoCapitalize="none"
        />
        <CustomTextInput
          placeholder="Snapchat username"
          value={formData.snapchat}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, snapchat: text }))
          }
          autoCapitalize="none"
        />
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderPhotosStep();
      case 2:
        return renderBioStep();
      case 3:
        return renderBasicInfoStep();
      case 4:
        return renderInterestsStep();
      default:
        return renderPhotosStep();
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Photos';
      case 2:
        return 'About You';
      case 3:
        return 'Basic Info';
      case 4:
        return 'Interests';
      default:
        return 'Setup';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} disabled={currentStep === 1}>
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={
              currentStep === 1
                ? AppColors.backgroundDimmer
                : AppColors.foregroundDefault
            }
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getStepTitle()}</Text>
        <Text style={styles.stepCounter}>
          {currentStep}/{totalSteps}
        </Text>
      </View>

      {renderStepIndicator()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <AppButton
          title={currentStep === totalSteps ? 'Complete Profile' : 'Next'}
          onPress={handleNext}
          variant="primary"
          size="large"
          fullWidth
          icon={currentStep === totalSteps ? 'check' : 'arrow-forward'}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDimmer,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: AppColors.backgroundDefault,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.foregroundDefault,
  },
  stepCounter: {
    fontSize: 14,
    color: AppColors.foregroundDimmer,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: AppColors.backgroundDefault,
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.backgroundDimmer,
  },
  activeDot: {
    backgroundColor: AppColors.accentDefault,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: AppColors.foregroundDefault,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: AppColors.foregroundDimmer,
    marginBottom: 32,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoContainer: {
    position: 'relative',
    width: '47%',
    aspectRatio: 0.75,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  mainPhotoBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: AppColors.accentDefault,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mainPhotoText: {
    color: AppColors.backgroundDefault,
    fontSize: 10,
    fontWeight: '600',
  },
  addPhotoButton: {
    width: '47%',
    aspectRatio: 0.75,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: AppColors.backgroundDimmer,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.backgroundDefault,
  },
  addPhotoText: {
    fontSize: 12,
    color: AppColors.foregroundDimmer,
    marginTop: 8,
    textAlign: 'center',
  },
  bioInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  charCounter: {
    fontSize: 12,
    color: AppColors.foregroundDimmer,
    textAlign: 'right',
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.foregroundDefault,
    marginBottom: 12,
  },
  schoolButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  schoolButton: {
    backgroundColor: AppColors.backgroundDefault,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: AppColors.backgroundDimmer,
  },
  selectedSchoolButton: {
    backgroundColor: AppColors.accentDefault,
    borderColor: AppColors.accentDefault,
  },
  schoolButtonText: {
    fontSize: 14,
    color: AppColors.foregroundDimmer,
    fontWeight: '500',
  },
  selectedSchoolButtonText: {
    color: AppColors.backgroundDefault,
  },
  yearButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  yearButton: {
    backgroundColor: AppColors.backgroundDefault,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: AppColors.backgroundDimmer,
    flex: 1,
    alignItems: 'center',
  },
  selectedYearButton: {
    backgroundColor: AppColors.accentDefault,
    borderColor: AppColors.accentDefault,
  },
  yearButtonText: {
    fontSize: 16,
    color: AppColors.foregroundDimmer,
    fontWeight: '500',
  },
  selectedYearButtonText: {
    color: AppColors.backgroundDefault,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 32,
  },
  interestButton: {
    backgroundColor: AppColors.backgroundDefault,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: AppColors.backgroundDimmer,
  },
  selectedInterestButton: {
    backgroundColor: AppColors.accentDefault,
    borderColor: AppColors.accentDefault,
  },
  interestButtonText: {
    fontSize: 14,
    color: AppColors.foregroundDimmer,
    fontWeight: '500',
  },
  selectedInterestButtonText: {
    color: AppColors.backgroundDefault,
  },
  bottomNavigation: {
    padding: 20,
    backgroundColor: AppColors.backgroundDefault,
  },
});
