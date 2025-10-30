import { db } from '../../firebaseAdmin';
import {
  ReportDoc,
  ReportDocWrite,
  ReportResponse,
  ReportWithProfilesResponse,
  CreateReportInput,
  ReportStatus,
} from '../../types';
import { FieldValue } from 'firebase-admin/firestore';

const REPORTS_COLLECTION = 'reports';
const PROFILES_COLLECTION = 'profiles';

// Maximum number of reports a user can submit in 24 hours
const MAX_REPORTS_PER_DAY = 3;
const REPORT_WINDOW_HOURS = 24;

// =============================================================================
// REPORT OPERATIONS
// =============================================================================

/**
 * Create a new report with spam prevention
 * Users can submit up to 3 reports per 24 hours
 * @param reporterNetid - User submitting the report
 * @param input - Report details (reportedNetid, reason, description)
 * @returns Promise resolving to an object with the created ReportDoc and document ID
 * @throws Error if spam limit reached or validation fails
 */
export async function createReport(
  reporterNetid: string,
  input: CreateReportInput
): Promise<{ report: ReportDoc; id: string }> {
  const { reportedNetid, reason, description } = input;

  // Validation: User cannot report themselves
  if (reporterNetid === reportedNetid) {
    throw new Error('You cannot report yourself');
  }

  // Validation: Description length (10-1000 characters)
  if (description.length < 10) {
    throw new Error('Description must be at least 10 characters');
  }
  if (description.length > 1000) {
    throw new Error('Description must not exceed 1000 characters');
  }

  // Spam prevention: Check if user has submitted 3+ reports in last 24 hours
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(
    twentyFourHoursAgo.getHours() - REPORT_WINDOW_HOURS
  );

  const recentReportsSnapshot = await db
    .collection(REPORTS_COLLECTION)
    .where('reporterNetid', '==', reporterNetid)
    .where('createdAt', '>', twentyFourHoursAgo)
    .get();

  if (recentReportsSnapshot.size >= MAX_REPORTS_PER_DAY) {
    throw new Error(
      `You can only submit ${MAX_REPORTS_PER_DAY} reports per ${REPORT_WINDOW_HOURS} hours. Please try again later.`
    );
  }

  // Create the report document
  const reportDoc: ReportDocWrite = {
    reporterNetid,
    reportedNetid,
    reason,
    description,
    status: 'pending',
    createdAt: FieldValue.serverTimestamp(),
  };

  const reportRef = await db.collection(REPORTS_COLLECTION).add(reportDoc);

  // Fetch and return the created report with its document ID
  const createdReport = await reportRef.get();
  return {
    report: createdReport.data() as ReportDoc,
    id: reportRef.id,
  };
}

/**
 * Get a single report by ID
 * @param reportId - The Firestore document ID
 * @returns Promise resolving to ReportDoc or null if not found
 */
export async function getReportById(
  reportId: string
): Promise<ReportDoc | null> {
  const reportDoc = await db.collection(REPORTS_COLLECTION).doc(reportId).get();

  if (!reportDoc.exists) {
    return null;
  }

  return reportDoc.data() as ReportDoc;
}

/**
 * Get all reports with optional status filtering
 * @param statusFilter - Optional status to filter by
 * @returns Promise resolving to array of ReportDoc with document IDs
 */
export async function getAllReports(
  statusFilter?: ReportStatus
): Promise<Array<ReportDoc & { id: string }>> {
  let query = db
    .collection(REPORTS_COLLECTION)
    .orderBy('createdAt', 'desc') as FirebaseFirestore.Query;

  if (statusFilter) {
    query = query.where('status', '==', statusFilter);
  }

  const snapshot = await query.get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as ReportDoc),
  }));
}

/**
 * Update report status and add review metadata
 * @param reportId - The Firestore document ID
 * @param status - New status
 * @param reviewedBy - Admin uid who is reviewing
 * @param resolution - Optional resolution notes
 * @returns Promise resolving to updated ReportDoc
 */
