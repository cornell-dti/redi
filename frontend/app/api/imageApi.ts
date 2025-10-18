import { getCurrentUser } from './authService';
import { API_BASE_URL } from '../../constants/constants';

/**
 * Gets the Firebase ID token for the current authenticated user
 * @returns Firebase ID token
 * @throws Error if user is not authenticated
 */
const getAuthToken = async (): Promise<string> => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const token = await user.getIdToken();
  return token;
};

/**
 * Uploads images to Firebase Storage via backend API
 * @param imageUris - Array of local image URIs to upload
 * @returns Array of public image URLs from Firebase Storage
 * @throws Error if upload fails or user is not authenticated
 */
export const uploadImages = async (imageUris: string[]): Promise<string[]> => {
  try {
    if (imageUris.length === 0) {
      return [];
    }

    if (imageUris.length > 6) {
      throw new Error('Maximum 6 images allowed');
    }

    // Get authentication token
    const token = await getAuthToken();

    // Create FormData with images
    const formData = new FormData();

    for (const uri of imageUris) {
      // Convert local URI to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Determine file extension from URI or blob type
      const fileExtension = uri.split('.').pop() || 'jpg';
      const fileName = `image_${Date.now()}.${fileExtension}`;

      // Append to form data
      formData.append('images', {
        uri,
        type: blob.type || 'image/jpeg',
        name: fileName,
      } as any);
    }

    // Upload to backend
    const uploadResponse = await fetch(`${API_BASE_URL}/api/images/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(errorData.error || 'Failed to upload images');
    }

    const data = await uploadResponse.json();
    return data.urls;
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
};

/**
 * Deletes an image from Firebase Storage
 * @param imageUrl - Full URL of the image to delete
 * @throws Error if deletion fails or user is not authenticated
 */
export const deleteImage = async (imageUrl: string): Promise<void> => {
  try {
    // Get authentication token
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/api/images`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete image');
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};
