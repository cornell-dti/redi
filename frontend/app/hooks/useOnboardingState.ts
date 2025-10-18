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
        // Validate MM/DD/YYYY format
        const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!dateRegex.test(data.birthdate)) return false;
        // Validate it's a valid date
        const [month, day, year] = data.birthdate.split('/').map(Number);
        const date = new Date(year, month - 1, day);
        return (
          date.getMonth() === month - 1 &&
          date.getDate() === day &&
          date.getFullYear() === year
        );

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
        // Ethnicity: select at least one
        return Array.isArray(data.ethnicity) && data.ethnicity.length > 0;

      case 10:
        // Interested in: At least one selected
        return data.interestedIn.length > 0;

      case 11:
        // Photos: 3-5 photos required
        return data.pictures.length >= 3 && data.pictures.length <= 5;

      case 12:
        // Prompts: 1-3 prompts required, each with answer
        const validPrompts = data.prompts.filter(
          (p) => p.question && p.answer.trim() !== ''
        );
        return validPrompts.length >= 1 && validPrompts.length <= 3;

      case 13:
        // Clubs: Optional, always valid
        return true;

      case 14:
        // Social Links: Optional, always valid
        // Could add URL validation here if needed
        return true;

      case 15:
        // Interests: Optional, always valid
        return true;

      case 16:
        // Final welcome screen: Always valid
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
