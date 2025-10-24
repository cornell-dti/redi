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
import { NotificationDoc } from '../../types';

// Create express app for testing
const app = express();
app.use(express.json());
app.use(notificationsRouter);

// Mock data
const mockUser = {
  uid: 'test-firebase-uid-123',
  email: 'test@cornell.edu',
  netid: 'test123',
};

const mockUser2 = {
  uid: 'test-firebase-uid-456',
  email: 'test2@cornell.edu',
  netid: 'test456',
};

const mockNotifications: Array<{ id: string; data: NotificationDoc }> = [
  {
    id: 'notif-1',
    data: {
      netid: 'test123',
      type: 'mutual_nudge',
      title: 'You both nudged each other! 🎉',
      message: 'Start chatting now',
      read: false,
      metadata: {
        promptId: '2025-W01',
        matchNetid: 'match123',
      },
      createdAt: new Date('2025-10-20T10:00:00Z'),
    },
  },
  {
    id: 'notif-2',
    data: {
      netid: 'test123',
      type: 'mutual_nudge',
      title: 'You both nudged each other! 🎉',
      message: 'Start chatting now',
      read: true,
      metadata: {
        promptId: '2025-W01',
        matchNetid: 'match456',
      },
      createdAt: new Date('2025-10-19T10:00:00Z'),
    },
  },
  {
    id: 'notif-3',
    data: {
      netid: 'test123',
      type: 'mutual_nudge',
      title: 'You both nudged each other! 🎉',
      message: 'Start chatting now',
      read: false,
      metadata: {
        promptId: '2025-W01',
        matchNetid: 'match789',
      },
      createdAt: new Date('2025-10-18T10:00:00Z'),
    },
  },
  {
    id: 'notif-old',
    data: {
      netid: 'test123',
      type: 'mutual_nudge',
      title: 'Old notification',
      message: 'This is more than 30 days old',
      read: false,
      metadata: {
        promptId: '2024-W01',
        matchNetid: 'oldmatch',
      },
      createdAt: new Date('2024-09-01T10:00:00Z'),
    },
  },
];

