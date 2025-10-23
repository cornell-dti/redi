import express from 'express';
import admin from 'firebase-admin';
import { db } from '../../firebaseAdmin';
import { requireAdmin } from '../middleware/adminAuth';
import { adminRateLimit, publicRateLimit } from '../middleware/rateLimiting';
import { validateBulkEmailUpload, validate } from '../middleware/validation';

const router = express.Router();

// GET the number of users signed up on the wait list (public endpoint)
router.get('/api/registered-count', publicRateLimit, async (req, res) => {
  try {
    const doc = db.collection('stats').doc('global');
    const snapshot = await doc.get();

    if (!snapshot.exists) {
      // Create the stats document with initial count if it doesn't exist
      await doc.set({ userCount: 0 });
      return res.status(200).json({ userCount: 0 });
    }

    res.status(200).json(snapshot.data());
  } catch (error) {
    console.error('Error fetching user count:', error);
    res.status(500).json({ error: 'Failed to fetch user count' });
  }
});

// POST bulk upload emails (admin only, requires authentication)
router.post(
  '/api/landing-emails/bulk-upload',
  adminRateLimit,
  requireAdmin,
  validateBulkEmailUpload,
  validate,
  async (req, res) => {
    try {
      const { emails } = req.body;

      if (!Array.isArray(emails)) {
        return res.status(400).json({ error: 'emails must be an array' });
      }

      const batch = db.batch();
      let uploaded = 0;
      let skipped = 0;

      for (const user of emails) {
        if (!user.email) continue;

        // Check for duplicates
        const existingDoc = await db
          .collection('landing-emails')
          .where('email', '==', user.email.toLowerCase())
          .get();

        if (!existingDoc.empty) {
          skipped++;
          continue;
        }

        const docRef = db.collection('landing-emails').doc();
        batch.set(docRef, {
          email: user.email.toLowerCase(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        uploaded++;
      }

      await batch.commit();

      // Update stats
      const statsDoc = db.collection('stats').doc('global');
      try {
        await statsDoc.update({
          userCount: admin.firestore.FieldValue.increment(uploaded),
        });
      } catch (error) {
        await statsDoc.set({ userCount: uploaded });
      }

      res.status(200).json({
        uploaded,
        skipped,
        message: 'Bulk upload complete',
      });
    } catch (error) {
      console.error('Bulk upload error:', error);
      res.status(500).json({ error: 'Failed to complete bulk upload' });
    }
  }
) as any;

export default router;
