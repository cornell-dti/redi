/**
 * Admin Health Check Routes
 * Provides system health and match readiness verification for admin dashboard
 */

import { Request, Response, Router } from 'express';
import { db } from '../../firebaseAdmin';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

// Response type for match readiness check
interface MatchReadinessResponse {
  status: 'ready' | 'warning' | 'error';
  activePrompt: {
    promptId: string;
    question: string;
    matchDate: string;
    matchDateLocal: string;
    isScheduledForTomorrow: boolean;
  } | null;
  userResponses: {
    count: number;
    uniqueUsers: number;
    sampleAnswers: Array<{ netid: string; answer: string }>;
  };
  systemHealth: {
    profilesExist: boolean;
    functionsDeployed: boolean;
    scheduledTime: string;
  };
  issues: string[];
  warnings: string[];
}

// Apply admin authentication to all routes
router.use('/api/admin/health', requireAdmin);

/**
 * GET /api/admin/health/match-readiness
 * Comprehensive pre-deployment health check for match generation
 */
router.get('/api/admin/health/match-readiness', async (req: Request, res: Response) => {
  try {
    console.log('Running match readiness health check');

    const response: MatchReadinessResponse = {
      status: 'ready',
      activePrompt: null,
      userResponses: {
        count: 0,
        uniqueUsers: 0,
        sampleAnswers: [],
      },
      systemHealth: {
        profilesExist: false,
        functionsDeployed: true, // Assume true since we're running
        scheduledTime: 'Friday at 9:01 AM ET',
      },
      issues: [],
      warnings: [],
    };

    // 1. Check for active prompt
    const activePromptSnapshot = await db
      .collection('weeklyPrompts')
      .where('active', '==', true)
      .limit(1)
      .get();

    if (activePromptSnapshot.empty) {
      response.status = 'error';
      response.issues.push('No active prompt found');
      return res.json(response);
    }

    const activePromptDoc = activePromptSnapshot.docs[0];
    const promptId = activePromptDoc.id;
    const promptData = activePromptDoc.data();

    // Parse dates
    const matchDate = promptData.matchDate?.toDate?.() || new Date(promptData.matchDate);
    const matchDateLocal = matchDate.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      dateStyle: 'full',
      timeStyle: 'short',
    });

    // Check if match date is tomorrow
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isScheduledForTomorrow =
      matchDate.getFullYear() === tomorrow.getFullYear() &&
      matchDate.getMonth() === tomorrow.getMonth() &&
      matchDate.getDate() === tomorrow.getDate();

    response.activePrompt = {
      promptId,
      question: promptData.question,
      matchDate: matchDate.toISOString(),
      matchDateLocal,
      isScheduledForTomorrow,
    };

    if (!isScheduledForTomorrow) {
      response.warnings.push(
        `Match date is ${matchDate.toDateString()}, not tomorrow`
      );
    }

    // 2. Count user responses
    const answersSnapshot = await db
      .collection('weeklyPromptAnswers')
      .where('promptId', '==', promptId)
      .get();

    response.userResponses.count = answersSnapshot.size;

    if (answersSnapshot.size === 0) {
      response.status = 'error';
      response.issues.push('No user responses for active prompt');
      return res.json(response);
    }

    // Get unique users
    const uniqueUsers = new Set<string>();
    answersSnapshot.docs.forEach((doc) => {
      uniqueUsers.add(doc.data().netid);
    });

    response.userResponses.uniqueUsers = uniqueUsers.size;

    if (uniqueUsers.size < 2) {
      response.status = 'error';
      response.issues.push('Need at least 2 users to generate matches');
    }

    // Get sample answers
    response.userResponses.sampleAnswers = answersSnapshot.docs
      .slice(0, 5)
      .map((doc) => ({
        netid: doc.data().netid,
        answer: doc.data().answer,
      }));

    // 3. Check if profiles exist
    const profilesSnapshot = await db.collection('profiles').limit(1).get();
    response.systemHealth.profilesExist = !profilesSnapshot.empty;

    if (profilesSnapshot.empty) {
      response.status = 'error';
      response.issues.push('No user profiles found in database');
    }

    // 4. Check for existing matches
    const existingMatchesSnapshot = await db
      .collection('weeklyMatches')
      .where('promptId', '==', promptId)
      .get();

    if (existingMatchesSnapshot.size > 0) {
      response.warnings.push(
        `${existingMatchesSnapshot.size} matches already exist for this prompt`
      );
      if (response.status !== 'error') {
        response.status = 'warning';
      }
    }

    // Set final status
    if (response.issues.length === 0 && response.warnings.length > 0) {
      response.status = 'warning';
    } else if (response.issues.length === 0) {
      response.status = 'ready';
    }

    console.log(
      `Health check complete: ${response.status} - ${response.userResponses.count} responses, ${response.issues.length} issues, ${response.warnings.length} warnings`
    );

    res.json(response);
  } catch (error) {
    console.error('Error running match readiness check:', error);
    res.status(500).json({
      error: 'Failed to run health check',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