describe('Notifications API', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: valid authentication
    mockVerifyIdToken.mockResolvedValue({
      uid: mockUser.uid,
      email: mockUser.email,
    });
  });

  describe('GET /api/notifications', () => {
    it('should return notifications for authenticated user', async () => {
      // Mock user lookup
      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: mockUser.netid }) }],
      };

      // Mock notifications query
      const mockNotifDocs = mockNotifications
        .slice(0, 3)
        .map((notif) => ({
          id: notif.id,
          data: () => notif.data,
        }));

      const mockNotifSnapshot = {
        docs: mockNotifDocs,
      };

      const mockOrderBy = jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockNotifSnapshot),
        }),
      });

      const mockWhereChain = jest.fn().mockReturnValue({
        orderBy: mockOrderBy,
      });

      const mockUserWhere = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockUserSnapshot),
      });

      const mockNotifWhere = jest.fn().mockReturnValue({
        where: mockWhereChain,
      });

      (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return { where: mockUserWhere };
        }
        if (collectionName === 'notifications') {
          return { where: mockNotifWhere };
        }
        return {};
      });

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('netid', mockUser.netid);
      expect(response.body[0]).toHaveProperty('type');
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('read');
    });

    it('should only return user\'s own notifications (not others\')', async () => {
      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: mockUser.netid }) }],
      };

      const mockNotifDocs = mockNotifications
        .filter((notif) => notif.data.netid === mockUser.netid)
        .map((notif) => ({
          id: notif.id,
          data: () => notif.data,
        }));

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
          // First call: users collection query
          return {
            get: jest.fn().mockResolvedValue(mockUserSnapshot),
          };
        } else {
          // Subsequent calls: notifications collection queries
          return {
            where: jest.fn().mockReturnValue({
              orderBy: mockOrderBy,
            }),
          };
        }
      });

      (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
        return { where: mockWhere };
      });

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      // Verify the query included netid filter
      expect(mockWhere).toHaveBeenCalledWith('firebaseUid', '==', mockUser.uid);
      expect(mockWhere).toHaveBeenCalledWith('netid', '==', mockUser.netid);

      // Verify all notifications belong to the user
      response.body.forEach((notification: any) => {
        expect(notification.netid).toBe(mockUser.netid);
      });
    });

    it('should return notifications from last 30 days only', async () => {
      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: mockUser.netid }) }],
      };

      const recentNotifications = mockNotifications
        .slice(0, 3)
        .map((notif) => ({
          id: notif.id,
          data: () => notif.data,
        }));

      const mockNotifSnapshot = {
        docs: recentNotifications,
      };

      const mockOrderBy = jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockNotifSnapshot),
        }),
      });

      let whereCallCount = 0;
      const mockWhere = jest.fn().mockImplementation((field: string) => {
        whereCallCount++;
        if (whereCallCount === 1) {
          return {
            get: jest.fn().mockResolvedValue(mockUserSnapshot),
          };
        } else if (field === 'createdAt') {
          // Check that 30-day filter is applied
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
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      // Verify createdAt filter was applied
      expect(mockWhere).toHaveBeenCalledWith('createdAt', '>=', expect.any(Date));

      // Verify old notification is not included
      const notifIds = response.body.map((n: any) => n.id);
      expect(notifIds).not.toContain('notif-old');
    });

    it('should respect the limit parameter', async () => {
      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: mockUser.netid }) }],
      };

      const mockLimit = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: [] }),
      });

      const mockOrderBy = jest.fn().mockReturnValue({
        limit: mockLimit,
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

      await request(app)
        .get('/api/notifications?limit=10')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      // Verify limit was applied
      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should order by createdAt descending (newest first)', async () => {
      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: mockUser.netid }) }],
      };

      const mockNotifDocs = mockNotifications
        .slice(0, 3)
        .map((notif) => ({
          id: notif.id,
          data: () => notif.data,
        }));

      const mockNotifSnapshot = {
        docs: mockNotifDocs,
      };

      const mockLimit = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockNotifSnapshot),
      });

      const mockOrderBy = jest.fn().mockReturnValue({
        limit: mockLimit,
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
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      // Verify orderBy was called with correct parameters
      expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');

      // Verify response is ordered by date (newest first)
      const dates = response.body.map((n: any) => new Date(n.createdAt).getTime());
      const sortedDates = [...dates].sort((a, b) => b - a);
      expect(dates).toEqual(sortedDates);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('should return correct count of unread notifications', async () => {
      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: mockUser.netid }) }],
      };

      const unreadNotifications = mockNotifications
        .filter((n) => !n.data.read && n.data.netid === mockUser.netid)
        .slice(0, 2);

      const mockNotifSnapshot = {
        size: unreadNotifications.length,
      };

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
              where: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue(mockNotifSnapshot),
              }),
            }),
          };
        }
      });

      (db.collection as jest.Mock).mockImplementation(() => {
        return { where: mockWhere };
      });

      const response = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveProperty('count', 2);
    });

    it('should only count unread notifications (read: false)', async () => {
      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: mockUser.netid }) }],
      };

      const mockNotifSnapshot = {
        size: 2,
      };

      const mockWhereRead = jest.fn();
      const mockWhereCreatedAt = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockNotifSnapshot),
      });

      const mockWhereNetid = jest.fn().mockImplementation((field: string) => {
        if (field === 'read') {
          mockWhereRead(field, '==', false);
          return {
            where: mockWhereCreatedAt,
          };
        }
        return {
          where: mockWhereCreatedAt,
        };
      });

      const mockUserWhere = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockUserSnapshot),
      });

      const mockNotifWhere = jest.fn().mockReturnValue({
        where: mockWhereNetid,
      });

      (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return { where: mockUserWhere };
        }
        if (collectionName === 'notifications') {
          return { where: mockNotifWhere };
        }
        return {};
      });

      await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      // Verify read filter was applied
      expect(mockWhereRead).toHaveBeenCalledWith('read', '==', false);
    });

    it('should only count notifications from last 30 days', async () => {
      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: mockUser.netid }) }],
      };

      const mockNotifSnapshot = {
        size: 2,
      };

      const mockWhereCreatedAtTracker = jest.fn();

      // Third where call (createdAt)
      const mockWhere3 = jest.fn().mockImplementation((field: string, op: string, value: any) => {
        if (field === 'createdAt') {
          mockWhereCreatedAtTracker(field, op, value);
        }
        return {
          get: jest.fn().mockResolvedValue(mockNotifSnapshot),
        };
      });

      // Second where call (read)
      const mockWhere2 = jest.fn().mockReturnValue({
        where: mockWhere3,
      });

      // First where call (netid)
      const mockWhere1 = jest.fn().mockReturnValue({
        where: mockWhere2,
      });

      const mockUserWhere = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockUserSnapshot),
      });

      (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return { where: mockUserWhere };
        }
        if (collectionName === 'notifications') {
          return { where: mockWhere1 };
        }
        return {};
      });

      await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      // Verify createdAt filter was applied
      expect(mockWhereCreatedAtTracker).toHaveBeenCalledWith('createdAt', '>=', expect.any(Date));
    });

    it('should return 0 when no unread notifications', async () => {
      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: mockUser.netid }) }],
      };

      const mockNotifSnapshot = {
        size: 0,
      };

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
              where: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue(mockNotifSnapshot),
              }),
            }),
          };
        }
      });

      (db.collection as jest.Mock).mockImplementation(() => {
        return { where: mockWhere };
      });

      const response = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveProperty('count', 0);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/notifications/unread-count')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const notificationId = 'notif-1';

      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: mockUser.netid }) }],
      };

      const mockNotificationDoc = {
        exists: true,
        data: () => mockNotifications[0].data,
      };

      const mockUpdate = jest.fn().mockResolvedValue({});
      const mockDoc = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockNotificationDoc),
        update: mockUpdate,
      });

      const mockWhere = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockUserSnapshot),
      });

      (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return { where: mockWhere };
        }
        if (collectionName === 'notifications') {
          return { doc: mockDoc };
        }
        return {};
      });

      const response = await request(app)
        .put(`/api/notifications/${notificationId}/read`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(mockUpdate).toHaveBeenCalledWith({ read: true });
    });

    it('should only allow marking own notifications as read', async () => {
      const notificationId = 'notif-other-user';

      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: mockUser.netid }) }],
      };

      const mockNotificationDoc = {
        exists: true,
        data: () => ({
          ...mockNotifications[0].data,
          netid: mockUser2.netid, // Different user's notification
        }),
      };

      const mockDoc = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockNotificationDoc),
      });

      const mockWhere = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockUserSnapshot),
      });

      (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return { where: mockWhere };
        }
        if (collectionName === 'notifications') {
          return { doc: mockDoc };
        }
        return {};
      });

      const response = await request(app)
        .put(`/api/notifications/${notificationId}/read`)
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Unauthorized');
    });

    it('should return 404 for non-existent notification', async () => {
      const notificationId = 'non-existent';

      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: mockUser.netid }) }],
      };

      const mockNotificationDoc = {
        exists: false,
      };

      const mockDoc = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockNotificationDoc),
      });

      const mockWhere = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockUserSnapshot),
      });

      (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return { where: mockWhere };
        }
        if (collectionName === 'notifications') {
          return { doc: mockDoc };
        }
        return {};
      });

      const response = await request(app)
        .put(`/api/notifications/${notificationId}/read`)
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .put('/api/notifications/notif-1/read')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    it('should mark all user\'s notifications as read', async () => {
      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: mockUser.netid }) }],
      };

      const unreadNotifs = mockNotifications
        .filter((n) => !n.data.read)
        .map((notif) => ({
          id: notif.id,
          ref: { update: jest.fn() },
        }));

      const mockNotifSnapshot = {
        docs: unreadNotifs,
        size: unreadNotifs.length,
      };

      const mockCommit = jest.fn().mockResolvedValue({});
      const mockBatch = jest.fn().mockReturnValue({
        update: jest.fn(),
        commit: mockCommit,
      });

      const mockWhere = jest.fn()
        .mockReturnValueOnce({
          get: jest.fn().mockResolvedValue(mockUserSnapshot),
        })
        .mockReturnValueOnce({
          where: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue(mockNotifSnapshot),
          }),
        });

      (db.collection as jest.Mock).mockImplementation(() => {
        return { where: mockWhere };
      });
      (db as any).batch = mockBatch;

      const response = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('count', unreadNotifs.length);
      expect(mockCommit).toHaveBeenCalled();
    });

    it('should return count of notifications marked', async () => {
      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: mockUser.netid }) }],
      };

      const mockNotifSnapshot = {
        docs: [],
        size: 3,
      };

      const mockCommit = jest.fn().mockResolvedValue({});
      const mockBatch = jest.fn().mockReturnValue({
        update: jest.fn(),
        commit: mockCommit,
      });

      const mockWhere = jest.fn()
        .mockReturnValueOnce({
          get: jest.fn().mockResolvedValue(mockUserSnapshot),
        })
        .mockReturnValueOnce({
          where: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue(mockNotifSnapshot),
          }),
        });

      (db.collection as jest.Mock).mockImplementation(() => {
        return { where: mockWhere };
      });
      (db as any).batch = mockBatch;

      const response = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.count).toBe(3);
    });

    it('should only affect current user\'s notifications', async () => {
      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: mockUser.netid }) }],
      };

      const mockNotifSnapshot = {
        docs: [],
        size: 2,
      };

      const mockCommit = jest.fn().mockResolvedValue({});
      const mockBatch = jest.fn().mockReturnValue({
        update: jest.fn(),
        commit: mockCommit,
      });

      const mockWhere = jest.fn()
        .mockReturnValueOnce({
          get: jest.fn().mockResolvedValue(mockUserSnapshot),
        })
        .mockReturnValueOnce({
          where: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue(mockNotifSnapshot),
          }),
        });

      (db.collection as jest.Mock).mockImplementation(() => {
        return { where: mockWhere };
      });
      (db as any).batch = mockBatch;

      await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      // Verify netid filter was applied
      expect(mockWhere).toHaveBeenCalledWith('netid', '==', mockUser.netid);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .put('/api/notifications/read-all')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
