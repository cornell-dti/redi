import AppInput from '@/app/components/ui/AppInput';
import AppText from '@/app/components/ui/AppText';
import { router } from 'expo-router';
import {
  Check,
  Drama,
  MessagesSquare,
  Plus,
  Trash2,
  Trophy,
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
  club: string;
  index: number;
  isDragging: boolean;
  onRemove: () => void;
  onPress: () => void;
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
  onPress,
  onDragStart,
  onDragEnd,
  onHoverChange,
  totalClubs,
  onHaptic,
  allClubs,
}: DraggableTagProps) {
  useThemeAware();

  const { gesture, animatedStyle } = useDragAndDrop({
    type: 'tag',
    index,
    totalItems: totalClubs,
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
          <Tag label={club} variant="gray" dismissible onDismiss={onRemove} />
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

export default function EditClubsPage() {
  useThemeAware();
  const { showToast } = useToast();
  const haptic = useHapticFeedback();
  const [saving, setSaving] = useState(false);
  const [clubs, setClubs] = useState<string[]>([]);
  const [originalClubs, setOriginalClubs] = useState<string[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [newClub, setNewClub] = useState('');
  const [showUnsavedChangesSheet, setShowUnsavedChangesSheet] = useState(false);
  const [animationTrigger, setAnimationTrigger] = useState(0);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [editingClub, setEditingClub] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const user = getCurrentUser();
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      const profileData = await getCurrentUserProfile();

      if (profileData) {
        const clubsData = profileData.clubs || [];
        setClubs(clubsData);
        setOriginalClubs(clubsData);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      Alert.alert('Error', 'Failed to load profile');
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

  const handleEditClub = (club: string) => {
    setEditingClub(club);
    setEditValue(club);
  };

  const handleSaveEdit = () => {
    if (editValue.trim() && editingClub) {
      if (!clubs.includes(editValue.trim()) || editValue.trim() === editingClub) {
        const updatedClubs = clubs.map((club) =>
          club === editingClub ? editValue.trim() : club
        );
        setClubs(updatedClubs);
        setEditingClub(null);
        setEditValue('');
      } else {
        Alert.alert('Duplicate', 'This club already exists');
      }
    }
  };

  const handleRemoveFromEdit = () => {
    if (editingClub) {
      removeClub(editingClub);
      setEditingClub(null);
      setEditValue('');
    }
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
              const shouldShowGhost =
                hoverIndex === index &&
                draggingIndex !== null &&
                draggingIndex !== hoverIndex;

              return (
                <View key={club} style={styles.tagWrapper}>
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
                        style={{ opacity: 0.3, color: AppColors.foregroundDefault }}
                      >
                        {clubs[draggingIndex]}
                      </AppText>
                    </View>
                  )}
                  <DraggableTag
                    club={club}
                    index={index}
                    isDragging={isDragging}
                    onRemove={() => removeClub(club)}
                    onPress={() => handleEditClub(club)}
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
                </View>
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
            returnKeyType="done"
            onSubmitEditing={addClub}
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

      {/* Edit Club Sheet */}
      <Sheet
        visible={editingClub !== null}
        onDismiss={() => {
          setEditingClub(null);
          setEditValue('');
        }}
        title="Edit club"
        bottomRound={false}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetContent}
        >
          <AppInput
            placeholder="e.g., Debate, Sports, Drama"
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
