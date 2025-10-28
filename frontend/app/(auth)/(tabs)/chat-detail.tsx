import AppInput from '@/app/components/ui/AppInput';
import AppText from '@/app/components/ui/AppText';
import Button from '@/app/components/ui/Button';
import IconButton from '@/app/components/ui/IconButton';
import ListItem from '@/app/components/ui/ListItem';
import ListItemWrapper from '@/app/components/ui/ListItemWrapper';
import Sheet from '@/app/components/ui/Sheet';
import { useThemeAware } from '@/app/contexts/ThemeContext';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Ban,
  ChevronLeft,
  FlagIcon,
  MoreVertical,
  Send,
  User2,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
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
  useThemeAware();

  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  type SheetView = 'menu' | 'report' | 'block';
  const [sheetView, setSheetView] = useState<SheetView>('menu');
  const [reportText, setReportText] = useState('');

  const {
    conversationId: routeConversationId,
    userId,
    name,
    netid,
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
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (error) {
        console.error('Error sending message:', error);
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
          style={[item.isOwn ? styles.ownMessageText : styles.otherMessageText]}
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

      <View style={styles.header}>
        <IconButton
          onPress={() => router.replace('/chat' as any)}
          variant="secondary"
          icon={ChevronLeft}
        />

        <AppText variant="subtitle">{name}</AppText>

        <IconButton
          onPress={() => setShowOptionsSheet(true)}
          variant="secondary"
          icon={MoreVertical}
        />
      </View>

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

      {/* Options sheet for chat actions (view profile / report / block) */}
      <Sheet
        visible={showOptionsSheet}
        onDismiss={() => {
          setShowOptionsSheet(false);
          // reset view after sheet closes
          setTimeout(() => setSheetView('menu'), 300);
        }}
        title={
          sheetView === 'menu'
            ? 'More options'
            : sheetView === 'report'
              ? 'Report user'
              : 'Block user'
        }
      >
        {sheetView === 'menu' && (
          <ListItemWrapper>
            <ListItem
              left={<User2 />}
              title="View profile"
              onPress={() => {
                setShowOptionsSheet(false);
                router.push(`/view-profile?netid=${netid}` as any);
              }}
            />

            <ListItem
              left={<FlagIcon color={AppColors.negativeDefault} />}
              title="Report"
              destructive
              onPress={() => setSheetView('report')}
            />

            <ListItem
              left={<Ban color={AppColors.negativeDefault} />}
              title="Block"
              destructive
              onPress={() => setSheetView('block')}
            />
          </ListItemWrapper>
        )}

        {sheetView === 'report' && (
          <View style={styles.sheetContent}>
            <AppText>
              Help us understand what's wrong with this user. Your report is
              anonymous.
            </AppText>

            <AppInput
              placeholder="Describe the issue..."
              value={reportText}
              onChangeText={setReportText}
              multiline
              numberOfLines={4}
              style={{ minHeight: 128 }}
            />

            <View style={styles.buttonRow}>
              <Button
                title="Submit Report"
                onPress={() => {
                  console.log('Report submitted:', reportText, 'for', userId);
                  setShowOptionsSheet(false);
                  setTimeout(() => {
                    setSheetView('menu');
                    setReportText('');
                  }, 300);
                }}
                variant="negative"
                disabled={!reportText.trim()}
                iconLeft={FlagIcon}
              />
              <Button
                title="Cancel"
                onPress={() => {
                  setSheetView('menu');
                  setReportText('');
                }}
                variant="secondary"
              />
            </View>
          </View>
        )}

        {sheetView === 'block' && (
          <View style={styles.sheetContent}>
            <AppText>
              The user will no longer be able to see your profile or message
              you. This action can be undone in settings.
            </AppText>

            <View style={styles.buttonRow}>
              <Button
                title="Block User"
                onPress={() => {
                  console.log('User blocked:', userId);
                  setShowOptionsSheet(false);
                  setTimeout(() => setSheetView('menu'), 300);
                }}
                variant="negative"
                iconLeft={Ban}
              />
              <Button
                title="Cancel"
                onPress={() => setSheetView('menu')}
                variant="secondary"
              />
            </View>
          </View>
        )}
      </Sheet>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <View style={styles.textInputContainer}>
            <AppInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Send a message..."
              placeholderTextColor={AppColors.foregroundDimmer}
              multiline
              fullRound
              style={styles.messageInput}
            />
          </View>
          <IconButton
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
            icon={Send}
            style={styles.sendButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
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
    padding: 16,
    borderRadius: 24,
    marginBottom: 4,
  },
  ownMessageBubble: {
    backgroundColor: AppColors.accentDefault,
    borderBottomRightRadius: 6,
  },
  otherMessageBubble: {
    backgroundColor: AppColors.backgroundDimmer,
    borderBottomLeftRadius: 4,
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
    padding: 16,
    paddingBottom: 32,
    flex: 1,
    gap: 8,
  },
  textInputContainer: {
    minHeight: 48,
    width: '85%',
  },
  messageInput: {
    height: 48,
    borderRadius: 24,
  },
  sendButton: {
    width: 54,
    height: 54,
  },
  sendButtonActive: {
    backgroundColor: AppColors.accentDefault,
  },
  sendButtonInactive: {
    backgroundColor: AppColors.backgroundDimmer,
  },
  sheetContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  buttonRow: {
    display: 'flex',
    gap: 12,
  },
});
