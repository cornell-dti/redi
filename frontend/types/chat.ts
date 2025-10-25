// =============================================================================
// CHAT & MESSAGING TYPES
// =============================================================================

export interface ChatMessage {
  id: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

export interface ChatConversation {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  image: string;
  online: boolean;
}

// Firestore types
export interface FirestoreMessage {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
  read: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

export interface FirestoreConversation {
  id: string;
  participantIds: string[];
  participants: {
    [userId: string]: {
      name: string;
      image: string | null;
      netid: string;
    };
  };
  lastMessage: {
    text: string;
    senderId: string;
    timestamp: any;
  } | null;
  createdAt: any;
  updatedAt: any;
}
