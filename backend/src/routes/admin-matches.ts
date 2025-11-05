/**
 * Admin Matches Routes
 *
 * Secure admin endpoints for managing matches manually.
 * All routes are protected by requireAdmin middleware.
 */

import express from 'express';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../../firebaseAdmin';
import { ProfileDoc } from '../../types';
import { AdminRequest, requireAdmin } from '../middleware/adminAuth';
import {
  getIpAddress,
  getUserAgent,
  logAdminAction,
} from '../services/auditLog';

const router = express.Router();

// Apply admin middleware to ALL routes in this router
router.use(requireAdmin);

/**
 * User with profile response interface
 */
interface UserWithProfile {
  netId: string;
  firstName: string;
  profilePicture?: string;
}

/**
 * Manual match creation input interface
 */
interface CreateManualMatchInput {
  user1NetId: string;
  user2NetId: string;
  promptId: string;
  expiresAt: string; // ISO date string
  chatUnlocked?: boolean;
  revealed?: boolean;
}

/**
 * Manual match response interface
 */
interface ManualMatchResponse {
  netId: string;
  matches: string[];
  promptId: string;
  createdAt: string;
  expiresAt: string;
}

/**
 * GET /api/admin/users
 * Get all users with profile information for admin use
 *
 * @secured Requires admin authentication
 *
 * @returns {UserWithProfile[]} 200 - Array of users with profile data
 * @returns {Error} 401/403 - Unauthorized (handled by middleware)
 * @returns {Error} 500 - Internal server error
 */
router.get('/api/admin/users', async (req: AdminRequest, res) => {
  try {
    console.log(`Admin ${req.user?.email} fetching all users`);

    const usersSnapshot = await db.collection('users').get();
    const usersWithProfiles: UserWithProfile[] = [];

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const netId = userData.netid || userDoc.id;

      // Fetch profile for this user
      const profileDoc = await db.collection('profiles').doc(netId).get();

      let firstName = 'Unknown';
      let profilePicture: string | undefined;

      if (profileDoc.exists) {
        const profileData = profileDoc.data() as ProfileDoc;
        firstName = profileData.firstName || 'Unknown';
        profilePicture = profileData.pictures?.[0];
      }

      usersWithProfiles.push({
        netId,
        firstName,
        profilePicture,
      });
    }

    // Sort by firstName
    usersWithProfiles.sort((a, b) => a.firstName.localeCompare(b.firstName));

    // Log successful action
    await logAdminAction(
      'VIEW_USERS',
      req.user!.uid,
      req.user!.email,
      'users',
      'all',
      { userCount: usersWithProfiles.length },
      getIpAddress(req),
      getUserAgent(req)
    );

    res.status(200).json(usersWithProfiles);
  } catch (error) {
    console.error('Error fetching users with profiles:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Log failed action
    await logAdminAction(
      'VIEW_USERS',
      req.user!.uid,
      req.user!.email,
      'users',
      'all',
      { error: errorMessage },
      getIpAddress(req),
      getUserAgent(req),
      false,
      errorMessage
    );

    res.status(500).json({ error: errorMessage });
  }
});

/**
 * POST /api/admin/matches/manual
 * Create manual matches between two users for testing
 *
 * Creates two weeklyMatches documents:
 * - Document 1: netId = User 1, matches = [User 2]
 * - Document 2: netId = User 2, matches = [User 1]
 *
 * @secured Requires admin authentication
 * @audit Logs CREATE_MANUAL_MATCH action
 *
 * @param {CreateManualMatchInput} matchData.body.required - Match creation data
 * @returns {object} 201 - Created matches
 * @returns {Error} 400 - Invalid data or validation errors
 * @returns {Error} 401/403 - Unauthorized (handled by middleware)
 * @returns {Error} 409 - Match already exists
 * @returns {Error} 500 - Internal server error
 */
