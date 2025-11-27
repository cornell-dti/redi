import AppInput from '@/app/components/ui/AppInput';
import AppText from '@/app/components/ui/AppText';
import { router } from 'expo-router';
import {
  Camera,
  Check,
  Gamepad2,
  Music,
  Plus,
  Trash2,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
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
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface DraggableTagProps {
  interest: string;
  index: number;
  isDragging: boolean;
  onRemove: () => void;
  onPress: () => void;
  onDragStart: () => void;
  onDragEnd: (toIndex: number) => void;
  onHoverChange: (toIndex: number | null) => void;
  totalInterests: number;
  onHaptic: () => void;
  allInterests: string[];
}

function DraggableTag({
  interest,
  index,
  isDragging,
  onRemove,
  onPress,
  onDragStart,
  onDragEnd,
  onHoverChange,
  totalInterests,
  onHaptic,
  allInterests,
}: DraggableTagProps) {
  useThemeAware();

  const { gesture, animatedStyle } = useDragAndDrop({
    type: 'tag',
    index,
    totalItems: totalInterests,
    onDragStart,
    onDragEnd,
    onHoverChange,
    onHaptic,
    isDragging,
    tagHorizontalThreshold: 60,
    tagVerticalThreshold: 40,
    tagsPerRow: 3,
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={animatedStyle}>
        <Pressable onPress={onPress}>
          <Tag
            label={interest}
            variant="gray"
            dismissible
            onDismiss={onRemove}
          />
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

export default function EditInterestsPage() {
  useThemeAware();
  const { showToast } = useToast();
  const haptic = useHapticFeedback();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [originalInterests, setOriginalInterests] = useState<string[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [newInterest, setNewInterest] = useState('');
  const [showUnsavedChangesSheet, setShowUnsavedChangesSheet] = useState(false);
  const [animationTrigger, setAnimationTrigger] = useState(0);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [editingInterest, setEditingInterest] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

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
        const interestsData = profileData.interests || [];
        setInterests(interestsData);
        setOriginalInterests(interestsData);
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
        interests,
      });

      setOriginalInterests(interests);

      showToast({
        icon: <Check size={20} color={AppColors.backgroundDefault} />,
        label: 'Interests updated',
      });

      router.back();
    } catch (error) {
      console.error('Failed to update interests:', error);
      Alert.alert('Error', 'Failed to update interests');
    } finally {
      setSaving(false);
    }
  };

  const hasUnsavedChanges = () => {
    return JSON.stringify(interests) !== JSON.stringify(originalInterests);
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

  const addInterest = () => {
    if (newInterest.trim()) {
      if (!interests.includes(newInterest.trim())) {
        setInterests([...interests, newInterest.trim()]);
        setNewInterest('');
        setSheetVisible(false);
      } else {
        Alert.alert('Duplicate', 'This interest already exists');
      }
    }
  };

  const removeInterest = (interestToRemove: string) => {
    setInterests(interests.filter((interest) => interest !== interestToRemove));
  };

  const reorderInterests = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex >= interests.length) return;

    const newInterests = [...interests];
    const [movedInterest] = newInterests.splice(fromIndex, 1);
    newInterests.splice(toIndex, 0, movedInterest);
    setInterests(newInterests);
  };

  const handleEditInterest = (interest: string) => {
    setEditingInterest(interest);
    setEditValue(interest);
  };

  const handleSaveEdit = () => {
    if (editValue.trim() && editingInterest) {
      if (
        !interests.includes(editValue.trim()) ||
        editValue.trim() === editingInterest
      ) {
        const updatedInterests = interests.map((interest) =>
          interest === editingInterest ? editValue.trim() : interest
        );
        setInterests(updatedInterests);
        setEditingInterest(null);
        setEditValue('');
      } else {
        Alert.alert('Duplicate', 'This interest already exists');
      }
    }
  };

  const handleRemoveFromEdit = () => {
    if (editingInterest) {
      removeInterest(editingInterest);
      setEditingInterest(null);
      setEditValue('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <EditingHeader
        title="Edit Interests"
        onSave={handleSave}
        onBack={handleBack}
        isSaving={saving}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          interests.length === 0 ? styles.emptyContainer : undefined
        }
      >
        {interests.length === 0 ? (
          <EmptyState
            icons={[Music, Camera, Gamepad2]}
            label="No interests yet - tap below to add some!"
            triggerAnimation={animationTrigger}
          />
        ) : (
          <View style={styles.tagsContainer}>
            {interests.map((interest, index) => {
              const isDragging = draggingIndex === index;
              const shouldShowGhost =
                hoverIndex === index &&
                draggingIndex !== null &&
                draggingIndex !== hoverIndex;

              return (
                <View key={interest} style={styles.tagWrapper}>
                  {shouldShowGhost && draggingIndex !== null && (
                    <View
                      style={[
                        styles.ghostPlaceholder,
                        {
                          backgroundColor: AppColors.backgroundDimmer,
                          borderColor: AppColors.accentDefault,
                        },
                      ]}
                    >
                      <AppText
                        variant="bodySmall"
                        style={{
                          opacity: 0.3,
                          color: AppColors.foregroundDefault,
                        }}
                      >
                        {interests[draggingIndex]}
                      </AppText>
                    </View>
                  )}
                  <DraggableTag
                    interest={interest}
                    index={index}
                    isDragging={isDragging}
                    onRemove={() => removeInterest(interest)}
                    onPress={() => handleEditInterest(interest)}
                    onDragStart={() => setDraggingIndex(index)}
                    onDragEnd={(toIndex) => {
                      reorderInterests(index, toIndex);
                      setDraggingIndex(null);
                      setHoverIndex(null);
                    }}
                    onHoverChange={setHoverIndex}
                    totalInterests={interests.length}
                    onHaptic={() => haptic.medium()}
                    allInterests={interests}
                  />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          title="Add interest"
          iconLeft={Plus}
          onPress={() => {
            setSheetVisible(true);
            setAnimationTrigger((prev) => prev + 1);
          }}
          variant="secondary"
        />
      </View>

      {/* Add Interest Sheet */}
      <Sheet
        visible={sheetVisible}
        onDismiss={() => {
          setSheetVisible(false);
          setNewInterest('');
        }}
        title="Add interest"
        bottomRound={false}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetContent}
        >
          <AppInput
            placeholder="e.g., Music, Photography, Gaming"
            value={newInterest}
            onChangeText={setNewInterest}
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus={true}
            returnKeyType="done"
            onSubmitEditing={addInterest}
          />
          <Button
            title="Add"
            onPress={addInterest}
            variant="primary"
            iconLeft={Plus}
            disabled={!newInterest.trim()}
          />
        </KeyboardAvoidingView>
      </Sheet>

      {/* Edit Interest Sheet */}
      <Sheet
        visible={editingInterest !== null}
        onDismiss={() => {
          setEditingInterest(null);
          setEditValue('');
        }}
        title="Edit interest"
        bottomRound={false}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetContent}
        >
          <AppInput
            placeholder="e.g., Music, Photography, Gaming"
            value={editValue}
            onChangeText={setEditValue}
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus={true}
            returnKeyType="done"
            onSubmitEditing={handleSaveEdit}
          />
          <Button
            title="Save"
            onPress={handleSaveEdit}
            variant="primary"
            iconLeft={Check}
            disabled={!editValue.trim()}
          />
          <Button
            title="Remove"
            onPress={handleRemoveFromEdit}
            variant="negative"
            iconLeft={Trash2}
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
  tagWrapper: {
    position: 'relative',
  },
  ghostPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
