import { useThemeAware } from '@/app/contexts/ThemeContext';
import { useDragAndDrop } from '@/app/hooks/useDragAndDrop';
import { useHapticFeedback } from '@/app/hooks/useHapticFeedback';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Star, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Dimensions, Image, StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { AppColors } from '../AppColors';
import AppText from '../ui/AppText';
import IconButton from '../ui/IconButton';
import Pressable from '../ui/Pressable';
import Tag from '../ui/Tag';

interface PhotoUploadGridProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  minPhotos?: number;
  maxPhotos?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Grid configuration
const NUM_COLUMNS = 3; // 3 columns for a 2x3 grid (6 items total)
const GRID_GAP = 4; // Gap between items
const HORIZONTAL_PADDING = 40; // Account for parent container padding (20 on each side)

// Calculate item width: (available width - gaps between items) / number of columns
// With 3 columns, there are 2 gaps between them
const GRID_SLOT_SIZE =
  (SCREEN_WIDTH - HORIZONTAL_PADDING - (NUM_COLUMNS - 1) * GRID_GAP) /
  NUM_COLUMNS;

interface DraggablePhotoProps {
  photo: string;
  index: number;
  isMain: boolean;
  isDragging: boolean;
  onRemove: () => void;
  onSetMain: () => void;
  onDragStart: () => void;
  onDragEnd: (toIndex: number) => void;
  onHoverChange: (toIndex: number | null) => void;
  totalPhotos: number;
  onHaptic: () => void;
}

