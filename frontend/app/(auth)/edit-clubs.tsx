import AppInput from '@/app/components/ui/AppInput';
import { router } from 'expo-router';
import {
  Check,
  Drama,
  MessagesSquare,
  Plus,
  Trophy,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { getCurrentUser } from '../api/authService';
import { getCurrentUserProfile, updateProfile } from '../api/profileApi';
import { AppColors } from '../components/AppColors';
import Button from '../components/ui/Button';
import EditingHeader from '../components/ui/EditingHeader';
import EmptyState from '../components/ui/EmptyState';
import Sheet from '../components/ui/Sheet';
import Tag from '../components/ui/Tag';
import UnsavedChangesSheet from '../components/ui/UnsavedChangesSheet';
import { useThemeAware } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface DraggableTagProps {
  club: string;
  index: number;
  isDragging: boolean;
  onRemove: () => void;
  onDragStart: () => void;
  onDragEnd: (toIndex: number) => void;
  onHoverChange: (toIndex: number | null) => void;
  totalClubs: number;
  onHaptic: () => void;
  allClubs: string[];
}

function DraggableTag({
  club,
  index,
  isDragging,
  onRemove,
  onDragStart,
  onDragEnd,
  onHoverChange,
  totalClubs,
  onHaptic,
  allClubs,
}: DraggableTagProps) {
  useThemeAware();

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);
  const lastTargetIndex = useSharedValue(index);

  const gesture = Gesture.Pan()
    .onStart(() => {
      runOnJS(onDragStart)();
      scale.value = withSpring(1.1);
      zIndex.value = 1000;
      lastTargetIndex.value = index;
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;

      // Find the target index based on position
      const horizontalMove = Math.round(event.translationX / 100); // ~100px per tag
      const verticalMove = Math.round(event.translationY / 50); // ~50px per row

      const estimatedOffset = horizontalMove + verticalMove * 3; // Assume ~3 tags per row
      const targetIndex = Math.max(
        0,
        Math.min(index + estimatedOffset, totalClubs - 1)
      );

      // Trigger haptic feedback when crossing to a new position
      if (targetIndex !== lastTargetIndex.value) {
        runOnJS(onHaptic)();
        lastTargetIndex.value = targetIndex;
      }

      runOnJS(onHoverChange)(targetIndex);
    })
    .onEnd((event) => {
      // Calculate final drop position
      const horizontalMove = Math.round(event.translationX / 100);
      const verticalMove = Math.round(event.translationY / 50);
      const estimatedOffset = horizontalMove + verticalMove * 3;
      const toIndex = Math.max(
        0,
        Math.min(index + estimatedOffset, totalClubs - 1)
      );

      runOnJS(onDragEnd)(toIndex);
      runOnJS(onHoverChange)(null);

      // Reset position and scale
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      scale.value = withSpring(1, { damping: 20, stiffness: 150 });
      zIndex.value = 0;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
    opacity: isDragging ? 0.8 : 1,
    shadowColor: isDragging ? '#000' : 'transparent',
    shadowOffset: {
      width: 0,
      height: isDragging ? 4 : 0,
    },
    shadowOpacity: isDragging ? 0.3 : 0,
    shadowRadius: isDragging ? 4.65 : 0,
    elevation: isDragging ? 8 : 0,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={animatedStyle}>
        <Tag label={club} variant="gray" dismissible onDismiss={onRemove} />
      </Animated.View>
    </GestureDetector>
  );
}

export default function EditClubsPage() {
  useThemeAware();
  const { showToast } = useToast();
  const haptic = useHapticFeedback();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clubs, setClubs] = useState<string[]>([]);
  const [originalClubs, setOriginalClubs] = useState<string[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [newClub, setNewClub] = useState('');
  const [showUnsavedChangesSheet, setShowUnsavedChangesSheet] = useState(false);
  const [animationTrigger, setAnimationTrigger] = useState(0);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

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
        const clubsData = profileData.clubs || [];
        setClubs(clubsData);
        setOriginalClubs(clubsData);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const user = getCurrentUser();
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        clubs,
      });

      setOriginalClubs(clubs);

      showToast({
        icon: <Check size={20} color={AppColors.backgroundDefault} />,
        label: 'Clubs updated',
      });

      router.back();
    } catch (error) {
      console.error('Failed to update clubs:', error);
      Alert.alert('Error', 'Failed to update clubs');
    } finally {
      setSaving(false);
    }
  };

  const hasUnsavedChanges = () => {
    return JSON.stringify(clubs) !== JSON.stringify(originalClubs);
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
  };

  const handleDiscardChanges = () => {
    setShowUnsavedChangesSheet(false);
    router.back();
  };

  const addClub = () => {
    if (newClub.trim()) {
      if (!clubs.includes(newClub.trim())) {
        setClubs([...clubs, newClub.trim()]);
        setNewClub('');
        setSheetVisible(false);
      } else {
        Alert.alert('Duplicate', 'This club already exists');
      }
    }
  };

  const removeClub = (clubToRemove: string) => {
    setClubs(clubs.filter((club) => club !== clubToRemove));
  };

  const reorderClubs = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex >= clubs.length) return;

    const newClubs = [...clubs];
    const [movedClub] = newClubs.splice(fromIndex, 1);
    newClubs.splice(toIndex, 0, movedClub);
    setClubs(newClubs);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <EditingHeader
        title="Edit Clubs"
        onSave={handleSave}
        onBack={handleBack}
        isSaving={saving}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          clubs.length === 0 ? styles.emptyContainer : undefined
        }
      >
        {clubs.length === 0 ? (
          <EmptyState
            icons={[MessagesSquare, Trophy, Drama]}
            label="No clubs yet - tap below to add some!"
            triggerAnimation={animationTrigger}
          />
        ) : (
          <View style={styles.tagsContainer}>
            {clubs.map((club, index) => {
              const isDragging = draggingIndex === index;

              return (
                <DraggableTag
                  key={club}
                  club={club}
                  index={index}
                  isDragging={isDragging}
                  onRemove={() => removeClub(club)}
                  onDragStart={() => setDraggingIndex(index)}
                  onDragEnd={(toIndex) => {
                    reorderClubs(index, toIndex);
                    setDraggingIndex(null);
                    setHoverIndex(null);
                  }}
                  onHoverChange={setHoverIndex}
                  totalClubs={clubs.length}
                  onHaptic={() => haptic.medium()}
                  allClubs={clubs}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          title="Add club"
          iconLeft={Plus}
          onPress={() => {
            setSheetVisible(true);
            setAnimationTrigger((prev) => prev + 1);
          }}
          variant="secondary"
        />
      </View>

      {/* Add Club Sheet */}
      <Sheet
        visible={sheetVisible}
        onDismiss={() => {
          setSheetVisible(false);
          setNewClub('');
        }}
        title="Add Club"
        bottomRound={false}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetContent}
        >
          <AppInput
            placeholder="e.g., Debate, Sports, Drama"
            value={newClub}
            onChangeText={setNewClub}
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus={true}
          />
          <Button
            title="Add"
            onPress={addClub}
            variant="primary"
            iconLeft={Plus}
            disabled={!newClub.trim()}
          />
        </KeyboardAvoidingView>
      </Sheet>

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
    backgroundColor: AppColors.backgroundDefault,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 16,
    backgroundColor: AppColors.backgroundDefault,
  },
  sheetContent: {
    gap: 16,
  },
});
