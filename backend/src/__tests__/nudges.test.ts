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
import nudgesRouter from '../routes/nudges';
import { NudgeDoc, WeeklyMatchDoc } from '../../types';

// Create express app for testing
const app = express();
app.use(express.json());
app.use(nudgesRouter);

// Mock data
const mockUser1 = {
  uid: 'test-firebase-uid-user1',
  email: 'user1@cornell.edu',
  netid: 'user1',
};

const mockUser2 = {
  uid: 'test-firebase-uid-user2',
  email: 'user2@cornell.edu',
  netid: 'user2',
};

const mockUser3 = {
  uid: 'test-firebase-uid-user3',
  email: 'user3@cornell.edu',
  netid: 'user3',
};

const promptId = '2025-W01';

describe('Nudges API', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: valid authentication for user1
    mockVerifyIdToken.mockResolvedValue({
      uid: mockUser1.uid,
      email: mockUser1.email,
    });
  });

  describe('POST /api/nudges', () => {
    it('should create a nudge from user to their match', async () => {
      // Mock user lookup
      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: mockUser1.netid }) }],
      };

      // Mock match snapshot (user1 matched with user2) - now using where query
      const mockMatchSnapshot = {
        empty: false,
        docs: [
          {
            data: () => ({
              netid: mockUser1.netid,
              promptId,
              matches: [mockUser2.netid, mockUser3.netid],
              revealed: [true, false],
              expiresAt: new Date(Date.now() + 86400000), // Tomorrow
            }),
          },
        ],
      };

      // Mock nudge doesn't exist yet
      const mockNudgeDoc = {
        exists: false,
      };

      // Mock reverse nudge doesn't exist
      const mockReverseNudgeDoc = {
        exists: false,
      };

      // Mock created nudge
      const mockCreatedNudge: NudgeDoc = {
        fromNetid: mockUser1.netid,
        toNetid: mockUser2.netid,
        promptId,
        mutual: false,
        createdAt: new Date(),
      };

      const mockSet = jest.fn().mockResolvedValue({});
      const mockGetDoc = jest
        .fn()
        .mockResolvedValueOnce(mockNudgeDoc)
        .mockResolvedValueOnce(mockReverseNudgeDoc)
        .mockResolvedValueOnce({ data: () => mockCreatedNudge });

      const mockDoc = jest.fn().mockReturnValue({
        get: mockGetDoc,
        set: mockSet,
      });

      // Mock for weeklyMatches where query
      const mockMatchWhere = jest.fn().mockReturnThis();
      const mockMatchLimit = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockMatchSnapshot),
      });

      const mockUserWhere = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockUserSnapshot),
      });

      (db.collection as jest.Mock).mockImplementation(
        (collectionName: string) => {
          if (collectionName === 'users') {
            return { where: mockUserWhere };
          }
          if (collectionName === 'weeklyMatches') {
            return {
              where: mockMatchWhere,
              limit: mockMatchLimit,
            };
          }
          return { doc: mockDoc };
        }
      );

      const response = await request(app)
        .post('/api/nudges')
        .set('Authorization', 'Bearer valid-token')
        .send({
          toNetid: mockUser2.netid,
          promptId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('fromNetid', mockUser1.netid);
      expect(response.body).toHaveProperty('toNetid', mockUser2.netid);
      expect(response.body).toHaveProperty('promptId', promptId);
      expect(response.body).toHaveProperty('mutual', false);
      expect(mockSet).toHaveBeenCalled();
    });

    it("should prevent nudging someone who isn't a match", async () => {
      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: mockUser1.netid }) }],
      };

      // Mock match snapshot where user3 is NOT in the matches
      const mockMatchSnapshot = {
        empty: false,
        docs: [
          {
            data: () => ({
              netid: mockUser1.netid,
              promptId,
              matches: [mockUser2.netid],
              revealed: [true],
              expiresAt: new Date(Date.now() + 86400000), // Tomorrow
            }),
          },
        ],
      };

      // Mock for weeklyMatches where query
      const mockMatchWhere = jest.fn().mockReturnThis();
      const mockMatchLimit = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockMatchSnapshot),
      });

      const mockUserWhere = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockUserSnapshot),
      });

      (db.collection as jest.Mock).mockImplementation(
        (collectionName: string) => {
          if (collectionName === 'users') {
            return { where: mockUserWhere };
          }
          if (collectionName === 'weeklyMatches') {
            return {
              where: mockMatchWhere,
              limit: mockMatchLimit,
            };
          }
          return {};
        }
      );

      const response = await request(app)
        .post('/api/nudges')
        .set('Authorization', 'Bearer valid-token')
        .send({
          toNetid: mockUser3.netid,
          promptId,
        })
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not matched');
    });

    it('should prevent nudging the same person twice', async () => {
      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: mockUser1.netid }) }],
      };

      const mockMatchSnapshot = {
        empty: false,
        docs: [
          {
            data: () => ({
              netid: mockUser1.netid,
              promptId,
              matches: [mockUser2.netid],
              revealed: [true],
              expiresAt: new Date(Date.now() + 86400000), // Tomorrow
            }),
          },
        ],
      };

      // Nudge already exists
      const mockNudgeDoc = {
        exists: true,
        data: () => ({
          fromNetid: mockUser1.netid,
          toNetid: mockUser2.netid,
          promptId,
          mutual: false,
          createdAt: new Date(),
        }),
      };

      const mockGetDoc = jest.fn().mockResolvedValue(mockNudgeDoc);

      const mockDoc = jest.fn().mockReturnValue({
        get: mockGetDoc,
      });

      // Mock for weeklyMatches where query
      const mockMatchWhere = jest.fn().mockReturnThis();
      const mockMatchLimit = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockMatchSnapshot),
      });

      const mockUserWhere = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockUserSnapshot),
      });

      (db.collection as jest.Mock).mockImplementation(
        (collectionName: string) => {
          if (collectionName === 'users') {
            return { where: mockUserWhere };
          }
          if (collectionName === 'weeklyMatches') {
            return {
              where: mockMatchWhere,
              limit: mockMatchLimit,
            };
          }
          return { doc: mockDoc };
        }
      );

      const response = await request(app)
        .post('/api/nudges')
        .set('Authorization', 'Bearer valid-token')
        .send({
          toNetid: mockUser2.netid,
          promptId,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already nudged');
    });

    // NOTE: Complex nudging scenarios (mutual nudges, notifications, chat unlocking)
    // are tested in integration tests: src/__tests__/integration/nudging.integration.test.ts
    // Unit tests with mocks were too brittle and are redundant with integration coverage.

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/nudges')
        .send({
          toNetid: mockUser2.netid,
          promptId,
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid matchId or toNetid', async () => {
      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: mockUser1.netid }) }],
      };

      const mockWhere = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockUserSnapshot),
      });

      (db.collection as jest.Mock).mockImplementation(
        (collectionName: string) => {
          if (collectionName === 'users') {
            return { where: mockWhere };
          }
          return {};
        }
      );

      // Missing toNetid
      const response1 = await request(app)
        .post('/api/nudges')
        .set('Authorization', 'Bearer valid-token')
        .send({
          promptId,
        })
        .expect(400);

      expect(response1.body).toHaveProperty('error');

      // Missing promptId
      const response2 = await request(app)
        .post('/api/nudges')
        .set('Authorization', 'Bearer valid-token')
        .send({
          toNetid: mockUser2.netid,
        })
        .expect(400);

      expect(response2.body).toHaveProperty('error');
    });
  });

  describe('GET /api/nudges/:promptId/:matchNetid/status', () => {
    it('should return nudge status for a match', async () => {
      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: mockUser1.netid }) }],
      };

      // User1 has nudged user2
      const mockSentNudgeDoc = {
        exists: true,
        data: () => ({
          fromNetid: mockUser1.netid,
          toNetid: mockUser2.netid,
          promptId,
          mutual: false,
        }),
      };

      // User2 has NOT nudged user1
      const mockReceivedNudgeDoc = {
        exists: false,
      };

      const mockGet = jest
        .fn()
        .mockResolvedValueOnce(mockSentNudgeDoc)
        .mockResolvedValueOnce(mockReceivedNudgeDoc);

      const mockDoc = jest.fn().mockReturnValue({
        get: mockGet,
      });

      const mockWhere = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockUserSnapshot),
      });

      (db.collection as jest.Mock).mockImplementation(
        (collectionName: string) => {
          if (collectionName === 'users') {
            return { where: mockWhere };
          }
          return { doc: mockDoc };
        }
      );

      const response = await request(app)
        .get(`/api/nudges/${promptId}/${mockUser2.netid}/status`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveProperty('sent', true);
      expect(response.body).toHaveProperty('received', false);
      expect(response.body).toHaveProperty('mutual', false);
    });

    it('should show hasNudged: true if current user nudged', async () => {
      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: mockUser1.netid }) }],
      };

      const mockSentNudgeDoc = {
        exists: true,
      };

      const mockReceivedNudgeDoc = {
        exists: false,
      };

      const mockGet = jest
        .fn()
        .mockResolvedValueOnce(mockSentNudgeDoc)
        .mockResolvedValueOnce(mockReceivedNudgeDoc);

      const mockDoc = jest.fn().mockReturnValue({
        get: mockGet,
      });

      const mockWhere = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockUserSnapshot),
      });

      (db.collection as jest.Mock).mockImplementation(
        (collectionName: string) => {
          if (collectionName === 'users') {
            return { where: mockWhere };
          }
          return { doc: mockDoc };
        }
      );

      const response = await request(app)
        .get(`/api/nudges/${promptId}/${mockUser2.netid}/status`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.sent).toBe(true);
    });

    it('should show receivedNudge: true if other user nudged', async () => {
      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: mockUser1.netid }) }],
      };

      const mockSentNudgeDoc = {
        exists: false,
      };

      const mockReceivedNudgeDoc = {
        exists: true,
      };

      const mockGet = jest
        .fn()
        .mockResolvedValueOnce(mockSentNudgeDoc)
        .mockResolvedValueOnce(mockReceivedNudgeDoc);

      const mockDoc = jest.fn().mockReturnValue({
        get: mockGet,
      });

      const mockWhere = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockUserSnapshot),
      });

      (db.collection as jest.Mock).mockImplementation(
        (collectionName: string) => {
          if (collectionName === 'users') {
            return { where: mockWhere };
          }
          return { doc: mockDoc };
        }
      );

      const response = await request(app)
        .get(`/api/nudges/${promptId}/${mockUser2.netid}/status`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.received).toBe(true);
    });

    it('should show isMutual: true when both nudged', async () => {
      const mockUserSnapshot = {
        empty: false,
        docs: [{ data: () => ({ netid: mockUser1.netid }) }],
      };

      const mockSentNudgeDoc = {
        exists: true,
        data: () => ({ mutual: true }),
      };

      const mockReceivedNudgeDoc = {
        exists: true,
        data: () => ({ mutual: true }),
      };

      const mockGet = jest
        .fn()
        .mockResolvedValueOnce(mockSentNudgeDoc)
        .mockResolvedValueOnce(mockReceivedNudgeDoc);

      const mockDoc = jest.fn().mockReturnValue({
        get: mockGet,
      });

      const mockWhere = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockUserSnapshot),
      });

      (db.collection as jest.Mock).mockImplementation(
        (collectionName: string) => {
          if (collectionName === 'users') {
            return { where: mockWhere };
          }
          return { doc: mockDoc };
        }
      );

      const response = await request(app)
        .get(`/api/nudges/${promptId}/${mockUser2.netid}/status`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.sent).toBe(true);
      expect(response.body.received).toBe(true);
      expect(response.body.mutual).toBe(true);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get(`/api/nudges/${promptId}/${mockUser2.netid}/status`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
