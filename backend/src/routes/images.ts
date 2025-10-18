import express from 'express';
import multer from 'multer';
import { bucket, db } from '../../firebaseAdmin';
import { v4 as uuidv4 } from 'uuid';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Configure multer to store files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
  fileFilter: (_req, file, cb) => {
    // Only accept image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

/**
 * Helper function to get user's netid from firebaseUid
 */
const getUserNetId = async (firebaseUid: string): Promise<string | null> => {
  try {
    const userSnapshot = await db
      .collection('users')
      .where('firebaseUid', '==', firebaseUid)
      .get();

    if (userSnapshot.empty) {
      return null;
    }

    return userSnapshot.docs[0].data().netid;
  } catch (error) {
    console.error('Error getting user netid:', error);
    return null;
  }
};

/**
 * POST /api/images/upload
 * Uploads one or more images to Firebase Storage for authenticated user
 * @route POST /api/images/upload
 * @group Images - Image upload and management operations
 * @security Bearer token required in Authorization header
 * @param {File[]} images.files.required - Image files to upload (max 6)
 * @returns {object} Array of uploaded image URLs
 * @returns {Error} 400 - No images provided
 * @returns {Error} 401 - Not authenticated
 * @returns {Error} 403 - Invalid token
 * @returns {Error} 413 - Too many files (max 6)
 * @returns {Error} 500 - Internal server error
 * @description Securely uploads images to user's own folder using Firebase Auth
 */
router.post(
  '/api/images/upload',
  authenticateUser,
  upload.array('images', 6),
  async (req: AuthenticatedRequest, res) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No images provided' });
      }

      if (files.length > 6) {
        return res.status(413).json({ error: 'Maximum 6 images allowed' });
      }

      const firebaseUid = req.user.uid;

      // Get user's netid
      const netid = await getUserNetId(firebaseUid);
      if (!netid) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      // Upload each image to Firebase Storage in user's own folder
      const uploadPromises = files.map(async (file) => {
        // Use netid for the folder structure
        const fileName = `profiles/${netid}/${uuidv4()}.${file.mimetype.split('/')[1]}`;
        const fileUpload = bucket.file(fileName);

        // Upload the file
        await fileUpload.save(file.buffer, {
          metadata: {
            contentType: file.mimetype,
            metadata: {
              uploadedBy: firebaseUid,
              uploadedAt: new Date().toISOString(),
            },
          },
          public: true,
        });

        // Make the file publicly accessible
        await fileUpload.makePublic();

        // Get the public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        return publicUrl;
      });

      const imageUrls = await Promise.all(uploadPromises);

      res.status(200).json({
        success: true,
        urls: imageUrls,
        count: imageUrls.length,
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: errorMessage });
    }
  }
);

/**
 * DELETE /api/images
 * Deletes an image from Firebase Storage (only if it belongs to the authenticated user)
 * @route DELETE /api/images
 * @group Images - Image upload and management operations
 * @security Bearer token required in Authorization header
 * @param {string} imageUrl.body.required - Full URL of the image to delete
 * @returns {object} Success message
 * @returns {Error} 400 - Missing imageUrl
 * @returns {Error} 401 - Not authenticated
 * @returns {Error} 403 - Unauthorized to delete this image (not owned by user)
 * @returns {Error} 404 - Image not found
 * @returns {Error} 500 - Internal server error
 */
router.delete('/api/images', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { imageUrl } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }

    const firebaseUid = req.user.uid;

    // Get user's netid
    const netid = await getUserNetId(firebaseUid);
    if (!netid) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Extract file path from URL
    const urlPattern = new RegExp(`https://storage\\.googleapis\\.com/${bucket.name}/(.+)`);
    const match = imageUrl.match(urlPattern);

    if (!match) {
      return res.status(400).json({ error: 'Invalid image URL format' });
    }

    const filePath = decodeURIComponent(match[1]);

    // Verify the file belongs to the authenticated user
    if (!filePath.startsWith(`profiles/${netid}/`)) {
      return res.status(403).json({
        error: 'Unauthorized: You can only delete your own images'
      });
    }

    const file = bucket.file(filePath);
    const [exists] = await file.exists();

    if (!exists) {
      return res.status(404).json({ error: 'Image not found' });
    }

    await file.delete();

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
