import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import { getCurrentUser } from '../api/authService';
import { Conversation } from '../api/chatApi';

/**
 * Hook to listen to real-time conversation updates for the current user
 * @returns Object containing conversations array, loading state, and error
 */
export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
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
          const conversationsData: Conversation[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as Conversation));

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

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  return { conversations, loading, error };
};
