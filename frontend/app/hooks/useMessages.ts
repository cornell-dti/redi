import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import { Message } from '../api/chatApi';

/**
 * Hook to listen to real-time message updates for a conversation
 * Only listens when the chat detail screen is focused to reduce Firestore reads
 * @param conversationId - ID of the conversation to listen to
 * @param limit - Maximum number of messages to load (default 50)
 * @returns Object containing messages array, loading state, and error
 */
export const useMessages = (
  conversationId: string | null,
  limit: number = 50
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isActive, setIsActive] = useState(false);

  // Track screen focus
  useFocusEffect(
    useCallback(() => {
      setIsActive(true);
      return () => setIsActive(false);
    }, [])
  );

  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    if (!isActive) {
      // Don't listen when screen is not focused
      return;
    }

    // Create Firestore query using React Native Firebase
    const unsubscribe = firestore()
      .collection('conversations')
      .doc(conversationId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .limit(limit)
      .onSnapshot(
        (snapshot) => {
          const messagesData: Message[] = snapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              }) as Message
          );

          setMessages(messagesData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error listening to messages:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

    // Cleanup listener on unmount or when screen loses focus
    return () => unsubscribe();
  }, [conversationId, limit, isActive]);

  return { messages, loading, error };
};
