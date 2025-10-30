/**
 * Mock Firestore utilities for testing
 * Provides helpers to mock Firestore operations and query chains
 */

export interface MockQuerySnapshot {
  empty: boolean;
  size: number;
  docs: Array<{
    id: string;
    data: () => any;
    exists: boolean;
  }>;
  forEach: (callback: (doc: any) => void) => void;
}

export interface MockDocumentSnapshot {
  id: string;
  exists: boolean;
  data: () => any;
}

/**
 * Creates a mock Firestore document snapshot
 */
export const createMockDocSnapshot = (
  id: string,
  data: any | null
): MockDocumentSnapshot => ({
  id,
  exists: data !== null,
  data: () => data,
});

/**
 * Creates a mock Firestore query snapshot
 */
export const createMockQuerySnapshot = (
  docs: Array<{ id: string; data: any }>
): MockQuerySnapshot => {
  const mockDocs = docs.map((doc) => ({
    id: doc.id,
    data: () => doc.data,
    exists: true,
  }));

  return {
    empty: docs.length === 0,
    size: docs.length,
    docs: mockDocs,
    forEach: (callback: (doc: any) => void) => {
      mockDocs.forEach(callback);
    },
  };
};

/**
 * Creates a mock Firestore collection reference with query chains
 */
export const createMockCollection = () => {
  const mockCollection: any = {
    doc: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn(),
    add: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  return mockCollection;
};

/**
 * Creates a mock Firestore database with collection method
 */
export const createMockDb = () => {
  const collections = new Map<string, any>();

  const mockDb = {
    collection: jest.fn((name: string) => {
      if (!collections.has(name)) {
        collections.set(name, createMockCollection());
      }
      return collections.get(name);
    }),
    _collections: collections, // For test inspection
  };

  return mockDb;
};

/**
 * Helper to set up a mock document reference for reading
 */
export const mockDocGet = (docRef: any, snapshot: MockDocumentSnapshot) => {
  docRef.get.mockResolvedValue(snapshot);
  return docRef;
};

/**
 * Helper to set up a mock collection query for reading
 */
export const mockCollectionGet = (
  collectionRef: any,
  snapshot: MockQuerySnapshot
) => {
  collectionRef.get.mockResolvedValue(snapshot);
  return collectionRef;
};

/**
 * Helper to set up a mock add operation
 */
export const mockCollectionAdd = (collectionRef: any, docId: string) => {
  const docRef = {
    id: docId,
    get: jest.fn(),
  };
  collectionRef.add.mockResolvedValue(docRef);
  return docRef;
};