router.post('/api/admin/matches/manual', async (req: AdminRequest, res) => {
  try {
    const matchData: CreateManualMatchInput = req.body;

    console.log(
      `Admin ${req.user?.email} creating manual match:`,
      matchData
    );

    // Validate required fields
    if (
      !matchData.user1NetId ||
      !matchData.user2NetId ||
      !matchData.promptId ||
      !matchData.expiresAt
    ) {
      return res.status(400).json({
        error: 'user1NetId, user2NetId, promptId, and expiresAt are required',
      });
    }

    // Check users aren't the same
    if (matchData.user1NetId === matchData.user2NetId) {
      return res.status(400).json({
        error: 'Cannot match a user with themselves',
      });
    }

    // Check if users exist
    const user1Snapshot = await db
      .collection('users')
      .where('netid', '==', matchData.user1NetId)
      .get();

    if (user1Snapshot.empty) {
      return res.status(400).json({
        error: `User with netId "${matchData.user1NetId}" not found`,
      });
    }

    const user2Snapshot = await db
      .collection('users')
      .where('netid', '==', matchData.user2NetId)
      .get();

    if (user2Snapshot.empty) {
      return res.status(400).json({
        error: `User with netId "${matchData.user2NetId}" not found`,
      });
    }

    // Check if matches already exist for this prompt
    const user1MatchesSnapshot = await db
      .collection('weeklyMatches')
      .where('netid', '==', matchData.user1NetId)
      .where('promptId', '==', matchData.promptId)
      .get();

    if (!user1MatchesSnapshot.empty) {
      return res.status(409).json({
        error: `User 1 (${matchData.user1NetId}) already has a match for prompt ${matchData.promptId}`,
      });
    }

    const user2MatchesSnapshot = await db
      .collection('weeklyMatches')
      .where('netid', '==', matchData.user2NetId)
      .where('promptId', '==', matchData.promptId)
      .get();

    if (!user2MatchesSnapshot.empty) {
      return res.status(409).json({
        error: `User 2 (${matchData.user2NetId}) already has a match for prompt ${matchData.promptId}`,
      });
    }

    // Parse expiresAt date
    const expiresAtDate = new Date(matchData.expiresAt);
    if (isNaN(expiresAtDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid expiration date',
      });
    }

    const now = Timestamp.now();
    const expiresAtTimestamp = Timestamp.fromDate(expiresAtDate);

    // Create match for User 1
    const match1Data = {
      netid: matchData.user1NetId,
      matches: [matchData.user2NetId],
      promptId: matchData.promptId,
      createdAt: now,
      expiresAt: expiresAtTimestamp,
      chatUnlocked: matchData.chatUnlocked || false,
      revealed: [matchData.revealed || false],
    };

    console.log('Creating match 1:', match1Data);
    const match1Ref = await db.collection('weeklyMatches').add(match1Data);
    console.log('Match 1 created with ID:', match1Ref.id);

    // Create match for User 2
    const match2Data = {
      netid: matchData.user2NetId,
      matches: [matchData.user1NetId],
      promptId: matchData.promptId,
      createdAt: now,
      expiresAt: expiresAtTimestamp,
      chatUnlocked: matchData.chatUnlocked || false,
      revealed: [matchData.revealed || false],
    };

    console.log('Creating match 2:', match2Data);
    const match2Ref = await db.collection('weeklyMatches').add(match2Data);
    console.log('Match 2 created with ID:', match2Ref.id);

    // Log successful action
    await logAdminAction(
      'CREATE_MANUAL_MATCH',
      req.user!.uid,
      req.user!.email,
      'matches',
      `${matchData.user1NetId}-${matchData.user2NetId}`,
      {
        user1NetId: matchData.user1NetId,
        user2NetId: matchData.user2NetId,
        promptId: matchData.promptId,
        expiresAt: matchData.expiresAt,
      },
      getIpAddress(req),
      getUserAgent(req)
    );

    res.status(201).json({
      message: `Successfully created matches between ${matchData.user1NetId} and ${matchData.user2NetId}`,
      match1Id: match1Ref.id,
      match2Id: match2Ref.id,
      promptId: matchData.promptId,
    });
  } catch (error) {
    console.error('Error creating manual matches:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Log failed action
    await logAdminAction(
      'CREATE_MANUAL_MATCH',
      req.user!.uid,
      req.user!.email,
      'matches',
      'manual',
      { error: errorMessage },
      getIpAddress(req),
      getUserAgent(req),
      false,
      errorMessage
    );

    res.status(500).json({ error: errorMessage });
  }
});

/**
 * GET /api/admin/matches/recent
 * Get recent matches (last 10) for admin view
 *
 * @secured Requires admin authentication
 *
 * @returns {ManualMatchResponse[]} 200 - Array of recent matches
 * @returns {Error} 401/403 - Unauthorized (handled by middleware)
 * @returns {Error} 500 - Internal server error
 */
router.get('/api/admin/matches/recent', async (req: AdminRequest, res) => {
  try {
    console.log(`Admin ${req.user?.email} fetching recent matches`);

    // Try with orderBy first, fall back if index missing
    let matchesSnapshot;
    try {
      matchesSnapshot = await db
        .collection('weeklyMatches')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();
    } catch (indexError) {
      console.warn(
        'Firestore index missing for orderBy, fetching without ordering'
      );
      matchesSnapshot = await db.collection('weeklyMatches').limit(10).get();
    }

    const recentMatches: ManualMatchResponse[] = [];

    for (const matchDoc of matchesSnapshot.docs) {
      const matchData = matchDoc.data();

      // Ensure matches is an array
      let matchesArray: string[] = [];
      if (Array.isArray(matchData.matches)) {
        matchesArray = matchData.matches;
      } else if (typeof matchData.matches === 'string') {
        matchesArray = [matchData.matches];
      }

      const matchResponse = {
        netId: matchData.netid,
        matches: matchesArray,
        promptId: matchData.promptId,
        createdAt: matchData.createdAt?.toDate
          ? matchData.createdAt.toDate().toISOString()
          : new Date().toISOString(),
        expiresAt: matchData.expiresAt?.toDate
          ? matchData.expiresAt.toDate().toISOString()
          : new Date().toISOString(),
      };

      recentMatches.push(matchResponse);
    }

    console.log(
      `Returning ${recentMatches.length} recent matches:`,
      recentMatches.slice(0, 2)
    );

    res.status(200).json(recentMatches);
  } catch (error) {
    console.error('Error fetching recent matches:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
