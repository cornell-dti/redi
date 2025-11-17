import { db } from '../../firebaseAdmin';
import {
  ProfileDoc,
  PreferencesDoc,
  WeeklyPromptAnswerDoc,
  WeeklyMatchDoc,
  NudgeDoc,
  DemographicCategory,
  DemographicBreakdownResponse,
  CompatibilityMatrixResponse,
  EngagementMetricsResponse,
  MutualNudgeStatsResponse,
  Gender,
} from '../types';

/**
 * Helper: Categorize user by gender + sexual orientation preferences
 */
function categorizeDemographic(
  gender: Gender,
  preferences?: Gender[]
): DemographicCategory {
  if (!preferences || preferences.length === 0) {
    return 'other';
  }

  const sortedPrefs = [...preferences].sort();

  if (gender === 'female') {
    if (sortedPrefs.length === 1 && sortedPrefs[0] === 'female') {
      return 'women_seeking_women';
    }
    if (sortedPrefs.length === 1 && sortedPrefs[0] === 'male') {
      return 'women_seeking_men';
    }
    return 'women_seeking_multiple';
  }

  if (gender === 'male') {
    if (sortedPrefs.length === 1 && sortedPrefs[0] === 'female') {
      return 'men_seeking_women';
    }
    if (sortedPrefs.length === 1 && sortedPrefs[0] === 'male') {
      return 'men_seeking_men';
    }
    return 'men_seeking_multiple';
  }

  if (gender === 'non-binary') {
    if (sortedPrefs.length === 1 && sortedPrefs[0] === 'female') {
      return 'nonbinary_seeking_women';
    }
    if (sortedPrefs.length === 1 && sortedPrefs[0] === 'male') {
      return 'nonbinary_seeking_men';
    }
    return 'nonbinary_seeking_multiple';
  }

  return 'other';
}

/**
 * Helper: Get display label for demographic category
 */
function getDemographicLabel(category: DemographicCategory): string {
  const labels: Record<DemographicCategory, string> = {
    women_seeking_women: 'Women seeking women',
    women_seeking_men: 'Women seeking men',
    women_seeking_multiple: 'Women seeking multiple genders',
    men_seeking_women: 'Men seeking women',
    men_seeking_men: 'Men seeking men',
    men_seeking_multiple: 'Men seeking multiple genders',
    nonbinary_seeking_women: 'Non-binary seeking women',
    nonbinary_seeking_men: 'Non-binary seeking men',
    nonbinary_seeking_multiple: 'Non-binary seeking multiple genders',
    other: 'Other',
  };
  return labels[category];
}

/**
 * Helper: Check if profile is complete
 */
function isProfileComplete(profile: any): boolean {
  return !!(
    profile.firstName &&
    profile.bio &&
    profile.gender &&
    profile.birthdate &&
    profile.year &&
    profile.school &&
    profile.major?.length > 0 &&
    profile.pictures?.length > 0
  );
}

/**
 * Get demographic breakdown (with optional prompt filter)
 */
