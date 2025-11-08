import AppInput from '@/app/components/ui/AppInput';
import AppText from '@/app/components/ui/AppText';
import Button from '@/app/components/ui/Button';
import IconButton from '@/app/components/ui/IconButton';
import ListItem from '@/app/components/ui/ListItem';
import ListItemWrapper from '@/app/components/ui/ListItemWrapper';
import Sheet from '@/app/components/ui/Sheet';
import { useThemeAware } from '@/app/contexts/ThemeContext';
import { useToast } from '@/app/contexts/ToastContext';
import { ReportReason } from '@/types/report';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Ban,
  Check,
  ChevronRight,
  FlagIcon,
  MoreVertical,
  Send,
  User2,
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser } from '../api/authService';
import { blockUser, getBlockedUsers, unblockUser } from '../api/blockingApi';
import {
  createOrGetConversation,
  sendMessage as sendMessageAPI,
} from '../api/chatApi';
import { createReport } from '../api/reportsApi';
import { AppColors } from '../components/AppColors';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Pressable from '../components/ui/Pressable';
import { useMessages } from '../hooks/useMessages';

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
  const { showToast } = useToast();

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
    netid: routeNetid,
  } = useLocalSearchParams();

  // Ensure params are strings, not arrays
  const netid = Array.isArray(routeNetid) ? routeNetid[0] : routeNetid;

  // Debug logging
  useEffect(() => {
    console.log('Chat detail params:', {
      conversationId: routeConversationId,
      userId,
      name,
      netid,
    });
  }, [routeConversationId, userId, name, netid]);

  const [conversationId, setConversationId] = useState<string | null>(
    (routeConversationId as string) || null
  );
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const currentUser = getCurrentUser();
  const flatListRef = useRef<FlatList>(null);

  // Animation for send button
  const sendButtonAnim = useRef(new Animated.Value(0)).current;

  const { messages: firebaseMessages, loading } = useMessages(conversationId);

  // Animate send button in/out based on message input
  useEffect(() => {
    const hasText = newMessage.trim().length > 0;
    Animated.spring(sendButtonAnim, {
      toValue: hasText ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 60,
    }).start();
  }, [newMessage, sendButtonAnim]);

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

  // Helper function to determine if we should show timestamp
  const shouldShowTimestamp = (
    currentMessage: Message,
    nextMessage: Message | null
  ) => {
    if (!nextMessage) return true; // Always show on last message in group

    // Show timestamp if next message is from different sender
    if (currentMessage.isOwn !== nextMessage.isOwn) return true;

    // Show timestamp if messages are more than 5 minutes apart
    const timeDiff = Math.abs(
      nextMessage.timestamp.getTime() - currentMessage.timestamp.getTime()
    );
    const fiveMinutes = 5 * 60 * 1000;
    if (timeDiff > fiveMinutes) return true;

    return false; // Same sender and within 5 minutes - don't show
  };

  // Helper function to determine message position in group
  const getMessagePosition = (
    currentMessage: Message,
    prevMessage: Message | null,
    nextMessage: Message | null
  ): 'single' | 'first' | 'middle' | 'last' => {
    const isGroupedWithPrev =
      prevMessage &&
      prevMessage.isOwn === currentMessage.isOwn &&
      Math.abs(
        currentMessage.timestamp.getTime() - prevMessage.timestamp.getTime()
      ) <=
        5 * 60 * 1000;

    const isGroupedWithNext =
      nextMessage &&
      nextMessage.isOwn === currentMessage.isOwn &&
      Math.abs(
        nextMessage.timestamp.getTime() - currentMessage.timestamp.getTime()
      ) <=
        5 * 60 * 1000;

    if (!isGroupedWithPrev && !isGroupedWithNext) return 'single';
    if (!isGroupedWithPrev && isGroupedWithNext) return 'first';
    if (isGroupedWithPrev && isGroupedWithNext) return 'middle';
    return 'last'; // isGroupedWithPrev && !isGroupedWithNext
  };

  const getBubbleStyle = (isOwn: boolean, position: string) => {
    const baseRadius = 24;
    const tightRadius = 6;

    if (isOwn) {
      // Own messages (right side)
      switch (position) {
        case 'single':
          return {
            borderTopLeftRadius: baseRadius,
            borderTopRightRadius: baseRadius,
            borderBottomLeftRadius: baseRadius,
            borderBottomRightRadius: tightRadius,
          };
        case 'first':
          return {
            borderTopLeftRadius: baseRadius,
            borderTopRightRadius: baseRadius,
            borderBottomLeftRadius: baseRadius,
            borderBottomRightRadius: tightRadius,
          };
        case 'middle':
          return {
            borderTopLeftRadius: baseRadius,
            borderTopRightRadius: tightRadius,
            borderBottomLeftRadius: baseRadius,
            borderBottomRightRadius: tightRadius,
          };
        case 'last':
          return {
            borderTopLeftRadius: baseRadius,
            borderTopRightRadius: tightRadius,
            borderBottomLeftRadius: baseRadius,
            borderBottomRightRadius: baseRadius,
          };
      }
    } else {
      // Other's messages (left side)
      switch (position) {
        case 'single':
          return {
            borderTopLeftRadius: baseRadius,
            borderTopRightRadius: baseRadius,
            borderBottomLeftRadius: tightRadius,
            borderBottomRightRadius: baseRadius,
          };
        case 'first':
          return {
            borderTopLeftRadius: baseRadius,
            borderTopRightRadius: baseRadius,
            borderBottomLeftRadius: tightRadius,
            borderBottomRightRadius: baseRadius,
          };
        case 'middle':
          return {
            borderTopLeftRadius: tightRadius,
            borderTopRightRadius: baseRadius,
            borderBottomLeftRadius: tightRadius,
            borderBottomRightRadius: baseRadius,
          };
        case 'last':
          return {
            borderTopLeftRadius: tightRadius,
            borderTopRightRadius: baseRadius,
            borderBottomLeftRadius: baseRadius,
            borderBottomRightRadius: baseRadius,
          };
      }
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const prevMessage = index > 0 ? displayMessages[index - 1] : null;
    const nextMessage =
      index < displayMessages.length - 1 ? displayMessages[index + 1] : null;
    const showTimestamp = shouldShowTimestamp(item, nextMessage);
    const position = getMessagePosition(item, prevMessage, nextMessage);
    const bubbleStyle = getBubbleStyle(item.isOwn, position);

    return (
      <View
        style={[
          styles.messageContainer,
          item.isOwn
            ? styles.ownMessageContainer
            : styles.otherMessageContainer,
          // Add less margin for grouped messages
          position === 'middle' || position === 'first'
            ? { marginBottom: 0 }
            : { marginBottom: 4 },
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: item.isOwn
                ? AppColors.accentDefault
                : AppColors.backgroundDimmer,
            },
            bubbleStyle,
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
        {showTimestamp && (
          <AppText
            style={[
              styles.messageTime,
              item.isOwn ? styles.ownMessageTime : styles.otherMessageTime,
            ]}
          >
            {formatTime(item.timestamp)}
          </AppText>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <IconButton
          onPress={() => router.back()}
          variant="secondary"
          icon={ArrowLeft}
        />

        <Pressable
          onPress={() => {
            if (!netid) {
              showToast({
                icon: <User2 size={20} color={AppColors.backgroundDefault} />,
                label: 'Unable to view profile. User information is missing.',
              });
              return;
            }
            setShowOptionsSheet(false);
            router.push(`/view-profile?netid=${netid}` as any);
          }}
        >
          <AppText variant="subtitle">{name}</AppText>
        </Pressable>

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
          <LoadingSpinner />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={displayMessages}
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
              left={<User2 size={20} />}
              right={<ChevronRight size={20} />}
              title="View profile"
              onPress={() => {
                if (!netid) {
                  showToast({
                    icon: (
                      <User2 size={20} color={AppColors.backgroundDefault} />
                    ),
                    label:
                      'Unable to view profile. User information is missing.',
                  });
                  return;
                }
                setShowOptionsSheet(false);
                router.push(`/view-profile?netid=${netid}` as any);
              }}
            />

            <ListItem
              left={<FlagIcon color={AppColors.negativeDefault} size={20} />}
              title="Report"
              destructive
              onPress={() => {
                setSheetView('report');
              }}
            />

            <ListItem
              left={<Ban color={AppColors.negativeDefault} size={20} />}
              title="Block"
              destructive
              onPress={() => {
                setSheetView('block');
              }}
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
              style={{ height: 128 }}
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

                    showToast({
                      icon: (
                        <Check size={20} color={AppColors.backgroundDefault} />
                      ),
                      label: 'Report submitted',
                    });

                    setShowOptionsSheet(false);
                    setTimeout(() => {
                      setSheetView('menu');
                      setReportText('');
                      setReportReason('inappropriate_content');
                    }, 300);
                  } catch (err: any) {
                    console.error('Error submitting report:', err);
                    showToast({
                      icon: (
                        <FlagIcon
                          size={20}
                          color={AppColors.backgroundDefault}
                        />
                      ),
                      label:
                        err.message ||
                        'Failed to submit report. Please try again.',
                    });
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
                      showToast({
                        icon: (
                          <Check
                            size={20}
                            color={AppColors.backgroundDefault}
                          />
                        ),
                        label: `Unblocked ${name}`,
                      });
                    } else {
                      await blockUser(netid as string);
                      setIsBlocked(true);
                      showToast({
                        icon: (
                          <Check
                            size={20}
                            color={AppColors.backgroundDefault}
                          />
                        ),
                        label: `Blocked ${name}`,
                      });
                      // Navigate back to chat list after blocking
                      router.back();
                    }

                    setShowOptionsSheet(false);
                    setTimeout(() => setSheetView('menu'), 300);
                  } catch (error: any) {
                    showToast({
                      icon: (
                        <Ban size={20} color={AppColors.backgroundDefault} />
                      ),
                      label:
                        error.message ||
                        `Failed to ${isBlocked ? 'unblock' : 'block'} user`,
                    });
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
          <AppInput
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Send a message..."
            placeholderTextColor={AppColors.foregroundDimmer}
            multiline
            fullRound
            style={styles.messageInput}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />

          <Animated.View
            style={[
              styles.sendButtonContainer,
              {
                transform: [
                  {
                    translateX: sendButtonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [80, -62], // Slide in from right (80px off-screen)
                    }),
                  },
                  {
                    rotate: sendButtonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['15deg', '0deg'], // Slight rotation
                    }),
                  },
                  {
                    scale: sendButtonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1], // Scale up for bounce effect
                    }),
                  },
                ],
                opacity: sendButtonAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.5, 1],
                }),
              },
            ]}
            pointerEvents={newMessage.trim() ? 'auto' : 'none'}
          >
            <IconButton
              onPress={sendMessage}
              disabled={sending}
              icon={Send}
              style={styles.sendButton}
            />
          </Animated.View>
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
    backgroundColor: AppColors.backgroundDefault,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.backgroundDimmest,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginTop: 4,
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
    padding: 18,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 0,
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
    borderTopColor: AppColors.backgroundDimmest,
    minHeight: 80,
  },
  inputRow: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 48,
    marginBottom: 8,
    flex: 1,
    gap: 8,
  },
  textInputContainer: {
    minHeight: 80,
    flex: 1,
  },
  messageInput: {
    height: 54,
    paddingTop: 17,
    paddingLeft: 20,
    paddingRight: 64,
    borderRadius: 24,
    fontSize: 16,
    width: 390,
  },
  sendButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 50,
    height: 50,
    top: 25,
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
