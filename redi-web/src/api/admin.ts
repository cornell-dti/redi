import {
  ActivatePromptResponse,
  ApiResponse,
  CreatePromptRequest,
  GenerateMatchesResponse,
  MatchStatsResponse,
  PromptMatchDetailResponse,
  ReportResponse,
  ReportStatus,
  ReportWithProfilesResponse,
  UpdateReportStatusInput,
  WeeklyPrompt,
  WeeklyPromptAnswerWithProfile,
} from '@/types/admin';
import type {
  DemographicBreakdownResponse,
  CompatibilityMatrixResponse,
  EngagementMetricsResponse,
  MutualNudgeStatsResponse,
} from '@/types/analytics';
import { getAuth } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { FIREBASE_APP, FIREBASE_DB } from '../../firebase';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

/**
 * Get Firebase ID token for authenticated user
 * Forces token refresh to ensure latest custom claims
 */
const getAuthToken = async (): Promise<string> => {
  const auth = getAuth(FIREBASE_APP);
  const user = auth.currentUser;

  if (!user) {
    console.error('No authenticated user found');
    throw new Error('User not authenticated. Please sign in again.');
  }

  // Force refresh to get latest custom claims (important for admin verification)
  const token = await user.getIdToken(true);

  return token;
};

/**
 * Create a new weekly prompt
 */
export const createPrompt = async (
  data: CreatePromptRequest
): Promise<ApiResponse<WeeklyPrompt>> => {
  console.log('Creating prompt with data:', data);

  const token = await getAuthToken();

  const res = await fetch(`${API_BASE_URL}/api/admin/prompts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data), // No firebaseUid needed
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create prompt');
  }

  return res.json();
};

/**
 * Activate a prompt immediately
 */
export const activatePrompt = async (
  promptId: string
): Promise<ApiResponse<ActivatePromptResponse>> => {
  console.log('Activating prompt:', promptId);

  const token = await getAuthToken();

  const res = await fetch(
    `${API_BASE_URL}/api/admin/prompts/${promptId}/activate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}), // Empty body, no firebaseUid
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to activate prompt');
  }

  return res.json();
};

/**
 * Generate matches for a prompt immediately
 */
export const generateMatches = async (
  promptId: string
): Promise<ApiResponse<GenerateMatchesResponse>> => {
  console.log('Generating matches for prompt:', promptId);

  const token = await getAuthToken();

  const res = await fetch(
    `${API_BASE_URL}/api/admin/prompts/${promptId}/generate-matches`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}), // Empty body, no firebaseUid
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to generate matches');
  }

  return res.json();
};

/**
 * Fetch all prompts from Firestore (direct read, no backend call)
 */
export const fetchAllPrompts = async (): Promise<WeeklyPrompt[]> => {
  console.log('Fetching all prompts from Firestore');

  const promptsRef = collection(FIREBASE_DB, 'weeklyPrompts');
  const q = query(promptsRef, orderBy('releaseDate', 'desc'));
  const snapshot = await getDocs(q);
  const prompts: WeeklyPrompt[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const answerCount = await fetchAnswerCount(doc.id);

    prompts.push({
      id: doc.id,
      promptId: doc.id,
      question: data.question,
      releaseDate: data.releaseDate?.toDate
        ? data.releaseDate.toDate().toISOString()
        : data.releaseDate || null,
      matchDate: data.matchDate?.toDate
        ? data.matchDate.toDate().toISOString()
        : data.matchDate || null,
      active: data.active || false,
      status: data.status || 'scheduled',
      activatedAt: data.activatedAt?.toDate
        ? data.activatedAt.toDate().toISOString()
        : data.activatedAt || null,
      matchesGeneratedAt: data.matchesGeneratedAt?.toDate
        ? data.matchesGeneratedAt.toDate().toISOString()
        : data.matchesGeneratedAt || null,
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate().toISOString()
        : data.createdAt || null,
      answerCount,
    });
  }

  return prompts;
};

/**
 * Fetch answer count for a specific prompt
 */
export const fetchAnswerCount = async (promptId: string): Promise<number> => {
  try {
    const answersRef = collection(FIREBASE_DB, 'weeklyPromptAnswers');
    const q = query(answersRef, where('promptId', '==', promptId));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error fetching answer count:', error);
    // TEMP FIX: Return 1 if error occurs to avoid blocking prompt display
    return 1;
  }
};

