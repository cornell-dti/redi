// Mock Firebase Admin BEFORE importing anything else
const mockVerifyIdToken = jest.fn();
const mockAuth = {
  verifyIdToken: mockVerifyIdToken,
};
jest.mock('firebase-admin', () => {
  return {
    __esModule: true,
    default: {
      auth: () => mockAuth,
    },
    auth: () => mockAuth,
    firestore: {
      FieldValue: {
        serverTimestamp: () => ({ _methodName: 'serverTimestamp' }),
      },
    },
  };
});

import request from 'supertest';
import express from 'express';
import { db } from '../../firebaseAdmin';
import notificationsRouter from '../routes/notifications';
import nudgesRouter from '../routes/nudges';
import { NudgeDoc, NotificationDoc } from '../../types';

// Create express app for testing
const app = express();
app.use(express.json());
app.use(notificationsRouter);
app.use(nudgesRouter);

// Mock users
const userA = {
  uid: 'firebase-uid-a',
  email: 'usera@cornell.edu',
  netid: 'usera',
};

const userB = {
  uid: 'firebase-uid-b',
  email: 'userb@cornell.edu',
  netid: 'userb',
};

const promptId = '2025-W01';

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete nudge flow', () => {
    it('User A nudges User B → no notification sent', async () => {
      // Setup: User A authentication
      mockVerifyIdToken.mockResolvedValue({
        uid: userA.uid,
        email: userA.email,
      });

      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: userA.netid }) }],
      };

      const mockMatchDoc = {
        exists: true,
        data: () => ({
          netid: userA.netid,
          promptId,
          matches: [userB.netid],
          revealed: [true],
          chatUnlocked: [false],
        }),
      };

      const mockNudgeDoc = {
        exists: false,
      };

      const mockReverseNudgeDoc = {
        exists: false, // User B hasn't nudged yet
      };

      const mockCreatedNudge: NudgeDoc = {
        fromNetid: userA.netid,
        toNetid: userB.netid,
        promptId,
        mutual: false,
        createdAt: new Date(),
      };

      const mockSet = jest.fn().mockResolvedValue({});
      const mockAdd = jest.fn().mockResolvedValue({ id: 'notif-123' });

      const mockGet = jest.fn()
        .mockResolvedValueOnce(mockMatchDoc)
        .mockResolvedValueOnce(mockNudgeDoc)
        .mockResolvedValueOnce(mockReverseNudgeDoc)
        .mockResolvedValueOnce({ data: () => mockCreatedNudge });

      const mockDoc = jest.fn().mockReturnValue({
        get: mockGet,
        set: mockSet,
      });

      (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return {
            where: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue(mockUserSnapshot),
            }),
          };
        }
        if (collectionName === 'notifications') {
          return { add: mockAdd };
        }
        return { doc: mockDoc };
      });

      // User A sends nudge to User B
      const nudgeResponse = await request(app)
        .post('/api/nudges')
        .set('Authorization', 'Bearer token-a')
        .send({
          toNetid: userB.netid,
          promptId,
        })
        .expect(201);

      // Verify nudge was created but not mutual
      expect(nudgeResponse.body).toHaveProperty('mutual', false);

      // Verify NO notification was created
      expect(mockAdd).not.toHaveBeenCalled();
    });

    it('User B nudges User A → both get mutual nudge notification', async () => {
      // Setup: User B authentication
      mockVerifyIdToken.mockResolvedValue({
        uid: userB.uid,
        email: userB.email,
      });

      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: userB.netid }) }],
      };

      const mockMatchDoc = {
        exists: true,
        data: () => ({
          netid: userB.netid,
          promptId,
          matches: [userA.netid],
          revealed: [true],
          chatUnlocked: [false],
        }),
      };

      const mockNudgeDoc = {
        exists: false,
      };

      // User A has already nudged User B (reverse nudge exists)
      const mockReverseNudgeDoc = {
        exists: true,
        data: () => ({
          fromNetid: userA.netid,
          toNetid: userB.netid,
          promptId,
          mutual: false,
          createdAt: new Date(),
        }),
      };

      const mockMatchDocA = {
        exists: true,
        data: () => ({
          netid: userA.netid,
          promptId,
          matches: [userB.netid],
          chatUnlocked: [false],
        }),
      };

      const mockMatchDocB = {
        exists: true,
        data: () => ({
          netid: userB.netid,
          promptId,
          matches: [userA.netid],
          chatUnlocked: [false],
        }),
      };

      const mockCreatedNudge: NudgeDoc = {
        fromNetid: userB.netid,
        toNetid: userA.netid,
        promptId,
        mutual: true,
        createdAt: new Date(),
      };

      const mockSet = jest.fn().mockResolvedValue({});
      const mockUpdate = jest.fn().mockResolvedValue({});
      const mockAdd = jest.fn().mockResolvedValue({ id: 'notif-123' });

      let getCallCount = 0;
      const mockGet = jest.fn().mockImplementation(() => {
        getCallCount++;
        if (getCallCount === 1) return Promise.resolve(mockMatchDoc);
        if (getCallCount === 2) return Promise.resolve(mockNudgeDoc);
        if (getCallCount === 3) return Promise.resolve(mockReverseNudgeDoc);
        if (getCallCount === 4) return Promise.resolve(mockMatchDocB);
        if (getCallCount === 5) return Promise.resolve(mockMatchDocA);
        return Promise.resolve({ data: () => mockCreatedNudge });
      });

      const mockDoc = jest.fn().mockReturnValue({
        get: mockGet,
        set: mockSet,
        update: mockUpdate,
      });

      (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return {
            where: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue(mockUserSnapshot),
            }),
          };
        }
        if (collectionName === 'notifications') {
          return { add: mockAdd };
        }
        return { doc: mockDoc };
      });

      // User B sends nudge to User A
      const nudgeResponse = await request(app)
        .post('/api/nudges')
        .set('Authorization', 'Bearer token-b')
        .send({
          toNetid: userA.netid,
          promptId,
        })
        .expect(201);

      // Verify nudge is now mutual
      expect(nudgeResponse.body).toHaveProperty('mutual', true);

      // Verify notifications were created for BOTH users
      expect(mockAdd).toHaveBeenCalledTimes(2);

      // Verify both nudges were updated to mutual
      expect(mockUpdate).toHaveBeenCalledWith({ mutual: true });
    });

    it('Verify chat unlocked on match document', async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: userB.uid,
        email: userB.email,
      });

      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: userB.netid }) }],
      };

      const mockMatchDoc = {
        exists: true,
        data: () => ({
          netid: userB.netid,
          promptId,
          matches: [userA.netid],
          revealed: [true],
          chatUnlocked: [false],
        }),
      };

      const mockNudgeDoc = {
        exists: false,
      };

      const mockReverseNudgeDoc = {
        exists: true,
      };

      const mockMatchDocA = {
        exists: true,
        data: () => ({
          netid: userA.netid,
          promptId,
          matches: [userB.netid],
          chatUnlocked: [false],
        }),
      };

      const mockMatchDocB = {
        exists: true,
        data: () => ({
          netid: userB.netid,
          promptId,
          matches: [userA.netid],
          chatUnlocked: [false],
        }),
      };

      const mockCreatedNudge: NudgeDoc = {
        fromNetid: userB.netid,
        toNetid: userA.netid,
        promptId,
        mutual: true,
        createdAt: new Date(),
      };

      const mockSet = jest.fn().mockResolvedValue({});
      const mockMatchUpdate = jest.fn().mockResolvedValue({});
      const mockAdd = jest.fn().mockResolvedValue({ id: 'notif-123' });

      let getCallCount = 0;
      const mockGet = jest.fn().mockImplementation(() => {
        getCallCount++;
        if (getCallCount === 1) return Promise.resolve(mockMatchDoc);
        if (getCallCount === 2) return Promise.resolve(mockNudgeDoc);
        if (getCallCount === 3) return Promise.resolve(mockReverseNudgeDoc);
        if (getCallCount === 4) return Promise.resolve(mockMatchDocB);
        if (getCallCount === 5) return Promise.resolve(mockMatchDocA);
        return Promise.resolve({ data: () => mockCreatedNudge });
      });

      const mockDoc = jest.fn().mockReturnValue({
        get: mockGet,
        set: mockSet,
        update: jest.fn((data) => {
          if (data.chatUnlocked) {
            mockMatchUpdate(data);
          }
          return Promise.resolve({});
        }),
      });

      (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return {
            where: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue(mockUserSnapshot),
            }),
          };
        }
        if (collectionName === 'notifications') {
          return { add: mockAdd };
        }
        return { doc: mockDoc };
      });

      await request(app)
        .post('/api/nudges')
        .set('Authorization', 'Bearer token-b')
        .send({
          toNetid: userA.netid,
          promptId,
        })
        .expect(201);

      // Verify chatUnlocked was updated
      expect(mockMatchUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          chatUnlocked: expect.arrayContaining([true]),
        })
      );
    });

    it('Verify both notifications have correct data', async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: userB.uid,
        email: userB.email,
      });

      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: userB.netid }) }],
      };

      const mockMatchDoc = {
        exists: true,
        data: () => ({
          netid: userB.netid,
          promptId,
          matches: [userA.netid],
          revealed: [true],
          chatUnlocked: [false],
        }),
      };

      const mockNudgeDoc = {
        exists: false,
      };

      const mockReverseNudgeDoc = {
        exists: true,
      };

      const mockMatchDocA = {
        exists: true,
        data: () => ({
          netid: userA.netid,
          promptId,
          matches: [userB.netid],
          chatUnlocked: [false],
        }),
      };

      const mockMatchDocB = {
        exists: true,
        data: () => ({
          netid: userB.netid,
          promptId,
          matches: [userA.netid],
          chatUnlocked: [false],
        }),
      };

      const mockCreatedNudge: NudgeDoc = {
        fromNetid: userB.netid,
        toNetid: userA.netid,
        promptId,
        mutual: true,
        createdAt: new Date(),
      };

      const mockSet = jest.fn().mockResolvedValue({});
      const mockUpdate = jest.fn().mockResolvedValue({});
      const mockAdd = jest.fn().mockResolvedValue({ id: 'notif-123' });

      let getCallCount = 0;
      const mockGet = jest.fn().mockImplementation(() => {
        getCallCount++;
        if (getCallCount === 1) return Promise.resolve(mockMatchDoc);
        if (getCallCount === 2) return Promise.resolve(mockNudgeDoc);
        if (getCallCount === 3) return Promise.resolve(mockReverseNudgeDoc);
        if (getCallCount === 4) return Promise.resolve(mockMatchDocB);
        if (getCallCount === 5) return Promise.resolve(mockMatchDocA);
        return Promise.resolve({ data: () => mockCreatedNudge });
      });

      const mockDoc = jest.fn().mockReturnValue({
        get: mockGet,
        set: mockSet,
        update: mockUpdate,
      });

      (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return {
            where: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue(mockUserSnapshot),
            }),
          };
        }
        if (collectionName === 'notifications') {
          return { add: mockAdd };
        }
        return { doc: mockDoc };
      });

      await request(app)
        .post('/api/nudges')
        .set('Authorization', 'Bearer token-b')
        .send({
          toNetid: userA.netid,
          promptId,
        })
        .expect(201);

      // Verify notification structure for both users
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'mutual_nudge',
          title: expect.stringContaining('nudged each other'),
          metadata: expect.objectContaining({
            promptId,
            matchNetid: expect.any(String),
          }),
        })
      );
    });
  });

  describe('Notification lifecycle', () => {
    it('Create notification → verify it appears in list', async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: userA.uid,
        email: userA.email,
      });

      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: userA.netid }) }],
      };

      const mockNotification: NotificationDoc = {
        netid: userA.netid,
        type: 'mutual_nudge',
        title: 'You both nudged each other! 🎉',
        message: 'Start chatting now',
        read: false,
        metadata: {
          promptId,
          matchNetid: userB.netid,
        },
        createdAt: new Date(),
      };

      const mockNotifDocs = [
        {
          id: 'notif-1',
          data: () => mockNotification,
        },
      ];

      const mockNotifSnapshot = {
        docs: mockNotifDocs,
      };

      const mockOrderBy = jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockNotifSnapshot),
        }),
      });

      let whereCallCount = 0;
      const mockWhere = jest.fn().mockImplementation(() => {
        whereCallCount++;
        if (whereCallCount === 1) {
          return {
            get: jest.fn().mockResolvedValue(mockUserSnapshot),
          };
        } else {
          return {
            where: jest.fn().mockReturnValue({
              orderBy: mockOrderBy,
            }),
          };
        }
      });

      (db.collection as jest.Mock).mockImplementation(() => {
        return { where: mockWhere };
      });

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', 'Bearer token-a')
        .expect(200);

      // Verify notification appears in list
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('id', 'notif-1');
      expect(response.body[0]).toHaveProperty('netid', userA.netid);
      expect(response.body[0]).toHaveProperty('read', false);
    });

    it('Mark as read → verify unread count decreases', async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: userA.uid,
        email: userA.email,
      });

      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: userA.netid }) }],
      };

      // Initially 2 unread notifications
      const mockInitialCount = {
        size: 2,
      };

      // After marking one as read, 1 unread notification
      const mockAfterCount = {
        size: 1,
      };

      const mockNotificationDoc = {
        exists: true,
        data: () => ({
          netid: userA.netid,
          type: 'mutual_nudge',
          title: 'Test',
          message: 'Test',
          read: false,
          metadata: {},
          createdAt: new Date(),
        }),
      };

      const mockUpdate = jest.fn().mockResolvedValue({});

      let countCallIndex = 0;
      const mockWhere = jest.fn().mockImplementation((field: string) => {
        if (field === 'firebaseUid') {
          return {
            get: jest.fn().mockResolvedValue(mockUserSnapshot),
          };
        }
        countCallIndex++;
        return {
          where: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue(
                countCallIndex === 1 ? mockInitialCount : mockAfterCount
              ),
            }),
          }),
        };
      });

      const mockDoc = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockNotificationDoc),
        update: mockUpdate,
      });

      (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return { where: mockWhere };
        }
        if (collectionName === 'notifications') {
          return { doc: mockDoc, where: mockWhere };
        }
        return {};
      });

      // Get initial unread count
      const countBefore = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', 'Bearer token-a')
        .expect(200);

      expect(countBefore.body.count).toBe(2);

      // Mark one notification as read
      await request(app)
        .put('/api/notifications/notif-1/read')
        .set('Authorization', 'Bearer token-a')
        .expect(200);

      // Get unread count after marking as read
      const countAfter = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', 'Bearer token-a')
        .expect(200);

      expect(countAfter.body.count).toBe(1);
    });

    it('Mark all as read → verify all marked and count is 0', async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: userA.uid,
        email: userA.email,
      });

      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: userA.netid }) }],
      };

      const mockNotifSnapshot = {
        docs: [
          { ref: { update: jest.fn() } },
          { ref: { update: jest.fn() } },
          { ref: { update: jest.fn() } },
        ],
        size: 3,
      };

      const mockCommit = jest.fn().mockResolvedValue({});
      const mockBatch = jest.fn().mockReturnValue({
        update: jest.fn(),
        commit: mockCommit,
      });

      const mockCountAfter = {
        size: 0,
      };

      let callIndex = 0;
      const mockWhere = jest.fn().mockImplementation((field: string) => {
        callIndex++;
        if (field === 'firebaseUid') {
          return {
            get: jest.fn().mockResolvedValue(mockUserSnapshot),
          };
        }
        if (callIndex <= 2) {
          return {
            where: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue(mockNotifSnapshot),
            }),
          };
        } else {
          return {
            where: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue(mockCountAfter),
              }),
            }),
          };
        }
      });

      (db.collection as jest.Mock).mockImplementation(() => {
        return { where: mockWhere };
      });
      (db as any).batch = mockBatch;

      // Mark all as read
      const markAllResponse = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', 'Bearer token-a')
        .expect(200);

      expect(markAllResponse.body.count).toBe(3);
      expect(mockCommit).toHaveBeenCalled();

      // Verify unread count is now 0
      const countResponse = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', 'Bearer token-a')
        .expect(200);

      expect(countResponse.body.count).toBe(0);
    });

    it('Verify 30-day expiry (notifications older than 30 days don\'t appear)', async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: userA.uid,
        email: userA.email,
      });

      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: userA.netid }) }],
      };

      const now = new Date();
      const twentyNineDaysAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
      const thirtyOneDaysAgo = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);

      // Only recent notification should appear
      const mockNotifDocs = [
        {
          id: 'notif-recent',
          data: () => ({
            netid: userA.netid,
            type: 'mutual_nudge',
            title: 'Recent',
            message: 'Recent notification',
            read: false,
            metadata: {},
            createdAt: twentyNineDaysAgo,
          }),
        },
      ];

      const mockNotifSnapshot = {
        docs: mockNotifDocs,
      };

      const mockOrderBy = jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockNotifSnapshot),
        }),
      });

      let whereCallCount = 0;
      const mockWhere = jest.fn().mockImplementation((field: string, op: string, value: any) => {
        whereCallCount++;
        if (whereCallCount === 1) {
          return {
            get: jest.fn().mockResolvedValue(mockUserSnapshot),
          };
        } else if (field === 'createdAt') {
          // Verify 30-day filter is being applied
          expect(op).toBe('>=');
          expect(value).toBeInstanceOf(Date);
          return {
            orderBy: mockOrderBy,
          };
        } else {
          return {
            where: mockWhere,
          };
        }
      });

      (db.collection as jest.Mock).mockImplementation(() => {
        return { where: mockWhere };
      });

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', 'Bearer token-a')
        .expect(200);

      // Only recent notification should appear
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe('notif-recent');

      // Verify old notification is not included
      const notifIds = response.body.map((n: any) => n.id);
      expect(notifIds).not.toContain('notif-old');
    });
  });
});
