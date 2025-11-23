import express from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../firebaseAdmin';
import { AuthenticatedRequest, authenticateUser } from '../middleware/auth';
import { chatRateLimit } from '../middleware/rateLimiting';
import { areUsersBlocked, isUserBlocked } from '../services/blockingService';
import { createNotification } from '../services/notificationsService';
import {
  checkNotificationPreference,
  sendPushNotification,
} from '../services/pushNotificationService';

const router = express.Router();

/**
 * Helper function to get user's profile data
 */
const getUserProfile = async (firebaseUid: string) => {
  try {
    console.log(`🔍 Getting user profile for Firebase UID: ${firebaseUid}`);
    const userSnapshot = await db
      .collection('users')
      .where('firebaseUid', '==', firebaseUid)
      .get();

    if (userSnapshot.empty) {
      console.warn(`⚠️ No user found with Firebase UID: ${firebaseUid}`);
      return null;
    }

    const userData = userSnapshot.docs[0].data();
    const netid = userData.netid;
    console.log(`✅ Found user with netid: ${netid} for Firebase UID: ${firebaseUid}`);

    const profileSnapshot = await db
      .collection('profiles')
      .where('netid', '==', netid)
      .get();

    if (profileSnapshot.empty) {
      return {
        firebaseUid,
        netid,
        name: netid,
        image: null,
      };
    }

    const profileData = profileSnapshot.docs[0].data();
    const profile = {
      firebaseUid,
      netid,
      name: profileData.firstName || netid,
      image: profileData.pictures?.[0] || null,
    };
  } catch (error) {
    console.error('❌ Error getting user profile:', error);
    return null;
  }
};

/**
 * POST /api/chat/conversations
 * Create or get existing conversation between two users
 * Accepts either otherUserId (Firebase UID) or otherUserNetid (Cornell netid)
 */
router.post(
  '/api/chat/conversations',
  chatRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      let { otherUserId, otherUserNetid } = req.body;

      // Support both otherUserId and otherUserNetid
      if (!otherUserId && !otherUserNetid) {
        return res.status(400).json({
          error: 'Either otherUserId or otherUserNetid is required'
        });
      }

      // If otherUserNetid is provided, convert it to Firebase UID
      if (otherUserNetid && !otherUserId) {
        const { getFirebaseUidFromNetid } = await import('../middleware/authorization');
        otherUserId = await getFirebaseUidFromNetid(otherUserNetid);

        if (!otherUserId) {
          return res.status(404).json({
            error: 'User not found with provided netid'
          });
        }
      }

      const currentUserId = req.user.uid;

      // Don't allow conversation with self
      if (currentUserId === otherUserId) {
        return res
          .status(400)
          .json({ error: 'Cannot create conversation with yourself' });
      }

      // Check if conversation already exists (in either direction)
      const participantIds = [currentUserId, otherUserId].sort();
      const conversationsRef = db.collection('conversations');

      const existingConversation = await conversationsRef
        .where('participantIds', '==', participantIds)
        .limit(1)
        .get();

      if (!existingConversation.empty) {
        const conversationData = existingConversation.docs[0].data();
        return res.status(200).json({
          id: existingConversation.docs[0].id,
          ...conversationData,
        });
      }

      // Get both user profiles
      const [currentUserProfile, otherUserProfile] = await Promise.all([
        getUserProfile(currentUserId),
        getUserProfile(otherUserId),
      ]);

      if (!currentUserProfile || !otherUserProfile) {
        console.error('❌ Cannot create conversation - missing user profile(s)', {
          currentUserProfile: !!currentUserProfile,
          otherUserProfile: !!otherUserProfile,
        });
        return res.status(403).json({ error: 'Cannot create conversation' });
      }

      // Check if users have blocked each other
      const blocked = await areUsersBlocked(
        currentUserProfile.netid,
        otherUserProfile.netid
      );

      if (blocked) {
        console.log(
          `❌ Cannot create conversation - users are blocked: ${currentUserProfile.netid} and ${otherUserProfile.netid}`
        );
        return res.status(403).json({ error: 'Cannot create conversation' });
      }

      // Create new conversation
      const newConversation = {
        participantIds,
        participants: {
          [currentUserId]: {
            name: currentUserProfile.name,
            image: currentUserProfile.image,
            netid: currentUserProfile.netid,
          },
          [otherUserId]: {
            name: otherUserProfile.name,
            image: otherUserProfile.image,
            netid: otherUserProfile.netid,
          },
        },
        lastMessage: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      const conversationDoc = await conversationsRef.add(newConversation);

      res.status(201).json({
        id: conversationDoc.id,
        ...newConversation,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: errorMessage });
    }
  }
);

