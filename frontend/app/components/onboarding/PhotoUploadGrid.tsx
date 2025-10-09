import { Camera, X } from 'lucide-react-native';
import React from 'react';
import { Alert, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppColors } from '../AppColors';
import AppText from '../ui/AppText';
import IconButton from '../ui/IconButton';

interface PhotoUploadGridProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  minPhotos?: number;
  maxPhotos?: number;
}

export default function PhotoUploadGrid({
  photos,
  onPhotosChange,
  minPhotos = 3,
  maxPhotos = 5,
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

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhotos = [...photos, result.assets[0].uri];
      onPhotosChange(newPhotos);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {photos.map((photo, index) => (
          <View key={index} style={styles.photoContainer}>
            <Image source={{ uri: photo }} style={styles.photo} />
            {index === 0 && (
              <View style={styles.mainBadge}>
                <AppText variant="bodySmall" style={styles.mainBadgeText}>
                  Main
                </AppText>
              </View>
            )}
            <View style={styles.removeButtonContainer}>
              <IconButton
                icon={X}
                onPress={() => removePhoto(index)}
                variant="negative"
                size="small"
              />
            </View>
          </View>
        ))}

        {canAddMore && (
          <TouchableOpacity style={styles.addButton} onPress={pickImage}>
            <Camera size={32} color={AppColors.foregroundDimmer} />
            <AppText variant="bodySmall" style={styles.addButtonText}>
              {photos.length === 0 ? 'Add your first photo' : 'Add more'}
            </AppText>
          </TouchableOpacity>
        )}
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
    gap: 12,
  },
  photoContainer: {
    position: 'relative',
    width: '47%',
    aspectRatio: 0.75,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  mainBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: AppColors.accentDefault,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mainBadgeText: {
    color: AppColors.backgroundDefault,
    fontWeight: '600',
  },
  removeButtonContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  addButton: {
    width: '47%',
    aspectRatio: 0.75,
    borderRadius: 12,
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
