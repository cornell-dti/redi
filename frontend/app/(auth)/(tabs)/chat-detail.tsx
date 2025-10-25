import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Heart,
  MoreVertical,
  Plus,
  Send,
  Video,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser } from '../../api/authService';
import {
  createOrGetConversation,
  sendMessage as sendMessageAPI,
} from '../../api/chatApi';
import { AppColors } from '../../components/AppColors';
import { useMessages } from '../../hooks/useMessages';

// Mock chat messages
const mockMessages = [
  {
    id: '1',
    text: 'Hey! How are you doing?',
    timestamp: new Date(Date.now() - 3600000),
    isOwn: false,
  },
  {
    id: '2',
    text: "Hi there! I'm doing great, thanks for asking! How about you?",
    timestamp: new Date(Date.now() - 3580000),
    isOwn: true,
  },
  {
    id: '3',
    text: "Pretty good! I saw you're in CS too. What year are you?",
    timestamp: new Date(Date.now() - 3560000),
    isOwn: false,
  },
  {
    id: '4',
    text: "I'm a junior! What about you?",
    timestamp: new Date(Date.now() - 3540000),
    isOwn: true,
  },
  {
    id: '5',
    text: 'Same here! Have you taken CS 4820 yet?',
    timestamp: new Date(Date.now() - 3520000),
    isOwn: false,
  },
  {
    id: '6',
    text: 'Yes, I took it last semester. Really challenging but fun!',
    timestamp: new Date(Date.now() - 3500000),
    isOwn: true,
  },
  {
    id: '7',
    text: "Want to grab coffee at CTB this weekend? I'd love to hear more about your experience with the class",
    timestamp: new Date(Date.now() - 120000),
    isOwn: false,
  },
];

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
}

export default function ChatDetailScreen() {
  const {
    conversationId: routeConversationId,
    userId,
    name,
  } = useLocalSearchParams();
  const [conversationId, setConversationId] = useState<string | null>(
    (routeConversationId as string) || null
  );
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const currentUser = getCurrentUser();
  const flatListRef = useRef<FlatList>(null);

  const { messages: firebaseMessages, loading } = useMessages(conversationId);

  // Create conversation if it doesn't exist
  useEffect(() => {
    const initConversation = async () => {
      if (!conversationId && userId && currentUser) {
        try {
          const conv = await createOrGetConversation(userId as string);
          setConversationId(conv.id);
        } catch (error) {
          console.error('Error creating conversation:', error);
        }
      }
    };
    initConversation();
  }, [conversationId, userId, currentUser]);

  // Transform Firebase messages to display format
  const displayMessages: Message[] = firebaseMessages.map((msg) => ({
    id: msg.id,
    text: msg.text,
    timestamp: msg.timestamp?.toDate?.() || new Date(),
    isOwn: msg.senderId === currentUser?.uid,
  }));

  const sendMessage = async () => {
    if (newMessage.trim() && conversationId) {
      const messageText = newMessage.trim();
      setNewMessage('');
      setSending(true);

      try {
        await sendMessageAPI(conversationId, messageText);
        // Message will be added via real-time listener
        // Scroll to bottom after send
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (error) {
        console.error('Error sending message:', error);
        // Restore message if failed
        setNewMessage(messageText);
      } finally {
        setSending(false);
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.isOwn ? styles.ownMessageContainer : styles.otherMessageContainer,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          item.isOwn ? styles.ownMessageBubble : styles.otherMessageBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.isOwn ? styles.ownMessageText : styles.otherMessageText,
          ]}
        >
          {item.text}
        </Text>
      </View>
      <Text
        style={[
          styles.messageTime,
          item.isOwn ? styles.ownMessageTime : styles.otherMessageTime,
        ]}
      >
        {formatTime(item.timestamp)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={AppColors.foregroundDefault} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
            }}
            style={styles.headerAvatar}
          />
          <View style={styles.headerText}>
            <Text style={styles.headerName}>{name}</Text>
            <Text style={styles.headerStatus}>Active now</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerAction}>
            <Video size={24} color={AppColors.foregroundDimmer} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction}>
            <MoreVertical size={24} color={AppColors.foregroundDimmer} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages List */}
      {loading ? (
        <View
          style={[
            styles.messagesList,
            { justifyContent: 'center', alignItems: 'center' },
          ]}
        >
          <ActivityIndicator size="large" color={AppColors.accentDefault} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={displayMessages.length > 0 ? displayMessages : mockMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          inverted={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />
      )}

      {/* Message Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.attachButton}>
            <Plus size={24} color={AppColors.foregroundDimmer} />
          </TouchableOpacity>

          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              placeholderTextColor={AppColors.foregroundDimmer}
              multiline
              maxLength={500}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              newMessage.trim() && !sending
                ? styles.sendButtonActive
                : styles.sendButtonInactive,
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator
                size="small"
                color={AppColors.backgroundDefault}
              />
            ) : (
              <Send
                size={20}
                color={
                  newMessage.trim()
                    ? AppColors.backgroundDefault
                    : AppColors.foregroundDimmer
                }
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Match Info Banner (for new matches) */}
      <View style={styles.matchBanner}>
        <Heart size={20} color={AppColors.accentDefault} />
        <Text style={styles.matchBannerText}>
          You and {name} liked each other!
        </Text>
        <TouchableOpacity>
          <Text style={styles.matchBannerAction}>View Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDimmer,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: AppColors.backgroundDefault,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.backgroundDimmer,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.foregroundDefault,
  },
  headerStatus: {
    fontSize: 12,
    color: '#4CAF50',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerAction: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 4,
  },
  ownMessageBubble: {
    backgroundColor: AppColors.accentDefault,
    borderBottomRightRadius: 6,
  },
  otherMessageBubble: {
    backgroundColor: AppColors.backgroundDefault,
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: AppColors.backgroundDefault,
  },
  otherMessageText: {
    color: AppColors.foregroundDefault,
  },
  messageTime: {
    fontSize: 11,
    marginHorizontal: 8,
  },
  ownMessageTime: {
    color: AppColors.foregroundDimmer,
  },
  otherMessageTime: {
    color: AppColors.foregroundDimmer,
  },
  inputContainer: {
    backgroundColor: AppColors.backgroundDefault,
    borderTopWidth: 1,
    borderTopColor: AppColors.backgroundDimmer,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  attachButton: {
    padding: 8,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: AppColors.backgroundDimmer,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  textInput: {
    fontSize: 16,
    color: AppColors.foregroundDefault,
    minHeight: 24,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: AppColors.accentDefault,
  },
  sendButtonInactive: {
    backgroundColor: AppColors.backgroundDimmer,
  },
  matchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.negativeDimmer,
    borderTopWidth: 1,
    borderTopColor: AppColors.backgroundDimmer,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  matchBannerText: {
    flex: 1,
    fontSize: 14,
    color: AppColors.foregroundDefault,
  },
  matchBannerAction: {
    fontSize: 14,
    color: AppColors.accentDefault,
    fontWeight: '500',
  },
});
