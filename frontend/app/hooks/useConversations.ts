import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import { getCurrentUser } from '../api/authService';
import { Conversation } from '../api/chatApi';

/**
 * Hook to listen to real-time conversation updates for the current user
 * Only listens when the chat screen is focused to reduce Firestore reads
 * @returns Object containing conversations array, loading state, and error
 */
export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
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
    if (!isActive) {
      // Don't listen when screen is not focused
      return;
    }

    const user = getCurrentUser();

    if (!user) {
      setError(new Error('User not authenticated'));
      setLoading(false);
      return;
    }

    const userId = user.uid;

    // Create Firestore query using React Native Firebase
    const unsubscribe = firestore()
      .collection('conversations')
      .where('participantIds', 'array-contains', userId)
      .orderBy('updatedAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const conversationsData: Conversation[] = snapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              }) as Conversation
          );

          setConversations(conversationsData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error listening to conversations:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

    // Cleanup listener on unmount or when screen loses focus
    return () => unsubscribe();
  }, [isActive]);

  return { conversations, loading, error };
};
