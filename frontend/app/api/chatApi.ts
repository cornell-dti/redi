import { getCurrentUser } from './authService';
import { API_BASE_URL } from '../../constants/constants';

/**
 * Gets the Firebase ID token for the current authenticated user
 * @returns Firebase ID token
 * @throws Error if user is not authenticated
 */
const getAuthToken = async (): Promise<string> => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const token = await user.getIdToken();
  return token;
};

export interface Conversation {
  id: string;
  participantIds: string[];
  participants: {
    [userId: string]: {
      name: string;
      image: string | null;
      netid: string;
      deleted?: boolean;
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

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
  read: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

/**
 * Create or get existing conversation with another user
 * @param otherUserId - Firebase UID of the other user
 * @returns Conversation object
 */
export const createOrGetConversation = async (
  otherUserId: string
): Promise<Conversation> => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/api/chat/conversations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ otherUserId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create conversation');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

/**
 * Create or get existing conversation with another user by their netid
 * @param otherUserNetid - Cornell netid of the other user
 * @returns Conversation object
 */
export const createOrGetConversationByNetid = async (
  otherUserNetid: string
): Promise<Conversation> => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/api/chat/conversations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ otherUserNetid }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create conversation');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

/**
 * Get all conversations for the current user
 * @returns Array of conversations
 */
export const getConversations = async (): Promise<Conversation[]> => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/api/chat/conversations`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch conversations');
    }

    const data = await response.json();
    return data.conversations;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};

/**
 * Send a message in a conversation
 * @param conversationId - ID of the conversation
 * @param text - Message text
 * @returns Created message object
 */
export const sendMessage = async (
  conversationId: string,
  text: string
): Promise<Message> => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/api/chat/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversationId, text }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send message');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Get messages for a conversation
 * @param conversationId - ID of the conversation
 * @param limit - Maximum number of messages to fetch (default 50)
 * @returns Array of messages
 */
export const getMessages = async (
  conversationId: string,
  limit: number = 50
): Promise<Message[]> => {
  try {
    const token = await getAuthToken();

    const response = await fetch(
      `${API_BASE_URL}/api/chat/conversations/${conversationId}/messages?limit=${limit}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch messages');
    }

    const data = await response.json();
    return data.messages;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

/**
 * Mark a message as read
 * @param conversationId - ID of the conversation
 * @param messageId - ID of the message
 */
export const markMessageAsRead = async (
  conversationId: string,
  messageId: string
): Promise<void> => {
  try {
    const token = await getAuthToken();

    const response = await fetch(
      `${API_BASE_URL}/api/chat/messages/${messageId}/read`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversationId }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to mark message as read');
    }
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};
