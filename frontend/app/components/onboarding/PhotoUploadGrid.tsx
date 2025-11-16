import * as ImagePicker from 'expo-image-picker';
import { Camera, Star, X } from 'lucide-react-native';
import React from 'react';
import { Alert, Dimensions, Image, StyleSheet, View } from 'react-native';
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
const GRID_GAP = 4;
const GRID_PADDING = 0; // Adjust if you want padding around the grid
const GRID_SLOT_SIZE =
  (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * 2) / 3 - 14;

export default function PhotoUploadGrid({
  photos,
  onPhotosChange,
  minPhotos = 3,
  maxPhotos = 6,
}: PhotoUploadGridProps) {
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
      const selectedUris = result.assets.map((asset) => asset.uri);

      const newPhotos = [...photos, ...selectedUris].slice(0, maxPhotos);
      onPhotosChange(newPhotos);

      if (selectedUris.length > remainingSlots) {
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
            return (
              <View key={slotIndex} style={styles.gridSlot}>
                <Image source={{ uri: slot.photo }} style={styles.photo} />

                {slot.index === 0 && (
                  <View style={styles.mainBadgeContainer}>
                    <Tag label="Main" variant="accent" style={{ width: 70 }} />
                  </View>
                )}

                {slot.index !== 0 && (
                  <View style={styles.setMainButtonContainer}>
                    <IconButton
                      icon={Star}
                      onPress={() => setAsMainPhoto(slot.index)}
                      variant="secondary"
                      size="small"
                    />
                  </View>
                )}

                <View style={styles.removeButtonContainer}>
                  <IconButton
                    icon={X}
                    onPress={() => removePhoto(slot.index)}
                    variant="negative"
                    size="small"
                  />
                </View>
              </View>
            );
          }

          if (slot.type === 'add') {
            return (
              <Pressable
                key={slotIndex}
                style={[styles.gridSlot, styles.addButton]}
                onPress={pickImage}
              >
                <Camera size={32} color={AppColors.foregroundDimmer} />
                <AppText variant="bodySmall" style={styles.addButtonText}>
                  {photos.length === 0 ? 'Add photo' : 'Add more'}
                </AppText>
              </Pressable>
            );
          }

          return <View key={slotIndex} style={styles.gridSlot} />;
        })}
      </View>

      <AppText variant="bodySmall" style={styles.helperText}>
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
    borderColor: AppColors.backgroundDimmest,
    backgroundColor: AppColors.backgroundDimmer,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addButtonText: {
    color: AppColors.foregroundDimmer,
    textAlign: 'center',
  },
  helperText: {
    color: AppColors.foregroundDimmer,
    textAlign: 'center',
  },
});