/**
 * Fetch a single prompt by ID
 */
export const fetchPromptById = async (
  promptId: string
): Promise<WeeklyPrompt | null> => {
  const promptRef = doc(FIREBASE_DB, 'weeklyPrompts', promptId);
  const promptDoc = await getDoc(promptRef);

  if (!promptDoc.exists()) {
    return null;
  }

  const data = promptDoc.data();
  const answerCount = await fetchAnswerCount(promptId);
  return {
    id: promptId,
    promptId,
    question: data.question,
    releaseDate: data.releaseDate?.toDate
      ? data.releaseDate.toDate().toISOString()
      : data.releaseDate || null,
    matchDate: data.matchDate?.toDate
      ? data.matchDate.toDate().toISOString()
      : data.matchDate || null,
    active: data.active || false,
    status: data.status || 'scheduled',
    activatedAt: data.activatedAt?.toDate
      ? data.activatedAt.toDate().toISOString()
      : data.activatedAt || null,
    matchesGeneratedAt: data.matchesGeneratedAt?.toDate
      ? data.matchesGeneratedAt.toDate().toISOString()
      : data.matchesGeneratedAt || null,
    createdAt: data.createdAt?.toDate
      ? data.createdAt.toDate().toISOString()
      : data.createdAt || null,
    answerCount,
  };
};

/**
 * Delete the currently active prompt
 */
export const deleteActivePrompt = async (): Promise<
  ApiResponse<{ message: string; promptId: string }>
> => {
  const token = await getAuthToken();

  const res = await fetch(`${API_BASE_URL}/api/admin/prompts/active`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}), // Empty body, no firebaseUid
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete active prompt');
  }

  return res.json();
};

/**
 * Fix multiple active prompts issue (emergency cleanup)
 * Deactivates all prompts except the most recently activated one
 */
export const fixMultipleActivePrompts = async (): Promise<{
  message: string;
  keptActive?: {
    promptId: string;
    question: string;
    activatedAt: string | null;
  };
  deactivated?: Array<{ promptId: string; question: string }>;
  deactivatedCount: number;
}> => {
  console.log('Fixing multiple active prompts issue');

  const token = await getAuthToken();

  const res = await fetch(
    `${API_BASE_URL}/api/admin/prompts/fix-multiple-active`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fix multiple active prompts');
  }

  return res.json();
};

/**
 * Generate prompt ID from a date
 */