export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  reviewedBy?: string,
  resolution?: string
): Promise<ReportDoc> {
  const reportRef = db.collection(REPORTS_COLLECTION).doc(reportId);
  const reportDoc = await reportRef.get();

  if (!reportDoc.exists) {
    throw new Error('Report not found');
  }

  const updateData: Partial<ReportDocWrite> = {
    status,
  };

  if (reviewedBy) {
    updateData.reviewedBy = reviewedBy;
    updateData.reviewedAt = FieldValue.serverTimestamp();
  }

  if (resolution !== undefined) {
    updateData.resolution = resolution;
  }

  await reportRef.update(updateData);

  // Fetch and return updated report
  const updatedReport = await reportRef.get();
  return updatedReport.data() as ReportDoc;
}

/**
 * Get reports with profile information for admin dashboard
 * Enriches report data with reporter and reported user profile details
 * @param statusFilter - Optional status to filter by
 * @returns Promise resolving to array of ReportWithProfilesResponse
 */
export async function getReportsWithProfiles(
  statusFilter?: ReportStatus
): Promise<ReportWithProfilesResponse[]> {
  const reports = await getAllReports(statusFilter);

  // Fetch all unique user profiles in parallel
  const uniqueNetids = new Set<string>();
  reports.forEach((report) => {
    uniqueNetids.add(report.reporterNetid);
    uniqueNetids.add(report.reportedNetid);
  });

  const profilesMap = new Map<
    string,
    { firstName: string; picture?: string }
  >();

  await Promise.all(
    Array.from(uniqueNetids).map(async (netid) => {
      const profileSnapshot = await db
        .collection(PROFILES_COLLECTION)
        .where('netid', '==', netid)
        .limit(1)
        .get();

      if (!profileSnapshot.empty) {
        const profileData = profileSnapshot.docs[0].data();
        profilesMap.set(netid, {
          firstName: profileData.firstName || netid,
          picture: profileData.pictures?.[0],
        });
      } else {
        profilesMap.set(netid, {
          firstName: netid,
        });
      }
    })
  );

  // Enrich reports with profile information
  return reports.map((report) => {
    const reporterProfile = profilesMap.get(report.reporterNetid);
    const reportedProfile = profilesMap.get(report.reportedNetid);

    return reportToResponseWithProfiles(
      report,
      report.id,
      reporterProfile?.firstName || report.reporterNetid,
      reporterProfile?.picture,
      reportedProfile?.firstName || report.reportedNetid,
      reportedProfile?.picture
    );
  });
}

/**
 * Convert ReportDoc to ReportResponse (for API responses)
 * @param reportDoc - The report document from Firestore
 * @param reportId - The document ID
 * @returns ReportResponse with ISO string timestamps
 */
export function reportToResponse(
  reportDoc: ReportDoc,
  reportId: string
): ReportResponse {
  return {
    id: reportId,
    reporterNetid: reportDoc.reporterNetid,
    reportedNetid: reportDoc.reportedNetid,
    reason: reportDoc.reason,
    description: reportDoc.description,
    status: reportDoc.status,
    reviewedBy: reportDoc.reviewedBy,
    reviewedAt: reportDoc.reviewedAt
      ? reportDoc.reviewedAt instanceof Date
        ? reportDoc.reviewedAt.toISOString()
        : reportDoc.reviewedAt.toDate().toISOString()
      : undefined,
    resolution: reportDoc.resolution,
    createdAt:
      reportDoc.createdAt instanceof Date
        ? reportDoc.createdAt.toISOString()
        : reportDoc.createdAt.toDate().toISOString(),
  };
}

/**
 * Convert ReportDoc to ReportWithProfilesResponse (for admin dashboard)
 * @param reportDoc - The report document from Firestore
 * @param reportId - The document ID
 * @param reporterName - Reporter's first name
 * @param reporterPicture - Reporter's profile picture
 * @param reportedName - Reported user's first name
 * @param reportedPicture - Reported user's profile picture
 * @returns ReportWithProfilesResponse
 */
export function reportToResponseWithProfiles(
  reportDoc: ReportDoc,
  reportId: string,
  reporterName: string,
  reporterPicture?: string,
  reportedName?: string,
  reportedPicture?: string
): ReportWithProfilesResponse {
  return {
    ...reportToResponse(reportDoc, reportId),
    reporterName,
    reporterPicture,
    reportedName: reportedName || reportDoc.reportedNetid,
    reportedPicture,
  };
}
