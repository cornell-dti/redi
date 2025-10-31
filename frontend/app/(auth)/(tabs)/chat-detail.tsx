import AppInput from '@/app/components/ui/AppInput';
import AppText from '@/app/components/ui/AppText';
import Button from '@/app/components/ui/Button';
import IconButton from '@/app/components/ui/IconButton';
import ListItem from '@/app/components/ui/ListItem';
import ListItemWrapper from '@/app/components/ui/ListItemWrapper';
import Sheet from '@/app/components/ui/Sheet';
import { useThemeAware } from '@/app/contexts/ThemeContext';
import { ReportReason } from '@/types/report';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Ban,
  Check,
  FlagIcon,
  MoreVertical,
  Send,
  User2,
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser } from '../../api/authService';
import { blockUser, getBlockedUsers, unblockUser } from '../../api/blockingApi';
import {
  createOrGetConversation,
  sendMessage as sendMessageAPI,
} from '../../api/chatApi';
import { createReport } from '../../api/reportsApi';
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

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'spam', label: 'Spam' },
  { value: 'fake_profile', label: 'Fake Profile' },
  { value: 'other', label: 'Other' },
];

export default function ChatDetailScreen() {
  useThemeAware();

  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  type SheetView = 'menu' | 'report' | 'block';
  const [sheetView, setSheetView] = useState<SheetView>('menu');
  const [reportText, setReportText] = useState('');
  const [reportReason, setReportReason] = useState<ReportReason>(
    'inappropriate_content'
  );
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blocking, setBlocking] = useState(false);

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

  // Check if user is blocked - re-check whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const checkIfBlocked = async () => {
        if (!netid || !currentUser?.email) return;

        const currentNetid = currentUser.email.split('@')[0];
        try {
          const response = await getBlockedUsers(currentNetid);
          setIsBlocked(response.blockedUsers.includes(netid as string));
        } catch (error) {
          console.error('Error checking blocked status:', error);
        }
      };

      checkIfBlocked();
    }, [netid, currentUser])
  );

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
          item.isOwn
            ? {
                backgroundColor: AppColors.accentDefault,
                borderBottomRightRadius: 6,
              }
            : {
                backgroundColor: AppColors.backgroundDimmer,
                borderBottomLeftRadius: 4,
              },
        ]}
      >
        <AppText
          style={[
            item.isOwn
              ? { color: AppColors.backgroundDefault }
              : { color: AppColors.foregroundDefault },
          ]}
        >
          {item.text}
        </AppText>
      </View>
      <AppText
        style={[
          styles.messageTime,
          item.isOwn ? styles.ownMessageTime : styles.otherMessageTime,
        ]}
      >
        {formatTime(item.timestamp)}
      </AppText>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <IconButton
          onPress={() => router.replace('/chat' as any)}
          variant="secondary"
          icon={ArrowLeft}
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
              Help us understand what&apos;s wrong with this user. Your report
              is anonymous.
            </AppText>

            {/* Reason selector */}
            <View style={styles.reasonSelector}>
              <AppText indented color="dimmer">
                Reason:
              </AppText>

              <ListItemWrapper>
                {REPORT_REASONS.map((reason) => (
                  <ListItem
                    selected={reportReason === reason.value}
                    key={reason.value}
                    title={reason.label}
                    onPress={() => setReportReason(reason.value)}
                    right={
                      reportReason === reason.value ? (
                        <Check size={20} color={AppColors.accentDefault} />
                      ) : null
                    }
                  />
                ))}
              </ListItemWrapper>
            </View>

            <AppInput
              label="Describe the issue (10-1000 characters)"
              placeholder="Please add some details..."
              value={reportText}
              onChangeText={setReportText}
              multiline
              numberOfLines={4}
              style={{ minHeight: 128 }}
            />

            <View style={styles.buttonRow}>
              <Button
                title={isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                onPress={async () => {
                  if (!netid) return;

                  try {
                    setIsSubmittingReport(true);
                    await createReport({
                      reportedNetid: netid as string,
                      reason: reportReason,
                      description: reportText.trim(),
                    });

                    Alert.alert(
                      'Report Submitted',
                      'Thank you for helping keep our community safe. We will review your report.',
                      [{ text: 'OK' }]
                    );

                    setShowOptionsSheet(false);
                    setTimeout(() => {
                      setSheetView('menu');
                      setReportText('');
                      setReportReason('inappropriate_content');
                    }, 300);
                  } catch (err: any) {
                    console.error('Error submitting report:', err);
                    Alert.alert(
                      'Error',
                      err.message ||
                        'Failed to submit report. Please try again.',
                      [{ text: 'OK' }]
                    );
                  } finally {
                    setIsSubmittingReport(false);
                  }
                }}
                variant="negative"
                disabled={
                  !reportText.trim() ||
                  reportText.trim().length < 10 ||
                  isSubmittingReport
                }
                iconLeft={FlagIcon}
              />
              <Button
                title="Cancel"
                onPress={() => {
                  setSheetView('menu');
                  setReportText('');
                  setReportReason('inappropriate_content');
                }}
                variant="secondary"
                disabled={isSubmittingReport}
              />
            </View>
          </View>
        )}

        {sheetView === 'block' && (
          <View style={styles.sheetContent}>
            <AppText>
              {isBlocked
                ? `Unblock ${name}? They will be able to see your profile and message you again.`
                : `${name} will no longer be able to see your profile or message you. This action can be undone in settings.`}
            </AppText>

            <View style={styles.buttonRow}>
              <Button
                title={
                  blocking
                    ? isBlocked
                      ? 'Unblocking...'
                      : 'Blocking...'
                    : isBlocked
                      ? 'Unblock User'
                      : 'Block User'
                }
                onPress={async () => {
                  if (!netid) return;

                  try {
                    setBlocking(true);

                    if (isBlocked) {
                      await unblockUser(netid as string);
                      setIsBlocked(false);
                      Alert.alert('Success', `Unblocked ${name}`);
                    } else {
                      await blockUser(netid as string);
                      setIsBlocked(true);
                      Alert.alert('Success', `Blocked ${name}`, [
                        {
                          text: 'OK',
                          onPress: () => {
                            // Navigate back to chat list after blocking
                            router.replace('/chat' as any);
                          },
                        },
                      ]);
                    }

                    setShowOptionsSheet(false);
                    setTimeout(() => setSheetView('menu'), 300);
                  } catch (error: any) {
                    Alert.alert(
                      'Error',
                      error.message ||
                        `Failed to ${isBlocked ? 'unblock' : 'block'} user`
                    );
                  } finally {
                    setBlocking(false);
                  }
                }}
                variant="negative"
                iconLeft={Ban}
                disabled={blocking}
              />
              <Button
                title="Cancel"
                onPress={() => setSheetView('menu')}
                variant="secondary"
                disabled={blocking}
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
          <View
            style={[
              styles.textInputContainer,
              !newMessage.trim() && { flex: 1 },
            ]}
          >
            <AppInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Send a message..."
              placeholderTextColor={AppColors.foregroundDimmer}
              multiline
              fullRound
              style={styles.messageInput}
              onSubmitEditing={sendMessage}
            />
          </View>

          {!!newMessage.trim() && (
            <IconButton
              onPress={sendMessage}
              disabled={sending}
              icon={Send}
              style={styles.sendButton}
            />
          )}
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
    paddingBottom: 64,
    marginBottom: 24,
    flex: 1,
    gap: 8,
  },
  textInputContainer: {
    minHeight: 48,
    width: '85%',
  },
  messageInput: {
    height: 48,
    paddingTop: 14,
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
  reasonSelector: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  radioSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: AppColors.accentDefault,
    borderWidth: 2,
    borderColor: AppColors.accentDefault,
  },
  radioUnselected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: AppColors.foregroundDimmer,
  },
});