/**
 * GET /api/chat/conversations
 * Get all conversations for the authenticated user
 */
router.get(
  '/api/chat/conversations',
  chatRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const userId = req.user.uid;
      console.log(userId);
      const conversationsSnapshot = await db
        .collection('conversations')
        .where('participantIds', 'array-contains', userId)
        .orderBy('updatedAt', 'desc')
        .get();

      const conversations = conversationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json({ conversations });
    } catch (error) {
      console.error('Error getting conversations:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: errorMessage });
    }
  }
);

/**
 * POST /api/chat/messages
 * Send a message in a conversation
 */
router.post(
  '/api/chat/messages',
  chatRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { conversationId, text } = req.body;

      if (!conversationId || !text) {
        return res
          .status(400)
          .json({ error: 'conversationId and text are required' });
      }

      if (typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: 'Message text cannot be empty' });
      }

      if (text.length > 5000) {
        return res
          .status(400)
          .json({ error: 'Message text too long (max 5000 characters)' });
      }

      const userId = req.user.uid;

      // Verify user is participant in conversation
      const conversationRef = db
        .collection('conversations')
        .doc(conversationId);
      const conversationDoc = await conversationRef.get();

      if (!conversationDoc.exists) {
        console.error(`❌ Conversation ${conversationId} does not exist for user ${userId}`);
        return res
          .status(403)
          .json({ error: 'Cannot access this conversation' });
      }

      const conversationData = conversationDoc.data();
      if (!conversationData?.participantIds.includes(userId)) {
        console.error(`❌ User ${userId} is not a participant in conversation ${conversationId}`, {
          participantIds: conversationData?.participantIds,
        });
        return res
          .status(403)
          .json({ error: 'Cannot access this conversation' });
      }

      // Get netids from participant info to check blocking
      const senderInfo = conversationData.participants[userId];
      const recipientId = conversationData.participantIds.find(
        (id: string) => id !== userId
      );
      const recipientInfo = recipientId
        ? conversationData.participants[recipientId]
        : null;

      if (!senderInfo?.netid || !recipientInfo?.netid) {
        console.error(`❌ Missing participant netids in conversation ${conversationId}`);
        return res
          .status(403)
          .json({ error: 'Cannot send message to this conversation' });
      }

      // Check if users have blocked each other
      const blocked = await areUsersBlocked(
        senderInfo.netid,
        recipientInfo.netid
      );

      if (blocked) {
        console.log(
          `❌ Cannot send message - users are blocked: ${senderInfo.netid} and ${recipientInfo.netid}`
        );
        return res
          .status(403)
          .json({ error: 'Cannot send message to this user' });
      }

      // Create message
      const messageData = {
        text: text.trim(),
        senderId: userId,
        timestamp: FieldValue.serverTimestamp(),
        read: false,
        status: 'sent',
      };

      const messageRef = await conversationRef
        .collection('messages')
        .add(messageData);

      // Update conversation's lastMessage and updatedAt
      await conversationRef.update({
        lastMessage: {
          text: text.trim(),
          senderId: userId,
          timestamp: FieldValue.serverTimestamp(),
        },
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Send notification to recipient (async, don't block response)
      setImmediate(async () => {
        try {
          // Get recipient (the other user in the conversation)
          const recipientId = conversationData.participantIds.find(
            (id: string) => id !== userId
          );

          if (!recipientId) {
            console.warn('No recipient found for message notification');
            return;
          }

          // Get sender and recipient info
          const senderInfo = conversationData.participants[userId];
          const recipientInfo = conversationData.participants[recipientId];

          if (!senderInfo || !recipientInfo) {
            console.warn('Missing participant info for notifications');
            return;
          }

          const senderNetid = senderInfo.netid;
          const recipientNetid = recipientInfo.netid;

          // Check if sender is blocked by recipient
          const blocked = await isUserBlocked(senderNetid, recipientNetid);
          if (blocked) {
            console.log(
              `User ${senderNetid} is blocked by ${recipientNetid}, skipping notification`
            );
            return;
          }

          // Check notification preferences
          const prefEnabled = await checkNotificationPreference(
            recipientNetid,
            'newMessages'
          );

          if (!prefEnabled) {
            console.log(
              `User ${recipientNetid} has disabled new message notifications`
            );
            return;
          }

          // Create in-app notification
          await createNotification(
            recipientNetid,
            'new_message',
            `${senderInfo.name} sent you a message`,
            'Someone sent you a chat',
            {
              conversationId,
              senderId: userId,
              senderName: senderInfo.name,
              senderNetid,
            }
          );

          // Send push notification
          await sendPushNotification(
            recipientNetid,
            `${senderInfo.name} sent you a message`,
            'You have a new message', // Generic for privacy
            {
              type: 'new_message',
              conversationId,
              senderId: userId,
              senderName: senderInfo.name,
              senderNetid,
            }
          );

          console.log(
            `✅ Message notification sent to ${recipientNetid} from ${senderNetid}`
          );
        } catch (notifError) {
          console.error('Error sending message notification:', notifError);
          // Don't throw - notification failure shouldn't affect message delivery
        }
      });

      res.status(201).json({
        id: messageRef.id,
        ...messageData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: errorMessage });
    }
  }
);