export async function getDemographicBreakdown(
  promptId?: string
): Promise<DemographicBreakdownResponse> {
  console.log('Fetching demographic breakdown', { promptId });

  let netidsToInclude: Set<string> | null = null;

  // If promptId specified, filter to users who answered that prompt
  if (promptId) {
    const answersSnapshot = await db
      .collection('weeklyPromptAnswers')
      .where('promptId', '==', promptId)
      .get();

    netidsToInclude = new Set(
      answersSnapshot.docs.map((doc) => doc.data().netid as string)
    );

    console.log(
      `Found ${netidsToInclude.size} users who answered prompt ${promptId}`
    );
  }

  // Fetch all profiles
  const profilesSnapshot = await db.collection('profiles').get();

  // Fetch all preferences (indexed by netid for fast lookup)
  const preferencesSnapshot = await db.collection('preferences').get();
  const preferencesMap = new Map<string, Gender[]>();

  preferencesSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    preferencesMap.set(doc.id, data.genders || []);
  });

  // Count demographics
  const categoryCounts = new Map<DemographicCategory, number>();
  let totalUsers = 0;

  for (const profileDoc of profilesSnapshot.docs) {
    const profile = profileDoc.data();
    const netid = profile.netid;

    // Skip if filtering by prompt and user didn't answer
    if (netidsToInclude && !netidsToInclude.has(netid)) {
      continue;
    }

    // Skip incomplete profiles
    if (!isProfileComplete(profile)) {
      continue;
    }

    const genderPreferences = preferencesMap.get(netid);
    const category = categorizeDemographic(profile.gender, genderPreferences);

    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    totalUsers++;
  }

  // Convert to array with percentages
  const categories = Array.from(categoryCounts.entries())
    .map(([categoryKey, count]) => ({
      label: getDemographicLabel(categoryKey),
      categoryKey,
      count,
      percentage: totalUsers > 0 ? (count / totalUsers) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count); // Sort by count descending

  return {
    categories,
    totalUsers,
    filteredByPrompt: !!promptId,
    promptId,
  };
}

/**
 * Get compatibility matrix showing supply/demand
 */
export async function getCompatibilityMatrix(): Promise<CompatibilityMatrixResponse> {
  console.log('Fetching compatibility matrix');

  // Fetch all complete profiles with preferences
  const profilesSnapshot = await db.collection('profiles').get();
  const preferencesSnapshot = await db.collection('preferences').get();

  const preferencesMap = new Map<string, Gender[]>();
  preferencesSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    preferencesMap.set(doc.id, data.genders || []);
  });

  // Build user demographics list
  const users: Array<{
    netid: string;
    demographic: DemographicCategory;
    gender: Gender;
  }> = [];

  for (const profileDoc of profilesSnapshot.docs) {
    const profile = profileDoc.data();

    if (!isProfileComplete(profile)) continue;

    const preferences = preferencesMap.get(profile.netid);
    const demographic = categorizeDemographic(profile.gender, preferences);

    users.push({
      netid: profile.netid,
      demographic,
      gender: profile.gender,
    });
  }

  // Calculate compatibility matrix
  const matrix: Map<string, number> = new Map();

  // For each demographic, count how many users they could potentially match with
  const allDemographics: DemographicCategory[] = [
    'women_seeking_women',
    'women_seeking_men',
    'women_seeking_multiple',
    'men_seeking_women',
    'men_seeking_men',
    'men_seeking_multiple',
    'nonbinary_seeking_women',
    'nonbinary_seeking_men',
    'nonbinary_seeking_multiple',
  ];

  for (const userDemo of allDemographics) {
    const usersInDemo = users.filter((u) => u.demographic === userDemo);

    if (usersInDemo.length === 0) continue;

    // Determine what genders this demographic is interested in
    const sampleUser = usersInDemo[0];
    const preferences = preferencesMap.get(sampleUser.netid) || [];

    // Count potential matches by target demographic
    for (const targetDemo of allDemographics) {
      const potentialMatches = users.filter((u) => {
        // Must be in target demographic
        if (u.demographic !== targetDemo) return false;

        // User must be interested in potential match's gender
        return preferences.includes(u.gender);
      });

      const key = `${userDemo}:${targetDemo}`;
      matrix.set(key, potentialMatches.length);
    }
  }

  // Convert to array format
  const matrixArray = Array.from(matrix.entries()).map(([key, count]) => {
    const [userDemo, targetDemo] = key.split(':') as [
      DemographicCategory,
      DemographicCategory
    ];
    return {
      userDemographic: userDemo,
      targetDemographic: targetDemo,
      availableMatches: count,
    };
  });

  return {
    matrix: matrixArray,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Helper: Get Monday of current week (ET timezone)
 */
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Get engagement metrics (WAU + response rate)
 */
export async function getEngagementMetrics(): Promise<EngagementMetricsResponse> {
  console.log('Fetching engagement metrics');

  const now = new Date();
  const currentWeekStart = getMondayOfWeek(now);

  // Get last 6 weeks
  const weeksToFetch = 6;
  const weeklyStats = [];

  for (let i = 0; i < weeksToFetch; i++) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - i * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Find prompt for this week (if any)
    const promptsSnapshot = await db
      .collection('weeklyPrompts')
      .where('releaseDate', '>=', weekStart)
      .where('releaseDate', '<=', weekEnd)
      .limit(1)
      .get();

    const promptId = promptsSnapshot.empty
      ? undefined
      : promptsSnapshot.docs[0].data().promptId;

    // Count users who answered during this week
    let activeUsers = 0;
    if (promptId) {
      const answersSnapshot = await db
        .collection('weeklyPromptAnswers')
        .where('promptId', '==', promptId)
        .get();

      activeUsers = new Set(answersSnapshot.docs.map((d) => d.data().netid))
        .size;
    }

    // Count total eligible users (complete profiles) - use cached value on first iteration
    const profilesSnapshot = await db.collection('profiles').get();
    const eligibleUsers = profilesSnapshot.docs.filter((doc) =>
      isProfileComplete(doc.data())
    ).length;

    const responseRate =
      eligibleUsers > 0 ? (activeUsers / eligibleUsers) * 100 : 0;

    weeklyStats.push({
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      promptId,
      activeUsers,
      totalEligibleUsers: eligibleUsers,
      responseRate,
    });
  }

  const [currentWeek, ...historicalWeeks] = weeklyStats;

  return {
    currentWeek,
    historicalWeeks,
  };
}