function DraggablePhoto({
  photo,
  index,
  isMain,
  isDragging,
  onRemove,
  onSetMain,
  onDragStart,
  onDragEnd,
  onHoverChange,
  totalPhotos,
  onHaptic,
}: DraggablePhotoProps) {
  useThemeAware(); // Force re-render when theme changes

  const { gesture, animatedStyle } = useDragAndDrop({
    type: 'grid',
    index,
    totalItems: totalPhotos,
    onDragStart,
    onDragEnd,
    onHoverChange,
    onHaptic,
    isDragging,
    gridSlotSize: GRID_SLOT_SIZE,
    gridGap: GRID_GAP,
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={animatedStyle}>
        <View style={styles.gridSlot}>
          <Image source={{ uri: photo }} style={styles.photo} />

          {isMain && (
            <View style={styles.mainBadgeContainer}>
              <Tag label="Main" variant="accent" />
            </View>
          )}

          {!isMain && (
            <View style={styles.setMainButtonContainer}>
              <IconButton
                icon={Star}
                onPress={onSetMain}
                variant="secondary"
                size="small"
              />
            </View>
          )}

          <View style={styles.removeButtonContainer}>
            <IconButton
              icon={X}
              onPress={onRemove}
              variant="negative"
              size="small"
            />
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

export default function PhotoUploadGrid({
  photos,
  onPhotosChange,
  minPhotos = 3,
  maxPhotos = 6,
}: PhotoUploadGridProps) {
  useThemeAware(); // Force re-render when theme changes
  const haptic = useHapticFeedback();

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const reorderPhotos = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex >= photos.length) return;

    const newPhotos = [...photos];
    const [movedPhoto] = newPhotos.splice(fromIndex, 1);
    newPhotos.splice(toIndex, 0, movedPhoto);
    onPhotosChange(newPhotos);
  };

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to upload photos.'
      );
      return false;
    }
    return true;
  };

  const compressImageIfNeeded = async (
    uri: string,
    fileSize?: number
  ): Promise<string> => {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB in bytes

    if (!fileSize || fileSize <= MAX_FILE_SIZE) {
      return uri;
    }

    let quality = 0.7;
    let compressedUri = uri;

    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        // I think this method call is deprecated, but I cannot find the updated API for it.
        const result = await ImageManipulator.manipulateAsync(
          compressedUri,
          [],
          {
            compress: quality,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

        const response = await fetch(result.uri);
        const blob = await response.blob();

        if (blob.size <= MAX_FILE_SIZE) {
          return result.uri;
        }

        compressedUri = result.uri;
        quality -= 0.2;
      }

      return compressedUri;
    } catch (error) {
      console.error('Error compressing image:', error);

      // Return original if compression fails (possibly change here?)
      return uri;
    }
  };

  const pickImage = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    // Calculate how many more photos can be added
    const remainingSlots = maxPhotos - photos.length;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: remainingSlots,
    });

    if (!result.canceled && result.assets.length > 0) {
      // Compress images if needed
      const processedUris = await Promise.all(
        result.assets.map(async (asset) => {
          return await compressImageIfNeeded(asset.uri, asset.fileSize);
        })
      );

      const newPhotos = [...photos, ...processedUris].slice(0, maxPhotos);
      onPhotosChange(newPhotos);

      if (processedUris.length > remainingSlots) {
        Alert.alert(
          'Too Many Photos',
          `You can only add ${remainingSlots} more photo${remainingSlots === 1 ? '' : 's'}.`
        );
      }
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const setAsMainPhoto = (index: number) => {
    if (index === 0) return; // Already main photo

    // Move the selected photo to the front of the array
    const newPhotos = [...photos];
    const [selectedPhoto] = newPhotos.splice(index, 1);
    newPhotos.unshift(selectedPhoto);
    onPhotosChange(newPhotos);
  };

  // Create 6 slots (2x3 grid)
  const GRID_SLOTS = 6;

  // Create slots for rendering
  const slots = Array.from({ length: GRID_SLOTS }, (_, index) => {
    if (index < photos.length) {
      return { type: 'photo' as const, photo: photos[index], index };
    } else if (photos.length < maxPhotos) {
      return { type: 'add' as const };
    }
    return { type: 'empty' as const };
  });

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {slots.map((slot, slotIndex) => {
          if (slot.type === 'photo') {
            const isDragging = draggingIndex === slot.index;

            // Show ghost placeholder at hover position
            const shouldShowGhost =
              hoverIndex === slotIndex &&
              draggingIndex !== null &&
              draggingIndex !== hoverIndex;

            return (
              <View key={slotIndex} style={styles.gridSlotWrapper}>
                {shouldShowGhost && (
                  <View
                    style={[
                      styles.gridSlot,
                      styles.ghostPlaceholder,
                      {
                        backgroundColor: AppColors.backgroundDimmer,
                        borderColor: AppColors.accentDefault,
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: photos[draggingIndex] }}
                      style={[styles.photo, styles.ghostImage]}
                    />
                  </View>
                )}
                <DraggablePhoto
                  photo={slot.photo}
                  index={slot.index}
                  isMain={slot.index === 0}
                  isDragging={isDragging}
                  onRemove={() => removePhoto(slot.index)}
                  onSetMain={() => setAsMainPhoto(slot.index)}
                  onDragStart={() => setDraggingIndex(slot.index)}
                  onDragEnd={(toIndex) => {
                    reorderPhotos(slot.index, toIndex);
                    setDraggingIndex(null);
                    setHoverIndex(null);
                  }}
                  onHoverChange={setHoverIndex}
                  totalPhotos={photos.length}
                  onHaptic={() => haptic.medium()}
                />
              </View>
            );
          }

          if (slot.type === 'add') {
            return (
              <Pressable
                key={slotIndex}
                style={[
                  styles.gridSlot,
                  styles.addButton,
                  {
                    borderColor: AppColors.backgroundDimmest,
                    backgroundColor: AppColors.backgroundDimmer,
                  },
                ]}
                onPress={pickImage}
              >
                <Camera size={32} color={AppColors.foregroundDimmer} />
                <AppText
                  variant="bodySmall"
                  style={[
                    styles.addButtonText,
                    { color: AppColors.foregroundDimmer },
                  ]}
                >
                  {photos.length === 0 ? 'Add photo' : 'Add more'}
                </AppText>
              </Pressable>
            );
          }

          return <View key={slotIndex} style={styles.gridSlot} />;
        })}
      </View>

      <AppText
        variant="bodySmall"
        style={[styles.helperText, { color: AppColors.foregroundDimmer }]}
      >
        {photos.length < minPhotos
          ? `Add at least ${minPhotos - photos.length} more photo${minPhotos - photos.length > 1 ? 's' : ''}`
          : `${photos.length}/${maxPhotos} photos added`}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    borderRadius: 24,
    overflow: 'hidden',
  },
  gridSlotWrapper: {
    position: 'relative',
    width: GRID_SLOT_SIZE,
    height: GRID_SLOT_SIZE,
  },
  gridSlot: {
    width: GRID_SLOT_SIZE,
    height: GRID_SLOT_SIZE,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  ghostPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  ghostImage: {
    opacity: 0.3,
  },
  mainBadgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  setMainButtonContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
  },
  removeButtonContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  addButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addButtonText: {
    textAlign: 'center',
  },
  helperText: {
    textAlign: 'center',
  },
});
