/**
 * Test data factories for creating mock data
 * These factories help create consistent test data across tests
 */

import {
  ReportDoc,
  ReportReason,
  ReportStatus,
  BlockedUserDoc,
  UserDoc,
  ProfileDoc,
  Gender,
  Year,
  School,
} from '../../../types';

/**
 * Create a mock user document
 */
export const createMockUser = (overrides: Partial<UserDoc> = {}): UserDoc => ({
  netid: 'jd123',
  email: 'jd123@cornell.edu',
  firebaseUid: 'firebase-uid-123',
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

/**
 * Create a mock profile document
 */
export const createMockProfile = (
  overrides: Partial<ProfileDoc> = {}
): ProfileDoc => ({
  netid: 'jd123',
  firstName: 'John',
  bio: 'Test bio',
  gender: 'male' as Gender,
  birthdate: new Date('2000-01-01'),
  hometown: 'New York',
  pronouns: 'He/Him/His',
  year: 'Junior' as Year,
  school: 'College of Arts and Sciences' as School,
  major: ['Computer Science'],
  pictures: ['https://example.com/pic1.jpg'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

/**
 * Create a mock report document
 */
export const createMockReport = (
  overrides: Partial<ReportDoc> = {}
): ReportDoc => ({
  reporterNetid: 'reporter123',
  reportedNetid: 'reported456',
  reason: 'harassment' as ReportReason,
  description: 'This is a test report description with enough characters.',
  status: 'pending' as ReportStatus,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

/**
 * Create a mock block document
 */
export const createMockBlock = (
  overrides: Partial<BlockedUserDoc> = {}
): BlockedUserDoc => ({
  blockerNetid: 'blocker123',
  blockedNetid: 'blocked456',
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

/**
 * Create multiple mock reports with different data
 */
export const createMockReports = (count: number): ReportDoc[] => {
  const reasons: ReportReason[] = [
    'harassment',
    'inappropriate_content',
    'spam',
    'fake_profile',
    'other',
  ];
  const statuses: ReportStatus[] = [
    'pending',
    'under_review',
    'resolved',
    'dismissed',
  ];

  return Array.from({ length: count }, (_, i) => {
    const now = new Date();
    const createdAt = new Date(now.getTime() - i * 1000 * 60 * 60); // Stagger by hours

    return createMockReport({
      reporterNetid: `reporter${i}`,
      reportedNetid: `reported${i}`,
      reason: reasons[i % reasons.length],
      status: statuses[i % statuses.length],
      description: `Test report description ${i} with enough characters to be valid.`,
      createdAt,
    });
  });
};

/**
 * Create multiple mock blocks with different data
 */
export const createMockBlocks = (count: number): BlockedUserDoc[] => {
  return Array.from({ length: count }, (_, i) => {
    const now = new Date();
    const createdAt = new Date(now.getTime() - i * 1000 * 60 * 60);

    return createMockBlock({
      blockerNetid: `blocker${i}`,
      blockedNetid: `blocked${i}`,
      createdAt,
    });
  });
};

/**
 * Create a mock admin document
 */
export const createMockAdmin = (overrides: any = {}) => ({
  uid: 'admin-uid-123',
  email: 'admin@cornell.edu',
  disabled: false,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

/**
 * Create a mock Firebase decoded token
 */
export const createMockDecodedToken = (overrides: any = {}) => ({
  uid: 'firebase-uid-123',
  email: 'test@cornell.edu',
  admin: false,
  ...overrides,
});

/**
 * Create a mock admin decoded token
 */
export const createMockAdminToken = (overrides: any = {}) => ({
  uid: 'admin-uid-123',
  email: 'admin@cornell.edu',
  admin: true,
  ...overrides,
});
