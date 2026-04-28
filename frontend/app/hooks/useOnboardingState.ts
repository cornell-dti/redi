import { INITIAL_ONBOARDING_DATA, OnboardingData } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'onboarding_progress';

export function useOnboardingState() {
  const [data, setData] = useState<OnboardingData>(INITIAL_ONBOARDING_DATA);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from AsyncStorage on mount - ensures progress is restored when users partially fill form and close app
  useEffect(() => {
    loadFromStorage();
  }, []);

  // Save to AsyncStorage whenever data changes
  useEffect(() => {
    if (isLoaded) {
      saveToStorage();
    }
  }, [data, isLoaded]);

  const loadFromStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setData(parsed);
      }
    } catch (error) {
      console.error('Error loading onboarding progress:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveToStorage = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving onboarding progress:', error);
    }
  };

  const clearStorage = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.setItem('onboarding_complete', 'true');
    } catch (error) {
      console.error('Error clearing onboarding progress:', error);
    }
  };

  const updateField = <K extends keyof OnboardingData>(
    field: K,
    value: OnboardingData[K]
  ) => {
    // Remove spaces from social media fields
    const socialMediaFields = [
      'linkedIn',
      'instagram',
      'snapchat',
      'github',
      'website',
    ];
    if (
      socialMediaFields.includes(field as string) &&
      typeof value === 'string'
    ) {
      value = value.replace(/\s/g, '') as OnboardingData[K];
    }

    setData((prev) => ({ ...prev, [field]: value }));
  };

  type ArrayField =
    | 'ethnicity'
    | 'sexualOrientation'
    | 'interestedIn'
    | 'major'
    | 'genders'
    | 'pronouns';

  const toggleArrayItem = <K extends ArrayField>(field: K, item: string) => {
    setData((prev) => {
      const currentValue = prev[field];

      // Initialize as empty array if undefined (for optional fields like ethnicity)
      const arrayValue = Array.isArray(currentValue) ? currentValue : [];

      // Only allow toggling for fields that are string arrays
      if (!arrayValue.every((v) => typeof v === 'string')) {
        return prev;
      }

      const newValue = arrayValue.includes(item)
        ? arrayValue.filter((i) => i !== item)
        : [...arrayValue, item];

      return { ...prev, [field]: newValue };
    });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 2:
        // Basic info: firstName and valid birthdate
        if (!data.firstName || !data.birthdate) return false;
        // Validate MM/DD/YYYY or MM/DD/YY format
        const dateRegex = /^\d{2}\/\d{2}\/(\d{4}|\d{2})$/;
        if (!dateRegex.test(data.birthdate)) return false;
        // Validate it's a valid date
        const [month, day, yearStr] = data.birthdate.split('/');
        let year = parseInt(yearStr, 10);
        // Convert 2-digit year to 4-digit (00-29 -> 2000-2029, 30-99 -> 1930-1999)
        if (yearStr.length === 2) {
          year = year < 30 ? 2000 + year : 1900 + year;
        }
        const date = new Date(year, parseInt(month, 10) - 1, parseInt(day, 10));
        const isValidDate =
          date.getMonth() === parseInt(month, 10) - 1 &&
          date.getDate() === parseInt(day, 10) &&
          date.getFullYear() === year;
        if (!isValidDate) return false;

        // Check if user is at least 18 years old
        const today = new Date();
        const age = today.getFullYear() - date.getFullYear();
        const monthDiff = today.getMonth() - date.getMonth();
        const dayDiff = today.getDate() - date.getDate();
        // Adjust age if birthday hasn't occurred yet this year
        const actualAge =
          monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
        return actualAge >= 18;

      case 3:
        // Gender: At least one selected
        return data.genders.length > 0;

      case 4:
        // Pronouns: At least one selected
        return data.pronouns.length > 0;

      case 5:
        // Hometown: Optional, always valid
        return true;

      case 6:
        // College info: School and at least one major
        return data.school !== '' && data.major.length > 0;

      case 7:
        // Year: Must be selected
        return data.year !== null;

      case 8:
        // Sexual orientation: At least one selected
        return data.sexualOrientation.length > 0;

      case 9:
        // Interested in: At least one selected
        return data.interestedIn.length > 0;

      case 10:
        // Photos: optional for now
        return true;

      case 11:
        // Welcome screen: always valid
        return true;

      default:
        return true;
    }
  };

  return {
    data,
    updateField,
    toggleArrayItem,
    validateStep,
    clearStorage,
    isLoaded,
  };
}
