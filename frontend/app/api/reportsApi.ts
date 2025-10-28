/**
 * Reports API Service
 * All endpoints use Bearer token authentication
 */

import type { CreateReportInput, ReportResponse } from '@/types';
import { apiClient } from './apiClient';

// =============================================================================
// REPORTS API
// =============================================================================

/**
 * Submit a report for a user
 *
 * @param input - Report details (reportedNetid, reason, description)
 * @returns Promise resolving to created report
 * @throws APIError if report submission fails (spam limit, validation, etc.)
 */
export async function createReport(
  input: CreateReportInput
): Promise<ReportResponse> {
  return apiClient.post<ReportResponse>('/api/reports', input);
}