/**
 * GET /api/chat/conversations/:conversationId/messages
 * Get messages for a conversation
 */
router.get(
  '/api/chat/conversations/:conversationId/messages',
  chatRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { conversationId } = req.params;
      const userId = req.user.uid;
      const limit = parseInt(req.query.limit as string) || 50;

      // Verify user is participant
      const conversationRef = db
        .collection('conversations')
        .doc(conversationId);
      const conversationDoc = await conversationRef.get();

      if (!conversationDoc.exists) {
        return res
          .status(403)
          .json({ error: 'Cannot access this conversation' });
      }

      const conversationData = conversationDoc.data();
      if (!conversationData?.participantIds.includes(userId)) {
        return res
          .status(403)
          .json({ error: 'Cannot access this conversation' });
      }

      // Get messages
      const messagesSnapshot = await conversationRef
        .collection('messages')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      const messages = messagesSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .reverse(); // Reverse to show oldest first

      res.status(200).json({ messages });
    } catch (error) {
      console.error('Error getting messages:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: errorMessage });
    }
  }
);

/**
 * PUT /api/chat/messages/:messageId/read
 * Mark a message as read
 */
router.put(
  '/api/chat/messages/:messageId/read',
  chatRateLimit,
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { messageId } = req.params;
      const { conversationId } = req.body;

      if (!conversationId) {
        return res.status(400).json({ error: 'conversationId is required' });
      }

      const userId = req.user.uid;

      // Verify user is participant
      const conversationRef = db
        .collection('conversations')
        .doc(conversationId);
      const conversationDoc = await conversationRef.get();

      if (!conversationDoc.exists) {
        return res
          .status(403)
          .json({ error: 'Cannot access this conversation' });
      }

      const conversationData = conversationDoc.data();
      if (!conversationData?.participantIds.includes(userId)) {
        return res
          .status(403)
          .json({ error: 'Cannot access this conversation' });
      }

      // Update message
      const messageRef = conversationRef.collection('messages').doc(messageId);
      const messageDoc = await messageRef.get();

      if (!messageDoc.exists) {
        return res.status(403).json({ error: 'Cannot access this message' });
      }

      await messageRef.update({
        read: true,
        status: 'read',
      });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error marking message as read:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: errorMessage });
    }
  }
);

export default router;