export const generatePromptId = async (date: Date): Promise<string> => {
  console.log('Generating prompt ID for date:', date.toISOString());

  const token = await getAuthToken();

  const res = await fetch(
    `${API_BASE_URL}/api/admin/prompts/generate-id/${date.toISOString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to generate prompt ID');
  }

  const data = await res.json();
  return data.promptId;
};

/**
 * Get prompts from backend API (with filters)
 */
export const getPrompts = async (filters?: {
  active?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<ApiResponse<WeeklyPrompt[]>> => {
  console.log('Getting prompts with filters:', filters);

  const token = await getAuthToken();

  const queryParams = new URLSearchParams();
  if (filters?.active !== undefined) {
    queryParams.append('active', filters.active.toString());
  }
  if (filters?.startDate) {
    queryParams.append('startDate', filters.startDate);
  }
  if (filters?.endDate) {
    queryParams.append('endDate', filters.endDate);
  }
  if (filters?.limit) {
    queryParams.append('limit', filters.limit.toString());
  }

  const url = `${API_BASE_URL}/api/admin/prompts${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch prompts');
  }

  return res.json();
};

/**
 * Get a single prompt from backend API
 */
export const getPrompt = async (
  promptId: string
): Promise<ApiResponse<WeeklyPrompt>> => {
  const token = await getAuthToken();

  const res = await fetch(`${API_BASE_URL}/api/admin/prompts/${promptId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch prompt');
  }

  return res.json();
};

/**
 * Update a prompt
 */
export const updatePrompt = async (
  promptId: string,
  updates: Partial<CreatePromptRequest>
): Promise<ApiResponse<WeeklyPrompt>> => {
  const token = await getAuthToken();

  const res = await fetch(`${API_BASE_URL}/api/admin/prompts/${promptId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates), // No firebaseUid needed
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update prompt');
  }

  return res.json();
};

/**
 * Delete a prompt
 */
export const deletePrompt = async (
  promptId: string
): Promise<ApiResponse<{ message: string }>> => {
  const token = await getAuthToken();

  const res = await fetch(`${API_BASE_URL}/api/admin/prompts/${promptId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}), // Empty body, no firebaseUid
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete prompt');
  }

  return res.json();
};

/**
 * Fetch all answers for a specific prompt with user profile information
 */
export const fetchPromptAnswers = async (
  promptId: string
): Promise<WeeklyPromptAnswerWithProfile[]> => {
  console.log('Fetching answers for prompt:', promptId);

  const token = await getAuthToken();

  const res = await fetch(
    `${API_BASE_URL}/api/admin/prompts/${promptId}/answers`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  console.log('Response status:', res.status, res.statusText);

  if (!res.ok) {
    const error = await res.json();
    console.error('❌ Error response:', error);
    throw new Error(error.error || 'Failed to fetch prompt answers');
  }

  const data = await res.json();
  console.log('Received answers:', data.length, 'answers');
  console.log('Sample answer:', data[0]);

  return data;
};

/**
 * Fetch overall match statistics across all prompts
 */
export const fetchMatchStats = async (): Promise<MatchStatsResponse> => {
  console.log('Fetching match statistics');

  const token = await getAuthToken();

  const res = await fetch(`${API_BASE_URL}/api/admin/matches/stats`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log('Response status:', res.status, res.statusText);

  if (!res.ok) {
    const error = await res.json();
    console.error('Error response:', error);
    throw new Error(error.error || 'Failed to fetch match statistics');
  }

  const data = await res.json();
  console.log('Received match stats:', data);

  return data;
};

/**
 * Fetch detailed match data for a specific prompt
 */
export const fetchPromptMatches = async (
  promptId: string
): Promise<PromptMatchDetailResponse> => {
  console.log('Fetching matches for prompt:', promptId);

  const token = await getAuthToken();

  const res = await fetch(
    `${API_BASE_URL}/api/admin/prompts/${promptId}/matches`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch prompt matches');
  }

  return res.json();
};

// =============================================================================
// REPORTS API
// =============================================================================

/**
 * Fetch all reports with optional status filtering
 */
export const fetchReports = async (
  statusFilter?: ReportStatus
): Promise<ReportWithProfilesResponse[]> => {
  console.log('Fetching reports with status filter:', statusFilter);

  const token = await getAuthToken();

  const queryParams = new URLSearchParams();
  if (statusFilter) {
    queryParams.append('status', statusFilter);
  }

  const url = `${API_BASE_URL}/api/admin/reports${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log('Response status:', res.status, res.statusText);

  if (!res.ok) {
    const error = await res.json();
    console.error('❌ Error response:', error);
    throw new Error(error.error || 'Failed to fetch reports');
  }

  const data = await res.json();
  console.log('Received reports:', data.length, 'reports');

  return data;
};

/**
 * Fetch a single report by ID
 */
export const fetchReportById = async (
  reportId: string
): Promise<ReportResponse> => {
  console.log('Fetching report:', reportId);

  const token = await getAuthToken();

  const res = await fetch(`${API_BASE_URL}/api/admin/reports/${reportId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch report');
  }

  return res.json();
};

/**
 * Update report status
 */
export const updateReportStatus = async (
  reportId: string,
  input: UpdateReportStatusInput
): Promise<ReportResponse> => {
  console.log('Updating report status:', reportId, input);
  console.log(
    'Request URL:',
    `${API_BASE_URL}/api/admin/reports/${reportId}/status`
  );

  const token = await getAuthToken();

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/admin/reports/${reportId}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error response:', errorText);
      let errorMessage = 'Failed to update report status';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        errorMessage = `${res.status} - ${errorText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

/**
 * Resolve a report with resolution notes
 */
export const resolveReport = async (
  reportId: string,
  resolution: string
): Promise<ReportResponse> => {
  const token = await getAuthToken();

  const res = await fetch(
    `${API_BASE_URL}/api/admin/reports/${reportId}/resolve`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ resolution }),
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to resolve report');
  }

  return res.json();
};

// =============================================================================
// MANUAL MATCHES API
// =============================================================================

/**
 * User with profile information for admin use
 */
export interface UserWithProfile {
  netId: string;
  firstName: string;
  profilePicture?: string;
}

/**
 * Manual match creation input
 */
export interface CreateManualMatchInput {
  user1NetId: string;
  user2NetId: string;
  promptId: string;
  expiresAt: string; // ISO date string
  chatUnlocked?: boolean;
  revealed?: boolean;
  appendToExisting?: boolean; // If true, appends to existing matches instead of erroring
}

/**
 * Manual match response
 */
export interface ManualMatchResponse {
  netId: string;
  matches: string[];
  promptId: string;
  createdAt: string;
  expiresAt: string;
}

/**
 * Fetch all users with profile information for admin use
 */
export const fetchUsersWithProfiles = async (): Promise<UserWithProfile[]> => {
  console.log('Fetching users with profiles');

  const token = await getAuthToken();

  const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch users');
  }

  return res.json();
};

/**
 * Create manual matches between two users for testing
 */
export const createManualMatch = async (
  matchData: CreateManualMatchInput
): Promise<{ message: string; match1Id: string; match2Id: string }> => {
  console.log('Creating manual match:', matchData);

  const token = await getAuthToken();

  const res = await fetch(`${API_BASE_URL}/api/admin/matches/manual`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(matchData),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create manual match');
  }

  return res.json();
};

/**
 * Fetch recent matches (last 10) for admin view
 */
export const fetchRecentMatches = async (): Promise<ManualMatchResponse[]> => {
  console.log('Fetching recent matches');

  const token = await getAuthToken();

  const res = await fetch(`${API_BASE_URL}/api/admin/matches/recent`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch recent matches');
  }

  return res.json();
};

/**
 * User details response from backend
 */
export interface UserDetailsResponse {
  netId: string;
  firstName: string;
  pictures: string[];
  promptAnswer: string | null;
}

/**
 * Fetch detailed user information including all pictures and prompt answer
 */
export const fetchUserDetails = async (
  netId: string,
  promptId?: string
): Promise<UserDetailsResponse> => {
  console.log('Fetching user details:', netId, promptId);

  const token = await getAuthToken();

  const queryParams = promptId ? `?promptId=${promptId}` : '';
  const res = await fetch(
    `${API_BASE_URL}/api/admin/users/${netId}/details${queryParams}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch user details');
  }

  return res.json();
};

// =============================================================================
// ANALYTICS ENDPOINTS
// =============================================================================

/**
 * Fetch demographic breakdown (with optional prompt filter)
 */
export const fetchDemographicBreakdown = async (
  promptId?: string
): Promise<DemographicBreakdownResponse> => {
  console.log('Fetching demographic breakdown', { promptId });

  const token = await getAuthToken();
  const url = promptId
    ? `${API_BASE_URL}/api/admin/analytics/demographics?promptId=${encodeURIComponent(promptId)}`
    : `${API_BASE_URL}/api/admin/analytics/demographics`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch demographic breakdown');
  }

  return res.json();
};

/**
 * Fetch compatibility matrix
 */
export const fetchCompatibilityMatrix =
  async (): Promise<CompatibilityMatrixResponse> => {
    console.log('Fetching compatibility matrix');

    const token = await getAuthToken();

    const res = await fetch(
      `${API_BASE_URL}/api/admin/analytics/compatibility-matrix`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch compatibility matrix');
    }

    return res.json();
  };

/**
 * Fetch engagement metrics
 */
export const fetchEngagementMetrics =
  async (): Promise<EngagementMetricsResponse> => {
    console.log('Fetching engagement metrics');

    const token = await getAuthToken();

    const res = await fetch(`${API_BASE_URL}/api/admin/analytics/engagement`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch engagement metrics');
    }

    return res.json();
  };

/**
 * Fetch mutual nudge statistics
 */
export const fetchMutualNudgeStats =
  async (): Promise<MutualNudgeStatsResponse> => {
    console.log('Fetching mutual nudge statistics');

    const token = await getAuthToken();

    const res = await fetch(
      `${API_BASE_URL}/api/admin/analytics/mutual-nudges`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch mutual nudge statistics');
    }

    return res.json();
  };