/**
 * Get mutual nudge stats by demographic
 */
export async function getMutualNudgeStats(): Promise<MutualNudgeStatsResponse> {
  console.log('Fetching mutual nudge statistics');

  const now = new Date();
  const currentWeekStart = getMondayOfWeek(now);
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);

  // Find current week's prompt
  const promptsSnapshot = await db
    .collection('weeklyPrompts')
    .where('releaseDate', '>=', currentWeekStart)
    .where('releaseDate', '<=', currentWeekEnd)
    .limit(1)
    .get();

  const promptId = promptsSnapshot.empty
    ? undefined
    : promptsSnapshot.docs[0].data().promptId;

  // Fetch profiles and preferences
  const profilesSnapshot = await db.collection('profiles').get();
  const preferencesSnapshot = await db.collection('preferences').get();

  const profilesMap = new Map();
  const preferencesMap = new Map<string, Gender[]>();

  profilesSnapshot.docs.forEach((doc) => {
    profilesMap.set(doc.data().netid, doc.data());
  });

  preferencesSnapshot.docs.forEach((doc) => {
    preferencesMap.set(doc.id, doc.data().genders || []);
  });

  // Fetch matches and nudges for current week
  let matchesSnapshot;
  let nudgesSnapshot;

  if (promptId) {
    matchesSnapshot = await db
      .collection('weeklyMatches')
      .where('promptId', '==', promptId)
      .get();

    nudgesSnapshot = await db
      .collection('nudges')
      .where('promptId', '==', promptId)
      .get();
  } else {
    matchesSnapshot = { docs: [] } as any;
    nudgesSnapshot = { docs: [] } as any;
  }

  // Build mutual nudges set
  const mutualNudges = new Set<string>();
  nudgesSnapshot.docs.forEach((doc: any) => {
    const nudge = doc.data();
    if (nudge.mutual) {
      mutualNudges.add(`${nudge.fromNetid}:${nudge.toNetid}`);
      mutualNudges.add(`${nudge.toNetid}:${nudge.fromNetid}`);
    }
  });

  // Count by demographic
  const demographicStats = new Map<
    DemographicCategory,
    { matches: number; mutual: number }
  >();

  matchesSnapshot.docs.forEach((matchDoc: any) => {
    const match = matchDoc.data();
    const userNetid = match.netid;
    const profile = profilesMap.get(userNetid);

    if (!profile || !isProfileComplete(profile)) return;

    const preferences = preferencesMap.get(userNetid);
    const demographic = categorizeDemographic(profile.gender, preferences);

    const stats = demographicStats.get(demographic) || { matches: 0, mutual: 0 };

    // Count each match
    (match.matches || []).forEach((matchedNetid: string) => {
      stats.matches++;

      // Check if mutual
      const key = `${userNetid}:${matchedNetid}`;
      if (mutualNudges.has(key)) {
        stats.mutual++;
      }
    });

    demographicStats.set(demographic, stats);
  });

  // Convert to response format
  const demographics = Array.from(demographicStats.entries()).map(
    ([demo, stats]) => ({
      demographic: demo,
      demographicLabel: getDemographicLabel(demo),
      totalMatches: stats.matches,
      mutualNudges: stats.mutual,
      mutualNudgeRate:
        stats.matches > 0 ? (stats.mutual / stats.matches) * 100 : 0,
    })
  );

  // Calculate overall stats
  const overall = {
    totalMatches: demographics.reduce((sum, d) => sum + d.totalMatches, 0),
    mutualNudges: demographics.reduce((sum, d) => sum + d.mutualNudges, 0),
    mutualNudgeRate: 0,
  };
  overall.mutualNudgeRate =
    overall.totalMatches > 0
      ? (overall.mutualNudges / overall.totalMatches) * 100
      : 0;

  return {
    weekStart: currentWeekStart.toISOString(),
    weekEnd: currentWeekEnd.toISOString(),
    promptId,
    demographics,
    overall,
  };
}
