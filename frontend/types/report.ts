// =============================================================================
// REPORT TYPES (Frontend)
// =============================================================================

export type ReportReason =
  | 'inappropriate_content'
  | 'harassment'
  | 'spam'
  | 'fake_profile'
  | 'other';

export type ReportStatus = 'pending' | 'under_review' | 'resolved' | 'dismissed';

// Report data for API responses
export interface ReportResponse {
  id: string;
  reporterNetid: string;
  reportedNetid: string;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  reviewedBy?: string;
  reviewedAt?: string; // ISO string
  resolution?: string;
  createdAt: string; // ISO string
}

// For creating a new report
export interface CreateReportInput {
  reportedNetid: string;
  reason: ReportReason;
  description: string;
}
