import { StyleSheet } from 'react-native';
import { AppColors } from '../components/AppColors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
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
    position: 'relative',
    backgroundColor: AppColors.backgroundDefault,
    borderTopWidth: 1,
    borderTopColor: AppColors.backgroundDimmest,
    zIndex: 30,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 10,
    minHeight: 56,
    gap: 8,
  },
  inputRowEditing: {
    gap: 12,
  },
  editInputContainer: {
    flex: 1,
  },
  textInputContainer: {
    minHeight: 80,
    flex: 1,
  },
  messageInput: {
    height: 32,
    paddingTop: 17,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 24,
    fontSize: 16,
    flex: 1,
  },
  messageInputEditing: {
    paddingRight: 20,
  },
  sendButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 45,
    height: 45,
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
  messageBubbleFrame: {
    borderRadius: 24,
  },
  unsentMessageRow: {
    alignSelf: 'stretch',
    maxWidth: '100%',
    alignItems: 'center',
  },
  unsentCenteredText: {
    color: AppColors.foregroundDimmer,
    fontStyle: 'italic',
    fontSize: 12,
  },
  editSideButton: {
    width: 45,
    height: 45,
  },
  editingBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    zIndex: 20,
  },
  inputContainerEditingDimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    zIndex: 1,
  },
  editingControlsRow: {
    zIndex: 2,
  },
});

export default styles;
