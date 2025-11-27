import AppText from '@/app/components/ui/AppText';
import { hasBirthdate } from '@/types';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser } from '../api/authService';
import { getCurrentUserProfile, updateProfile } from '../api/profileApi';
import { AppColors } from '../components/AppColors';
import EditingHeader from '../components/ui/EditingHeader';
import UnsavedChangesSheet from '../components/ui/UnsavedChangesSheet';
import { useThemeAware } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { calculateAge } from '../utils/profileUtils';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const ITEM_HEIGHT = 80;
const VISIBLE_ITEMS = 9;

export default function EditAgePage() {
  useThemeAware();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [birthdate, setBirthdate] = useState<Date>(new Date());
  const [originalBirthdate, setOriginalBirthdate] = useState<Date>(new Date());
  const [selectedAge, setSelectedAge] = useState<number>(18);
  const [showUnsavedChangesSheet, setShowUnsavedChangesSheet] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const lastHapticIndex = useRef<number>(-1);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Generate ages array from 18 to 99
  const ages = Array.from({ length: 82 }, (_, i) => i + 18);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    // Scroll to initial age position after loading
    if (!loading && scrollViewRef.current) {
      const index = ages.indexOf(selectedAge);
      if (index !== -1) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: index * ITEM_HEIGHT,
            animated: false,
          });
        }, 100);
      }
    }
  }, [loading]);

  const fetchProfile = async () => {
    const user = getCurrentUser();
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const profileData = await getCurrentUserProfile();

      if (profileData) {
        // getCurrentUserProfile should return OwnProfileResponse with birthdate
        if (hasBirthdate(profileData)) {
          const birthdateDate = new Date(profileData.birthdate);
          setBirthdate(birthdateDate);
          setOriginalBirthdate(birthdateDate);
          const currentAge = calculateAge(profileData.birthdate);
          setSelectedAge(Math.max(18, Math.min(99, currentAge)));
        } else {
          Alert.alert('Error', 'Birthdate not available');
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);

    // Trigger haptic feedback when crossing into a new item
    if (
      index !== lastHapticIndex.current &&
      index >= 0 &&
      index < ages.length &&
      offsetY >= 0
    ) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
        // Silently fail if haptics not available
      });
      lastHapticIndex.current = index;
    }
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(ages.length - 1, index));
    const newAge = ages[clampedIndex];

    setSelectedAge(newAge);

    // Calculate birthdate from age
    const today = new Date();
    const birthYear = today.getFullYear() - newAge;
    const newBirthdate = new Date(birthYear, today.getMonth(), today.getDate());
    setBirthdate(newBirthdate);

    // Snap to the nearest item
    scrollViewRef.current?.scrollTo({
      y: clampedIndex * ITEM_HEIGHT,
      animated: true,
    });
  };

  const handleSave = async () => {
    const user = getCurrentUser();
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    // Validate age (must be 18+)
    const calculatedAge = calculateAge(birthdate.toISOString());
    if (calculatedAge < 18) {
      Alert.alert('Invalid Age', 'You must be at least 18 years old');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        birthdate: birthdate.toISOString(),
      });

      setOriginalBirthdate(birthdate);

      // Show toast and navigate back
      showToast({
        icon: <Check size={20} color={AppColors.backgroundDefault} />,
        label: 'Age updated',
      });

      router.back();
    } catch (error) {
      console.error('Failed to update age:', error);
      Alert.alert('Error', 'Failed to update age');
    } finally {
      setSaving(false);
    }
  };

  const hasUnsavedChanges = () => {
    return birthdate.getTime() !== originalBirthdate.getTime();
  };

  const handleBack = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedChangesSheet(true);
    } else {
      router.back();
    }
  };

  const handleSaveAndExit = async () => {
    await handleSave();
    // handleSave already navigates back on success
  };

  const handleDiscardChanges = () => {
    setShowUnsavedChangesSheet(false);
    router.back();
  };

  const renderAgeItem = (age: number, index: number) => {
    const inputRange = [
      (index - 3) * ITEM_HEIGHT,
      (index - 2) * ITEM_HEIGHT,
      (index - 1) * ITEM_HEIGHT,
      index * ITEM_HEIGHT,
      (index + 1) * ITEM_HEIGHT,
      (index + 2) * ITEM_HEIGHT,
      (index + 3) * ITEM_HEIGHT,
    ];

    const opacity = scrollY.interpolate({
      inputRange,
      outputRange: [0.1, 0.25, 0.5, 1, 0.5, 0.25, 0.1],
      extrapolate: 'clamp',
    });

    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [0.6, 0.75, 0.88, 1, 0.88, 0.75, 0.6],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        key={age}
        style={[
          styles.ageItem,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <AppText style={styles.ageText}>{age}</AppText>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: AppColors.backgroundDefault },
        ]}
      >
        <StatusBar barStyle={'light-content'} />
        <EditingHeader
          title="Edit Age"
          onSave={handleSave}
          onBack={handleBack}
          isSaving={saving}
        />
        <View style={styles.loadingContainer}>
          <AppText>Loading...</AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: AppColors.backgroundDefault },
      ]}
    >
      <StatusBar barStyle={'light-content'} />

      <EditingHeader
        title="Edit Age"
        onSave={handleSave}
        onBack={handleBack}
        isSaving={saving}
      />

      <View style={styles.pickerContainer}>
        {/* Selection indicator in the middle */}
        <View style={styles.selectionIndicator} pointerEvents="none">
          <View
            style={[
              styles.selectionBox,
              {
                borderColor: 'rgba(0, 0, 0, 0.15)',
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
              },
            ]}
          />
        </View>

        {/* Scrollable age picker */}
        <Animated.ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            {
              useNativeDriver: true,
              listener: handleScroll,
            }
          )}
          onMomentumScrollEnd={handleScrollEnd}
          scrollEventThrottle={16}
        >
          {/* Top padding */}
          <View
            style={{ height: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2) }}
          />

          {/* Age items */}
          {ages.map((age, index) => renderAgeItem(age, index))}

          {/* Bottom padding */}
          <View
            style={{ height: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2) }}
          />
        </Animated.ScrollView>

        {/* Fade overlays at top and bottom - layered approach */}
        <View style={styles.fadeTop} pointerEvents="none">
          <View
            style={[
              styles.fadeLayer,
              { backgroundColor: AppColors.backgroundDefault, opacity: 1 },
            ]}
          />
          <View
            style={[
              styles.fadeLayer,
              { backgroundColor: AppColors.backgroundDefault, opacity: 0.95 },
            ]}
          />
          <View
            style={[
              styles.fadeLayer,
              { backgroundColor: AppColors.backgroundDefault, opacity: 0.85 },
            ]}
          />
          <View
            style={[
              styles.fadeLayer,
              { backgroundColor: AppColors.backgroundDefault, opacity: 0.7 },
            ]}
          />
          <View
            style={[
              styles.fadeLayer,
              { backgroundColor: AppColors.backgroundDefault, opacity: 0.5 },
            ]}
          />
          <View
            style={[
              styles.fadeLayer,
              { backgroundColor: AppColors.backgroundDefault, opacity: 0.3 },
            ]}
          />
          <View
            style={[
              styles.fadeLayer,
              { backgroundColor: AppColors.backgroundDefault, opacity: 0.15 },
            ]}
          />
        </View>
        <View style={styles.fadeBottom} pointerEvents="none">
          <View
            style={[
              styles.fadeLayer,
              { backgroundColor: AppColors.backgroundDefault, opacity: 0.15 },
            ]}
          />
          <View
            style={[
              styles.fadeLayer,
              { backgroundColor: AppColors.backgroundDefault, opacity: 0.3 },
            ]}
          />
          <View
            style={[
              styles.fadeLayer,
              { backgroundColor: AppColors.backgroundDefault, opacity: 0.5 },
            ]}
          />
          <View
            style={[
              styles.fadeLayer,
              { backgroundColor: AppColors.backgroundDefault, opacity: 0.7 },
            ]}
          />
          <View
            style={[
              styles.fadeLayer,
              { backgroundColor: AppColors.backgroundDefault, opacity: 0.85 },
            ]}
          />
          <View
            style={[
              styles.fadeLayer,
              { backgroundColor: AppColors.backgroundDefault, opacity: 0.95 },
            ]}
          />
          <View
            style={[
              styles.fadeLayer,
              { backgroundColor: AppColors.backgroundDefault, opacity: 1 },
            ]}
          />
        </View>
      </View>

      {/* Unsaved Changes Sheet */}
      <UnsavedChangesSheet
        visible={showUnsavedChangesSheet}
        onSave={handleSaveAndExit}
        onDiscard={handleDiscardChanges}
        onDismiss={() => setShowUnsavedChangesSheet(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  ageItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  ageText: {
    fontSize: 64,
    letterSpacing: -1,
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: ITEM_HEIGHT,
  },
  selectionIndicator: {
    position: 'absolute',
    top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  selectionBox: {
    width: '70%',
    height: ITEM_HEIGHT,
    borderWidth: 2.5,
    borderRadius: 16,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 3.5,
    pointerEvents: 'none',
    flexDirection: 'column',
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 3.5,
    pointerEvents: 'none',
    flexDirection: 'column',
  },
  fadeLayer: {
    flex: 1,
    width: '100%',
  },
});
