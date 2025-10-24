import express from 'express';
import { db } from '../../firebaseAdmin';
import { AuthenticatedRequest, authenticateUser } from '../middleware/auth';
import { authenticatedRateLimit } from '../middleware/rateLimiting';
import {
  createNudge,
  getNudgeStatus,
  nudgeToResponse,
} from '../services/nudgesService';

const router = express.Router();

// =============================================================================
// USER VERIFICATION HELPER
// =============================================================================

/**
 * Gets netid from authenticated Firebase UID
 */
const getNetidFromAuth = async (firebaseUid: string): Promise<string | null> => {
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
    console.error('Error getting netid:', error);
    return null;
  }
};

// =============================================================================
// NUDGE ENDPOINTS
// =============================================================================

/**
 * POST /api/nudges
 * Send a nudge to a matched user
 * Body: { toNetid: string, promptId: string }
 */
router.post(
  '/api/nudges',
  authenticatedRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const { toNetid, promptId } = req.body;

      // Validate request body
      if (!toNetid || !promptId) {
        return res.status(400).json({
          error: 'Missing required fields: toNetid and promptId are required'
        });
      }

      // Get the authenticated user's netid
      const fromNetid = await getNetidFromAuth(req.user!.uid);
      if (!fromNetid) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify the users are actually matched for this prompt
      const matchDocId = `${fromNetid}_${promptId}`;
      const matchDoc = await db.collection('weeklyMatches').doc(matchDocId).get();

      if (!matchDoc.exists) {
        return res.status(404).json({ error: 'Match document not found' });
      }

      const matchData = matchDoc.data();
      if (!matchData || !matchData.matches.includes(toNetid)) {
        return res.status(403).json({
          error: 'Cannot nudge: users are not matched for this prompt'
        });
      }

      // Create the nudge
      const nudge = await createNudge(fromNetid, toNetid, promptId);
      const response = nudgeToResponse(nudge);

      res.status(201).json(response);
    } catch (error: any) {
      console.error('Error creating nudge:', error);

      if (error.message === 'You have already nudged this match') {
        return res.status(400).json({ error: error.message });
      }

      res.status(500).json({ error: 'Failed to create nudge' });
    }
  }
);

/**
 * GET /api/nudges/:promptId/:matchNetid/status
 * Get nudge status between authenticated user and a matched user
 */
router.get(
  '/api/nudges/:promptId/:matchNetid/status',
  authenticatedRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const { promptId, matchNetid } = req.params;

      // Get the authenticated user's netid
      const netid = await getNetidFromAuth(req.user!.uid);
      if (!netid) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get nudge status
      const status = await getNudgeStatus(netid, matchNetid, promptId);

      res.status(200).json(status);
    } catch (error) {
      console.error('Error getting nudge status:', error);
      res.status(500).json({ error: 'Failed to get nudge status' });
    }
  }
);

export default router;
