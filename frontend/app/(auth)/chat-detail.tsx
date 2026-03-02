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
  Pencil,
  Send,
  Trash2,
  User2,
  X
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser } from '../api/authService';
import { blockUser, getBlockedUsers, unblockUser } from '../api/blockingApi';
import {
  createOrGetConversation,
  editMessage as editMessageAPI,
  sendMessage as sendMessageAPI,
  unsendMessage as unsendMessageAPI
} from '../api/chatApi';
import { createReport } from '../api/reportsApi';
import { AppColors } from '../components/AppColors';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Pressable from '../components/ui/Pressable';
import { useMessages } from '../hooks/useMessages';
import { isMessageValid } from '../utils/chatUtils';
import styles from './chat-detail.styles';

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
  isUnsent?: boolean;
  editTimestamp?: Date | null;
  unsentTimestamp?: Date | null;
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
  const toastErrorIcon = <Ban size={20} color={AppColors.backgroundDefault} />;
  const toastUserIcon = <User2 size={20} color={AppColors.backgroundDefault} />;
  const toastSuccessIcon = <Check size={20} color={AppColors.backgroundDefault} />;
  const toastReportIcon = <FlagIcon size={20} color={AppColors.backgroundDefault} />;

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
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [showMessageActionsSheet, setShowMessageActionsSheet] = useState(false);

  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [messageActionLoading, setMessageActionLoading] = useState(false);

  const {
    conversationId: routeConversationId,
    userId: routeUserId,
    name: routeName,
    netid: routeNetid,
  } = useLocalSearchParams();

  // Ensure params are strings, not arrays
  const netid = Array.isArray(routeNetid) ? routeNetid[0] : routeNetid;
  const userId = Array.isArray(routeUserId) ? routeUserId[0] : routeUserId;
  const name = Array.isArray(routeName) ? routeName[0] : routeName;
  const initialConversationId = Array.isArray(routeConversationId)
    ? routeConversationId[0]
    : routeConversationId;

  // Debug logging
  useEffect(() => {
    console.log('Chat detail params:', {
      conversationId: initialConversationId,
      userId,
      name,
      netid,
    });
  }, [initialConversationId, userId, name, netid]);

  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId || null
  );
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const currentUser = getCurrentUser();
  const flatListRef = useRef<FlatList>(null);

  // Animation for send button
  const sendButtonAnim = useRef(new Animated.Value(0)).current;

  const {
    messages: firebaseMessages,
    loading,
  } = useMessages(conversationId);

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

  const toDateOrNull = (value: any): Date | null => {
    if (!value) return null;

    if (typeof value?.toDate === 'function') {
      const d = value.toDate();
      return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  // Transform Firebase messages to display format
  const displayMessages: Message[] = firebaseMessages.map((msg) => ({
    id: msg.id,
    text: msg.text,
    timestamp: toDateOrNull(msg.timestamp) || new Date(),
    isOwn: msg.senderId === currentUser?.uid,
    isUnsent: !!msg.isUnsent,
    editTimestamp: toDateOrNull(msg.editTimestamp),
    unsentTimestamp: toDateOrNull(msg.unsentTimestamp),
  }));

  const handleMessageLongPress = (msg: Message) => {
    if (!msg.isOwn || msg.isUnsent) return;

    setSelectedMessageId(msg.id);
    setShowMessageActionsSheet(true);
  };

  const closeMessageActions = () => {
    setShowMessageActionsSheet(false);
    setTimeout(() => setSelectedMessageId(null), 200);
  };

  const handleStartEditMessage = () => {
    const target = displayMessages.find((m) => m.id === selectedMessageId);
    if (!target || target.isUnsent) return;

    setEditDraft(target.text);
    setEditingMessageId(target.id);
    setIsEditingMessage(true);
    setShowMessageActionsSheet(false);
  };

  const handleUnsendSelectedMessage = async () => {
    if (!conversationId || !selectedMessageId) return;

    try {
      setMessageActionLoading(true);
      await unsendMessageAPI(conversationId, selectedMessageId);
      closeMessageActions();
    } catch (err: any) {
      showToast({
        icon: toastErrorIcon,
        label: err.message || 'Failed to unsend message',
      });
    } finally {
      setMessageActionLoading(false);
    }
  };

  const handleConfirmEditMessage = async () => {
    if (!conversationId || !editingMessageId) return;

    const trimmed = editDraft.trim();
    if (!trimmed) return;

    if (!isMessageValid(trimmed)) {
      showToast({
        icon: toastErrorIcon,
        label: 'Message contains inappropriate content',
      });
      return;
    }

    try {
      setMessageActionLoading(true);
      await editMessageAPI(conversationId, editingMessageId, trimmed);

      setIsEditingMessage(false);
      setEditingMessageId(null);
      setEditDraft('');
      Keyboard.dismiss();
    } catch (err: any) {
      showToast({
        icon: toastErrorIcon,
        label: err.message || 'Failed to edit message',
      });
    } finally {
      setMessageActionLoading(false);
    }
  };

  const handleCancelEditMessage = () => {
    setIsEditingMessage(false);
    setEditingMessageId(null);
    setEditDraft('');
    Keyboard.dismiss();
  };

  const sendMessage = async () => {
    if (newMessage.trim() && conversationId) {
      const messageText = newMessage.trim();

      if (!isMessageValid(messageText)) {
        showToast({
          icon: toastErrorIcon,
          label: 'Message contains inappropriate content',
        });
        return;
      }

      // We check locally to see if the recepient is blocked or not
      if (isBlocked) {
        showToast({
          icon: toastErrorIcon,
          label: 'Cannot send message to blocked user',
        });
        return;
      }

      setNewMessage('');
      setSending(true);

      try {
        await sendMessageAPI(conversationId, messageText);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (error: any) {
        // Restore the message text
        setNewMessage(messageText);

        // This is a very hacky way to do error-handling (probably should fix soon...)
        const isBlockingError =
          error.response?.status === 403 ||
          error.message === 'Cannot send message to this user' ||
          error.message === 'Cannot access this conversation';

        if (isBlockingError) {
          console.log('Message blocked due to user blocking:', error.message);
          showToast({
            icon: toastErrorIcon,
            label: 'You have been blocked by this user',
          });
        } else {
          // Should we log all other errors with toasts?
          console.error('Error sending message:', error);
          showToast({
            icon: toastErrorIcon,
            label: 'Failed to send message. Please try again.',
          });
        }
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

  // Helper function to determine whether editing/unsending message option shows up or not
  const EDIT_WINDOW_MS = 15 * 60 * 1000;
  const canModifyMessage = (msg: Message) => {
    if (!msg.isOwn) return false;
    if (msg.isUnsent) return false;

    const ageMs = Date.now() - msg.timestamp.getTime();
    return ageMs >= 0 && ageMs <= EDIT_WINDOW_MS;
  };

  const selectedMessage =
    displayMessages.find((m) => m.id === selectedMessageId) || null;
  const canModifySelectedMessage = selectedMessage
    ? canModifyMessage(selectedMessage)
    : false;

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

    const isSelected = item.id === selectedMessageId;
    const isEdited = !!item.editTimestamp && !item.isUnsent;

    if (item.isUnsent) {
      return (
        <View
          style={[
            styles.messageContainer,
            styles.unsentMessageRow,
            position === 'middle' || position === 'first'
              ? { marginBottom: 0 }
              : { marginBottom: 4 },
          ]}
        >
          <AppText style={styles.unsentCenteredText}>
            {item.isOwn ? 'You unsent a message' : 'This message was unsent'}
          </AppText>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageContainer,
          item.isOwn ? styles.ownMessageContainer : styles.otherMessageContainer,
          position === 'middle' || position === 'first'
            ? { marginBottom: 0 }
            : { marginBottom: 4 },
        ]}
      >
        <Pressable
          onLongPress={() => handleMessageLongPress(item)}
          disabled={!item.isOwn || item.isUnsent}
        >
          <Animated.View
            style={[
              styles.messageBubbleFrame,
              {
                opacity: isSelected ? 0.7 : 1,
                transform: [{ scale: isSelected ? 0.9 : 1 }],
              },
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
          </Animated.View>
        </Pressable>

        {showTimestamp && (
          <AppText
            style={[
              styles.messageTime,
              item.isOwn ? styles.ownMessageTime : styles.otherMessageTime,
            ]}
          >
            {formatTime(item.timestamp)}
            {isEdited ? ' · edited' : ''}
          </AppText>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: AppColors.backgroundDefault },
      ]}
    >
      <StatusBar />

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
                icon: toastUserIcon,
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
              : isBlocked
                ? 'Unblock user'
                : 'Block user'
        }
      >
        {sheetView === 'menu' && (
          <ListItemWrapper>
            <ListItem
              left={<User2 size={20} color={AppColors.foregroundDefault} />}
              right={
                <ChevronRight size={20} color={AppColors.foregroundDimmer} />
              }
              title="View profile"
              onPress={() => {
                if (!netid) {
                  showToast({
                    icon: toastUserIcon,
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
              title={isBlocked ? 'Unblock' : 'Block'}
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
                      icon: toastSuccessIcon,
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
                      icon: toastReportIcon,
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
                        icon: toastSuccessIcon,
                        label: `Unblocked ${name}`,
                      });
                    } else {
                      await blockUser(netid as string);
                      setIsBlocked(true);
                      showToast({
                        icon: toastSuccessIcon,
                        label: `Blocked ${name}`,
                      });
                      // Navigate back to chat list after blocking
                      router.back();
                    }

                    setShowOptionsSheet(false);
                    setTimeout(() => setSheetView('menu'), 300);
                  } catch (error: any) {
                    showToast({
                      icon: toastErrorIcon,
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

      <Sheet
        visible={showMessageActionsSheet}
        onDismiss={closeMessageActions}
        title="Message options"
      >
        {canModifySelectedMessage ? (
          <ListItemWrapper>
            <ListItem
              left={<Pencil size={20} color={AppColors.foregroundDefault} />}
              title="Edit message"
              onPress={handleStartEditMessage}
            />
            <ListItem
              left={<Trash2 size={20} color={AppColors.negativeDefault} />}
              title={messageActionLoading ? 'Unsending...' : 'Unsend'}
              destructive
              onPress={handleUnsendSelectedMessage}
            />
          </ListItemWrapper>
        ) : (
          <View style={styles.sheetContent}>
            <AppText color="dimmer">
              Cannot edit or unsend messages after 15 minutes.
            </AppText>
          </View>
        )}
      </Sheet>

      {isEditingMessage && <View style={styles.editingBackdrop} />}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={styles.inputContainer}
      >
        {isEditingMessage && (
          <View
            pointerEvents="none"
            style={styles.inputContainerEditingDimmer}
          />
        )}
        {isEditingMessage ? (
          <View
            style={[
              styles.inputRow,
              styles.inputRowEditing,
              styles.editingControlsRow,
            ]}
          >
            <IconButton
              onPress={handleCancelEditMessage}
              disabled={messageActionLoading}
              icon={X}
              variant="secondary"
              style={styles.editSideButton}
            />
            <View style={styles.editInputContainer}>
              <AppInput
                value={editDraft}
                onChangeText={setEditDraft}
                placeholder="Edit message..."
                placeholderTextColor={AppColors.foregroundDimmer}
                fullRound
                style={[styles.messageInput, styles.messageInputEditing]}
                onSubmitEditing={handleConfirmEditMessage}
                returnKeyType="done"
                blurOnSubmit={false}
                enablesReturnKeyAutomatically
                forceMinHeight
                fullWidth
              />
            </View>
            <IconButton
              onPress={handleConfirmEditMessage}
              disabled={messageActionLoading}
              icon={Check}
              style={styles.editSideButton}
            />
          </View>
        ) : (
          <View style={styles.inputRow}>
            <AppInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Send a message..."
              placeholderTextColor={AppColors.foregroundDimmer}
              fullRound
              style={styles.messageInput}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              blurOnSubmit={false}
              enablesReturnKeyAutomatically
              forceMinHeight
              fullWidth
            />
            <IconButton
              onPress={sendMessage}
              disabled={sending}
              icon={Send}
              style={styles.sendButton}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
